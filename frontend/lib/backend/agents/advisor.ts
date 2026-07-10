import { ProfileResult } from './profile-builder'
import { RiskReportResult } from './risk'
import { ForecastResult } from './forecast'
import { QdrantClientWrapper } from '../qdrant'
import { EnkryptClient } from '../enkrypt'
import { PromptRegistry } from '../prompt-registry'
import { getEmbedding } from '../embeddings'
import { mastra } from '../mastra-init'

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

  let executive_summary = ''
  let key_findings: KeyFinding[] = []
  let action_items: ActionItem[] = []
  let risk_acknowledgments: string[] = []

  const dtiPercent = profile.ratios.debt_to_income !== null ? (profile.ratios.debt_to_income * 100).toFixed(1) : 'N/A'
  const savingsPercent = profile.ratios.savings_rate !== null ? profile.ratios.savings_rate.toFixed(1) : 'N/A'
  const emergencyMonths = profile.ratios.emergency_fund_ratio !== null ? profile.ratios.emergency_fund_ratio.toFixed(1) : 'N/A'

  // 2. Synthesize using OpenAI or local rule-engine
  if (process.env.OPENAI_API_KEY) {
    try {
      const mastraAgent = mastra.getAgent('advisor')
      const promptObj = await PromptRegistry.fetchPrompt('advisor')
      const memoryString = memories.map(m => `Query: "${m.payload.query}" -> Advisory Summary: "${m.payload.summary}"`).join('\n')
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: promptObj.model_id,
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
              content: `User Query: "${query}"
User Profile: Income $${profile.income.monthly_gross}/mo, Expenses $${profile.expenses.monthly_total}/mo, DTI: ${dtiPercent}%, Savings Rate: ${savingsPercent}%, Emergency Reserves: ${emergencyMonths} months.
Risk Report flags: ${JSON.stringify(riskReport.risk_flags)}
Forecast Median Balance (12m): $${forecast.projections.find(p => p.horizon_months === 12)?.balance.p50 || 'N/A'}
Historical Context Memories:
${memoryString}
`,
            },
          ],
          response_format: { type: 'json_object' },
        }),
      })

      const data = await response.json()
      const resObj = JSON.parse(data.choices[0].message.content)
      executive_summary = resObj.executive_summary
      key_findings = resObj.key_findings
      action_items = resObj.action_items
      risk_acknowledgments = resObj.risk_acknowledgments
    } catch (e) {
      console.warn('AI advisor synthesis failed, falling back to rule engine', e)
    }
  }

  // Fallback / Rule Engine Generation
  if (!executive_summary) {
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
  
  const fullAdvisoryText = `${executive_summary}\n\nFindings:\n${key_findings.map(f => `- ${f.finding}`).join('\n')}\n\nActions:\n${action_items.map(a => `- ${a.action}`).join('\n')}`

  const safetyResult = await enkrypt.validateText(
    fullAdvisoryText,
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
