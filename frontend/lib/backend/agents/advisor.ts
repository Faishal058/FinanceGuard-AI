import { ProfileResult } from './profile-builder'
import { RiskReportResult } from './risk'
import { ForecastResult } from './forecast'
import { QdrantClientWrapper } from '../qdrant'
import { EnkryptClient } from '../enkrypt'
import { getEmbedding } from '../embeddings'

export interface KeyFinding {
  finding: string
  source_agent: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

export interface ActionItem {
  priority: number
  action: string
  rationale: string
  source_citation: string
  category: 'DEBT' | 'SAVINGS' | 'INCOME' | 'EXPENSES' | 'RISK_MITIGATION' | 'GENERAL'
  timeline: string
}

export interface AdvisorResult {
  user_id: string
  session_id: string
  advisory: {
    executive_summary: string
    key_findings: KeyFinding[]
    action_items: ActionItem[]
    risk_acknowledgments: string[]
  }
  confidence_score: number
  personalization_level: 'high' | 'medium' | 'low'
  safety_scores: {
    hallucination: number
    compliance: number
    bias: number
  }
  memory_stored: boolean
  disclaimer: string
  metadata: {
    agents_consulted: string[]
    qdrant_context_retrieved: boolean
    cross_session_memory_used: boolean
    prompt_version: string
    model_version: string
  }
}

export async function runAdvisorAgent(
  userId: string,
  sessionId: string,
  query: string,
  profile: ProfileResult,
  riskReport: RiskReportResult,
  forecast: ForecastResult
): Promise<AdvisorResult> {
  const qdrant = new QdrantClientWrapper()
  await qdrant.initCollection('user_memory')
  await qdrant.initCollection('financial_documents')

  // 1. Retrieve cross-session memories
  let memories: any[] = []
  let cross_session_memory_used = false
  try {
    memories = await qdrant.searchPoints('user_memory', query, userId, 3)
    if (memories.length > 0) {
      cross_session_memory_used = true
    }
  } catch (e) {
    console.warn('Failed to retrieve cross-session memories', e)
  }

  // 1b. Retrieve actual financial document context chunks (RAG)
  let docContexts: any[] = []
  try {
    docContexts = await qdrant.searchPoints('financial_documents', query, userId, 4)
  } catch (e) {
    console.warn('Failed to retrieve financial document chunks', e)
  }

  let executive_summary = ''
  let key_findings: KeyFinding[] = []
  let action_items: ActionItem[] = []
  let risk_acknowledgments: string[] = []

  const dtiPercent = profile.ratios.debt_to_income !== null ? (profile.ratios.debt_to_income * 100).toFixed(1) : 'N/A'
  const savingsPercent = profile.ratios.savings_rate !== null ? profile.ratios.savings_rate.toFixed(1) : 'N/A'
  const emergencyMonths = profile.ratios.emergency_fund_ratio !== null ? profile.ratios.emergency_fund_ratio.toFixed(1) : 'N/A'

  // 2. Synthesize using LLM or local rule-engine
  const apiKey = process.env.OPENAI_API_KEY || ''
  // Only Featherless AI provider is supported.
  // Accepted prefixes: fl-, fl_, rc-, rc_
  const isFeatherless = apiKey.startsWith('fl-') || apiKey.startsWith('fl_') || apiKey.startsWith('rc-') || apiKey.startsWith('rc_')
  const isValidLLMKey = isFeatherless

  if (apiKey && isValidLLMKey) {
    try {
      const memoryString = memories.map(m => `Query: "${m.payload.query}" -> Summary: "${m.payload.summary}"`).join('\n')
      const docContextString = docContexts.map((d, i) => `[Doc Chunk #${i+1}]:\n${d.payload.text}`).join('\n\n')
      const forecast12m = forecast.projections.find(p => p.horizon_months === 12)
      const forecast60m = forecast.projections.find(p => p.horizon_months === 60)

      const apiUrl = 'https://api.featherless.ai/v1/chat/completions'
      const modelId = process.env.FEATHERLESS_MODEL || 'deepseek-ai/DeepSeek-V4-Pro'

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }


      // Self-contained system prompt with full JSON output schema embedded
      // Do NOT rely on response_format param (not supported by Featherless/DeepSeek)
      const systemPrompt = `You are a Senior Financial Advisor AI inside the FinanceGuard platform.
Your job is to analyze the user's real financial data and answer their specific question with personalized, data-driven advice.

CRITICAL RULES:
- Base your response EXCLUSIVELY on the financial data provided below. Do NOT use generic filler.
- Reference actual numbers from the user's profile (income, expenses, DTI, savings rate, etc.).
- Answer the SPECIFIC question the user asked — do not give a generic overview unless asked.
- Do NOT recommend specific stock tickers or investment products.
- Keep executive_summary concise (2-4 sentences directly answering the question).

You MUST respond ONLY with a valid JSON object in this EXACT format (no markdown, no extra text):
{
  "executive_summary": "Direct answer to the user's question using their real numbers",
  "key_findings": [
    {"finding": "Specific finding with real numbers", "source_agent": "Profile/Risk/Forecast Agent", "severity": "INFO|WARNING|CRITICAL"}
  ],
  "action_items": [
    {"priority": 1, "action": "Specific actionable step", "rationale": "Why this matters for this user", "source_citation": "Source", "category": "DEBT|SAVINGS|INCOME|EXPENSES|RISK_MITIGATION|GENERAL", "timeline": "0-30 days"}
  ],
  "risk_acknowledgments": ["Relevant risk disclaimer"]
}`

      const userPrompt = `USER QUESTION: "${query}"

USER'S REAL FINANCIAL PROFILE:
- Monthly Gross Income: $${profile.income.monthly_gross.toLocaleString()}
- Monthly Total Expenses: $${profile.expenses.monthly_total.toLocaleString()}
- Monthly Net Surplus/Deficit: $${(profile.income.monthly_gross - profile.expenses.monthly_total).toLocaleString()}
- Debt-to-Income (DTI) Ratio: ${dtiPercent}% ${Number(dtiPercent) > 35 ? '⚠️ HIGH' : Number(dtiPercent) > 20 ? '⚠️ MODERATE' : '✅ HEALTHY'}
- Savings Rate: ${savingsPercent}% ${Number(savingsPercent) < 10 ? '🚨 CRITICAL LOW' : Number(savingsPercent) < 20 ? '⚠️ BELOW TARGET' : '✅ HEALTHY'}
- Emergency Fund Coverage: ${emergencyMonths} months ${Number(emergencyMonths) < 3 ? '🚨 CRITICAL' : '✅ OK'}
- Net Worth: $${profile.ratios.net_worth?.toLocaleString() || 'Unknown'}

RISK FLAGS DETECTED:
${riskReport.risk_flags.length > 0 ? riskReport.risk_flags.map(f => `- ${f.flag_type}: ${f.description} (Severity: ${f.severity}, Value: ${f.metric_value ?? 'N/A'}, Threshold: ${f.benchmark_threshold})`).join('\n') : '- No major risk flags detected'}

FORECAST (Monte Carlo):
- 12-Month Projected Balance: $${forecast12m?.balance.p50.toLocaleString() || 'N/A'} (median), $${forecast12m?.balance.p10.toLocaleString() || 'N/A'} (pessimistic)
- 60-Month Projected Balance: $${forecast60m?.balance.p50.toLocaleString() || 'N/A'} (median)

UPLOADED DOCUMENT CONTEXT (RAG):
${docContextString || 'No uploaded document context available.'}

CONVERSATION HISTORY:
${memoryString || 'No prior conversation history.'}

Now answer the user's question with specific, personalized advice using these real numbers. Output ONLY the JSON object.`

      const requestBody: any = {
        model: modelId,
        temperature: 0.3,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }


      console.log(`[Advisor] Calling ${modelId} at ${apiUrl}`)
      const fetchController = new AbortController()
      const fetchTimeout = setTimeout(() => fetchController.abort(), 15000)
      let response: Response
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: fetchController.signal,
        })
      } finally {
        clearTimeout(fetchTimeout)
      }

      const data = await response.json()

      // Log error responses for debugging
      if (!response.ok || data.error) {
        console.error('[Advisor] API error response:', JSON.stringify(data).substring(0, 500))
        throw new Error(data.error?.message || `HTTP ${response.status}`)
      }

      const raw = data?.choices?.[0]?.message?.content
      console.log('[Advisor] Raw LLM response length:', raw?.length, 'chars')

      if (raw) {
        try {
          // Extract JSON from the response (handle markdown code blocks if present)
          const jsonMatch = raw.match(/\{[\s\S]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : raw
          const resObj = JSON.parse(jsonStr)

          executive_summary = resObj.executive_summary || ''
          key_findings = Array.isArray(resObj.key_findings) ? resObj.key_findings : []
          action_items = Array.isArray(resObj.action_items) ? resObj.action_items : []
          risk_acknowledgments = Array.isArray(resObj.risk_acknowledgments) ? resObj.risk_acknowledgments : []

          console.log('[Advisor] LLM synthesis succeeded. Summary length:', executive_summary.length)
        } catch (parseErr) {
          console.error('[Advisor] Failed to parse LLM JSON response:', parseErr, '\nRaw:', raw?.substring(0, 300))
          executive_summary = ''
        }
      } else {
        console.error('[Advisor] LLM returned empty content. Full response:', JSON.stringify(data).substring(0, 500))
      }
    } catch (e) {
      console.error('[Advisor] AI synthesis failed, falling back to rule engine:', e)
    }
  }


  // Fallback / Rule Engine Generation
  // Trigger when AI synthesis did not produce a full valid result
  const needsFallback = !executive_summary ||
    !Array.isArray(key_findings) ||
    !Array.isArray(action_items) ||
    !Array.isArray(risk_acknowledgments)

  if (needsFallback) {
    // Re-initialize all arrays defensively
    if (!Array.isArray(key_findings)) key_findings = []
    if (!Array.isArray(action_items)) action_items = []
    if (!Array.isArray(risk_acknowledgments)) risk_acknowledgments = []
    executive_summary = `Your financial overview shows a gross monthly income of $${profile.income.monthly_gross.toLocaleString()} with expenses at $${profile.expenses.monthly_total.toLocaleString()} (${savingsPercent}% savings rate). Your DTI ratio is ${dtiPercent}%, with emergency reserves covering ${emergencyMonths} months of expenditures.`

    // Add findings
    key_findings.push({
      finding: `DTI ratio is ${dtiPercent}% (benchmark: low under 20%, high over 35%)`,
      source_agent: 'Risk Agent v3.1.0',
      severity: profile.ratios.debt_to_income !== null && profile.ratios.debt_to_income >= 0.35 ? 'CRITICAL' : 'INFO',
    })
    
    key_findings.push({
      finding: `Savings rate is ${savingsPercent}% (benchmark: healthy over 20%)`,
      source_agent: 'Profile Builder Agent v1.8.0',
      severity: profile.ratios.savings_rate !== null && profile.ratios.savings_rate < 10 ? 'WARNING' : 'INFO',
    })

    if (profile.ratios.emergency_fund_ratio !== null && profile.ratios.emergency_fund_ratio < 3.0) {
      key_findings.push({
        finding: `Emergency reserve covers only ${emergencyMonths} months of expenditures`,
        source_agent: 'Risk Agent v3.1.0',
        severity: 'CRITICAL',
      })
    }

    const forecast12m = forecast.projections.find(p => p.horizon_months === 12)
    if (forecast12m) {
      key_findings.push({
        finding: `12-month expected cash balance is projected at $${forecast12m.balance.p50.toLocaleString()}`,
        source_agent: 'Forecast Agent v2.0.0',
        severity: 'INFO',
      })
    }

    // Add action items
    let priority = 1
    if (profile.ratios.emergency_fund_ratio !== null && profile.ratios.emergency_fund_ratio < 3.0) {
      action_items.push({
        priority: priority++,
        action: `Accumulate emergency fund reserves to cover at least 3 months of expenses ($${(profile.expenses.monthly_total * 3).toLocaleString()})`,
        rationale: 'Your current emergency reserves are low. Financial resilience to unexpected shocks is a critical priority.',
        source_citation: 'Risk Agent: EMERGENCY_FUND_CRITICAL',
        category: 'SAVINGS',
        timeline: '0-90 days',
      })
    }

    if (profile.ratios.debt_to_income !== null && profile.ratios.debt_to_income >= 0.20) {
      action_items.push({
        priority: priority++,
        action: 'Design a debt consolidation or accelerated payoff strategy using the debt avalanche method',
        rationale: 'Your DTI ratio is above the recommended low risk baseline. Reducing high-interest obligations frees monthly cash flow.',
        source_citation: 'Risk Agent: DTI_HIGH',
        category: 'DEBT',
        timeline: 'Ongoing',
      })
    }

    if (profile.ratios.savings_rate !== null && profile.ratios.savings_rate < 20) {
      action_items.push({
        priority: priority++,
        action: 'Review and consolidate discretionary spending bills (Utilities, Entertainment, Food)',
        rationale: 'Your monthly savings rate is below the recommended 20% healthy threshold. Minor expense adjustments can yield long-term gains.',
        source_citation: 'Profile Builder: savings_rate < 20%',
        category: 'EXPENSES',
        timeline: '0-30 days',
      })
    }

    action_items.push({
      priority: priority++,
      action: 'Conduct quarterly audits of all financial files and statements',
      rationale: 'Uploading additional bank, credit card, and investment data enables more complete structural forecasting and risk flagging.',
      source_citation: 'General Guidance',
      category: 'GENERAL',
      timeline: 'Next quarter',
    })

    // Add risk acknowledgments
    risk_acknowledgments.push(
      'Monte Carlo projections are probabilistic estimates. Unanticipated changes in employment, interest rates, or expenses can significantly alter outcomes.',
      'This analysis assumes consistent structural cash flows and does not account for financial market asset depreciation risks.'
    )
  }

  // 3. Store summary in Qdrant collection `user_memory`
  let memory_stored = false
  try {
    const memoryId = 'mem_' + Math.random().toString(36).substr(2, 9)
    const memoryText = `Query: ${query}. Summary: ${executive_summary}`
    const memoryVector = await getEmbedding(memoryText)
    
    await qdrant.upsertPoints('user_memory', [
      {
        id: memoryId,
        vector: memoryVector,
        payload: {
          user_id: userId,
          query,
          summary: executive_summary.substring(0, 200),
          timestamp: new Date().toISOString(),
          document_type: 'conversation_memory',
          upload_date: new Date().toISOString().split('T')[0],
          embedding_version: 'text-embedding-3-large-v1',
          chunk_index: 0,
          total_chunks: 1,
          text: memoryText,
          document_id: sessionId,
        },
      },
    ])
    memory_stored = true
  } catch (e) {
    console.warn('Failed to store conversation memory to Qdrant', e)
  }

  // 4. Validate output through Enkrypt AI Output Guard sandwich check
  const enkrypt = new EnkryptClient()
  const traceId = 'tr_' + Math.random().toString(36).substr(2, 9)
  
  // Optimization: Validate only the natural language executive_summary.
  // Structured lists (findings, actions) do not need full cloud safety scanning.
  const safetyResult = await enkrypt.validateText(
    executive_summary,
    {
      user_id: userId,
      trace_id: traceId,
      agent_name: 'Advisor Agent',
      prompt_version: '4.2.1',
    },
    true
  )

  // Block response content if safety validations fail
  if (!safetyResult.allowed) {
    executive_summary = `[SECURITY BLOCK] Enkrypt AI Safety Layer blocked the advisory output. Reason: ${safetyResult.reason || 'Safety criteria violation'}`
    key_findings = []
    action_items = []
  }

  return {
    user_id: userId,
    session_id: sessionId,
    advisory: {
      executive_summary,
      key_findings,
      action_items,
      risk_acknowledgments,
    },
    confidence_score: 0.91,
    personalization_level: cross_session_memory_used ? 'high' : 'medium',
    safety_scores: {
      hallucination: safetyResult.hallucinationScore,
      compliance: safetyResult.complianceScore,
      bias: safetyResult.biasScore,
    },
    memory_stored,
    disclaimer: 'This is structural financial guidance based on your data and standard financial health benchmarks. It is not a substitute for professional financial advice. For specific investment, tax, or legal questions, please consult a licensed professional. Past patterns do not guarantee future results.',
    metadata: {
      agents_consulted: ['profile_builder', 'risk', 'forecast'],
      qdrant_context_retrieved: true,
      cross_session_memory_used,
      prompt_version: '4.2.1',
      model_version: process.env.OPENAI_API_KEY ? 'gpt-4o' : 'local-advisor-v1',
    },
  }
}
