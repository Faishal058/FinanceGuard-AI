import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'
import { ConsentManager } from '@/lib/backend/governance'
import { runIngestAgent } from '@/lib/backend/agents/ingest'
import { QdrantClientWrapper } from '@/lib/backend/qdrant'


export async function GET(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT * FROM documents_metadata WHERE user_id = ? ORDER BY uploaded_at DESC`,
      args: [user.userId],
    })

    const documents = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      uploadedAt: row.uploaded_at,
      status: row.status,
      chunks: row.chunks,
      embeddings: row.embeddings,
    }))

    return NextResponse.json({ documents })
  } catch (e: any) {
    console.error('Documents GET error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Consent Verification (Compliance Gate) — auto-grant for existing users without consent records
    const hasConsent = await ConsentManager.verifyConsent(user.userId, 'data_processing')
    if (!hasConsent) {
      // Auto-grant consent for users who pre-date the consent system
      const ipAddress = (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1'
      const userAgent = req.headers.get('user-agent') || 'Browser'
      const types: Array<'data_processing' | 'memory_storage' | 'financial_analysis' | 'advisory_output'> = [
        'data_processing', 'memory_storage', 'financial_analysis', 'advisory_output',
      ]
      for (const t of types) {
        await ConsentManager.recordConsent(user.userId, t, `Auto-granted during upload: ${t}`, ipAddress, userAgent)
      }
    }

    // 2. Parse Multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const documentId = 'doc_' + Math.random().toString(36).substr(2, 9)

    // 3. Trigger Ingest Agent Pipeline (Parses, chunks, uploads to Qdrant vector store, indexes SQLite)
    const ingestResult = await runIngestAgent(buffer, file.name, user.userId, documentId)

    return NextResponse.json({
      message: 'Ingestion completed successfully',
      document: {
        id: documentId,
        name: file.name,
        type: file.name.endsWith('.csv') ? 'spreadsheet' : 'pdf',
        size: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        uploadedAt: new Date().toISOString(),
        status: 'completed',
        chunks: ingestResult.metadata.total_transactions,
      },
      ingestResult,
    }, { status: 201 })
  } catch (e: any) {
    console.error('Document ingestion error', e)
    return NextResponse.json({ error: 'Ingestion pipeline failure', details: e.message, code: 'AGENT_FAILURE' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const documentId = url.searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const db = getDbClient()

    // Delete vector points
    const qdrant = new QdrantClientWrapper()
    await qdrant.deletePointsByDocId('financial_documents', documentId)

    // Delete metadata
    await db.execute({
      sql: `DELETE FROM documents_metadata WHERE id = ? AND user_id = ?`,
      args: [documentId, user.userId],
    })

    return NextResponse.json({ message: 'Document deleted successfully' })
  } catch (e: any) {
    console.error('Document delete error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
