import * as pdf from 'pdf-parse'
import { getDbClient } from '../db'
import { QdrantClientWrapper } from '../qdrant'
import { PromptRegistry } from '../prompt-registry'
import { getEmbedding } from '../embeddings'
import { mastra } from '../mastra-init'

export interface RawTransaction {
  date: string | null
  amount: number | null
  category: string
  merchant: string | null
  description: string | null
  flagged: boolean
  flag_reason: string | null
}

export interface IngestResult {
  document_id: string
  document_type: 'bank_statement' | 'credit_card_statement' | 'loan_document' | 'csv_export' | 'tax_document'
  extraction_date: string
  transactions: RawTransaction[]
  confidence_score: number
  needs_human_review: boolean
  incomplete: boolean
  metadata: {
    total_transactions: number
    flagged_count: number
    date_range: { start: string; end: string }
    prompt_version: string
    model_version: string
    embedding_version: string
  }
}

// Categorize transactions based on merchant description keywords
function heuristicCategorize(description: string, amount: number): string {
  const desc = description.toLowerCase()
  if (amount > 0) return 'INCOME'
  
  if (desc.includes('mortgage') || desc.includes('rent') || desc.includes('landlord') || desc.includes('housing')) {
    return 'HOUSING'
  }
  if (desc.includes('energy') || desc.includes('electric') || desc.includes('water') || desc.includes('gas') || desc.includes('utility') || desc.includes('internet') || desc.includes('comcast') || desc.includes('verizon')) {
    return 'UTILITIES'
  }
  if (desc.includes('whole foods') || desc.includes('grocery') || desc.includes('supermarket') || desc.includes('kroger') || desc.includes('walmart') || desc.includes('food') || desc.includes('restaurant') || desc.includes('uber eats') || desc.includes('mcdonald')) {
    return 'FOOD'
  }
  if (desc.includes('gas station') || desc.includes('shell') || desc.includes('chevron') || desc.includes('uber') || desc.includes('lyft') || desc.includes('transit') || desc.includes('subway') || desc.includes('metro')) {
    return 'TRANSPORT'
  }
  if (desc.includes('hospital') || desc.includes('medical') || desc.includes('clinic') || desc.includes('pharmacy') || desc.includes('cvs') || desc.includes('walgreens') || desc.includes('doctor')) {
    return 'HEALTHCARE'
  }
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('hulu') || desc.includes('steam') || desc.includes('movie') || desc.includes('concert') || desc.includes('theatre') || desc.includes('bar') || desc.includes('pub')) {
    return 'ENTERTAINMENT'
  }
  if (desc.includes('credit card') || desc.includes('loan') || desc.includes('chase card') || desc.includes('payment') || desc.includes('avalanche') || desc.includes('debt') || desc.includes('student loan')) {
    return 'DEBT_PAYMENT'
  }
  if (desc.includes('savings') || desc.includes('ira') || desc.includes('401k') || desc.includes('transfer to savings') || desc.includes('fidelity')) {
    return 'SAVINGS'
  }
  if (desc.includes('venmo') || desc.includes('zelle') || desc.includes('transfer') || desc.includes('wire')) {
    return 'TRANSFER'
  }
  return 'OTHER'
}

// Locally parses unstructured statement lines using heuristics
function parseTextToTransactions(text: string): RawTransaction[] {
  const transactions: RawTransaction[] = []
  const lines = text.split('\n')
  
  // Date format examples: 06/01/2025, 2025-06-01, 06-01-2025
  const linePattern = /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\s+([A-Za-z0-9\s#\-\.\*]+?)\s+([\+\-]?\$?\s*?\d{1,6}(?:\.\d{2})?)/

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const match = trimmed.match(linePattern)
    if (match) {
      const dateStr = match[1]
      const desc = match[2].trim()
      let amtStr = match[3].replace(/[\$\s,]/g, '')
      let amount = parseFloat(amtStr)

      // Normalize date format YYYY-MM-DD
      let normalizedDate = dateStr
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts[2].length === 4) {
          normalizedDate = `${parts[2]}-${parts[0]}-${parts[1]}`
        }
      }

      if (!isNaN(amount)) {
        // If line doesn't have positive sign and amount is not negative, assume negative for checkings unless positive keyword is found
        if (!line.includes('+') && amount > 0 && !desc.toLowerCase().includes('deposit') && !desc.toLowerCase().includes('salary')) {
          amount = -amount
        }

        transactions.push({
          date: normalizedDate,
          amount,
          category: heuristicCategorize(desc, amount),
          merchant: desc.split(/\s+#|#|\s+\d+/)[0].trim(),
          description: desc,
          flagged: false,
          flag_reason: null,
        })
      }
    } else if (trimmed.toLowerCase().includes('[unreadable]')) {
      transactions.push({
        date: null,
        amount: null,
        category: 'OTHER',
        merchant: null,
        description: trimmed,
        flagged: true,
        flag_reason: 'Transaction line is unreadable; amount and merchant could not be extracted from source document',
      })
    }
  }

  return transactions
}

export async function parsePdfDocument(buffer: Buffer): Promise<string> {
  const parsePdf = (pdf as any).default || pdf
  const data = await parsePdf(buffer)
  return data.text
}

export async function runIngestAgent(
  fileBuffer: Buffer,
  fileName: string,
  userId: string,
  documentId: string
): Promise<IngestResult> {
  let fileText = ''
  let document_type: IngestResult['document_type'] = 'bank_statement'

  if (fileName.endsWith('.pdf')) {
    fileText = await parsePdfDocument(fileBuffer)
    if (fileText.toLowerCase().includes('tax') || fileText.toLowerCase().includes('1040')) {
      document_type = 'tax_document'
    } else if (fileText.toLowerCase().includes('loan') || fileText.toLowerCase().includes('mortgage')) {
      document_type = 'loan_document'
    } else if (fileText.toLowerCase().includes('credit card') || fileText.toLowerCase().includes('payment')) {
      document_type = 'credit_card_statement'
    }
  } else {
    // Treat as CSV / spreadsheet text
    fileText = fileBuffer.toString('utf-8')
    document_type = 'csv_export'
  }

  let transactions: RawTransaction[] = []

  // Check if OpenAI API key is present for smart parsing
  if (process.env.OPENAI_API_KEY) {
    try {
      const mastraAgent = mastra.getAgent('ingest')
      const promptObj = await PromptRegistry.fetchPrompt('ingest')
      
      const apiKey = process.env.OPENAI_API_KEY || ''
      const isOpenRouter = apiKey.startsWith('sk-or-')
      const apiUrl = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
      const modelId = isOpenRouter ? 'google/gemini-2.5-flash:free' : promptObj.model_id

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }
      if (isOpenRouter) {
        headers['HTTP-Referer'] = 'http://localhost:3000'
        headers['X-Title'] = 'FinanceGuard'
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          temperature: promptObj.temperature,
          top_p: promptObj.top_p,
          max_tokens: promptObj.max_tokens,
          messages: [
            {
              role: 'system',
              content: promptObj.prompt_text,
            },
            {
              role: 'user',
              content: `Document Name: ${fileName}\n\nDocument Text:\n${fileText.substring(0, 8000)}`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      const data = await response.json()
      const resultObj = JSON.parse(data.choices[0].message.content)
      if (resultObj.transactions) {
        transactions = resultObj.transactions
      }
    } catch (e) {
      console.warn('AI Parsing failed, falling back to regex parser', e)
      transactions = parseTextToTransactions(fileText)
    }
  } else {
    transactions = parseTextToTransactions(fileText)
  }

  // Calculate metrics
  const total_transactions = transactions.length
  const flagged_count = transactions.filter(t => t.flagged).length
  
  // Find date range
  const validDates = transactions.map(t => t.date).filter(Boolean) as string[]
  let start = new Date().toISOString().split('T')[0]
  let end = start
  if (validDates.length > 0) {
    validDates.sort()
    start = validDates[0]
    end = validDates[validDates.length - 1]
  }

  // 1. Chunk document text
  const chunkSize = 512
  const overlap = 50
  const words = fileText.split(/\s+/)
  const chunks: string[] = []
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    chunks.push(words.slice(i, i + chunkSize).join(' '))
    if (i + chunkSize >= words.length) break
  }

  // 2. Vectorize chunks and upsert to Qdrant fallback
  const qdrant = new QdrantClientWrapper()
  await qdrant.initCollection('financial_documents')
  
  const vectorPoints = await Promise.all(
    chunks.map(async (chunkText, index) => {
      const vector = await getEmbedding(chunkText)
      return {
        id: `${documentId}-${index}`,
        vector,
        payload: {
          user_id: userId,
          document_id: documentId,
          document_type,
          upload_date: new Date().toISOString().split('T')[0],
          embedding_version: 'text-embedding-3-large-v1',
          chunk_index: index,
          total_chunks: chunks.length,
          text: chunkText,
        },
      }
    })
  )

  await qdrant.upsertPoints('financial_documents', vectorPoints)

  // 3. Write document metadata to relational database
  const db = getDbClient()
  await db.execute({
    sql: `INSERT OR REPLACE INTO documents_metadata (id, user_id, name, type, size, uploaded_at, status, chunks, embeddings, file_path)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'completed', ?, ?, ?)`,
    args: [
      documentId,
      userId,
      fileName,
      document_type === 'csv_export' ? 'spreadsheet' : 'pdf',
      parseFloat((fileBuffer.length / (1024 * 1024)).toFixed(2)),
      chunks.length,
      chunks.length,
      `uploads/${documentId}-${fileName}`,
    ],
  })

  // Return formatted IngestResult matching PRD
  return {
    document_id: documentId,
    document_type,
    extraction_date: new Date().toISOString(),
    transactions,
    confidence_score: total_transactions > 0 ? parseFloat((1 - (flagged_count / total_transactions)).toFixed(2)) : 1.0,
    needs_human_review: flagged_count > 0,
    incomplete: flagged_count > 0,
    metadata: {
      total_transactions,
      flagged_count,
      date_range: { start, end },
      prompt_version: '2.3.1',
      model_version: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'local-regex-v1',
      embedding_version: 'text-embedding-3-large-v1',
    },
  }
}
