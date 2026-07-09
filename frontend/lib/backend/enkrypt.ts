import { getDbClient } from './db'

export interface EnkryptValidationContext {
  user_id: string
  trace_id: string
  agent_name: string
  prompt_version: string
}

export interface EnkryptSafetyResult {
  allowed: boolean
  redactedText?: string
  hallucinationScore: number
  complianceScore: number
  biasScore: number
  piiScore: number
  reason?: string
}

// Local safety fallback matching Enkrypt AI specifications
export function localSafetyGuard(
  text: string,
  context: EnkryptValidationContext,
  isOutput: boolean
): EnkryptSafetyResult {
  let allowed = true
  let redactedText = text
  let reason = ''
  let hallucinationScore = 0.01
  let complianceScore = 1.0
  let biasScore = 0.01
  let piiScore = 0.0

  // 1. PII Detection & Redaction (Input/Output)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g
  const cardRegex = /\b(?:\d[ -]*?){13,16}\b/g
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const phoneRegex = /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g

  if (ssnRegex.test(text)) {
    redactedText = redactedText.replace(ssnRegex, '[REDACTED_SSN]')
    piiScore = 0.95
  }
  if (cardRegex.test(text)) {
    redactedText = redactedText.replace(cardRegex, '[REDACTED_CARD]')
    piiScore = 0.95
  }
  if (emailRegex.test(text)) {
    redactedText = redactedText.replace(emailRegex, '[REDACTED_EMAIL]')
    piiScore = 0.8
  }
  if (phoneRegex.test(text)) {
    redactedText = redactedText.replace(phoneRegex, '[REDACTED_PHONE]')
    piiScore = 0.7
  }

  // 2. Prompt Injection Detection (Input Guard)
  if (!isOutput) {
    const injectionTriggers = [
      'ignore previous instructions',
      'ignore system prompt',
      'ignore guidelines',
      'bypass',
      'override system',
      'act as a developer',
      'ignore warnings',
      'you are now',
      'ignore safety',
    ]
    const lowerText = text.toLowerCase()
    for (const trigger of injectionTriggers) {
      if (lowerText.includes(trigger)) {
        allowed = false
        reason = `Prompt Injection detected: '${trigger}'`
        break
      }
    }
  }

  // 3. Financial Compliance Checks (Output Guard)
  if (isOutput) {
    const tickerRegex = /\b[A-Z]{3,5}\b/g
    const lowerText = text.toLowerCase()
    
    // Check for stock tickers (e.g. AAPL, TSLA) which are forbidden
    const tickers = text.match(tickerRegex) || []
    const forbiddenTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOG', 'NVDA', 'META', 'NFLX']
    const hasForbiddenTicker = tickers.some(t => forbiddenTickers.includes(t))

    if (hasForbiddenTicker) {
      complianceScore = 0.4
      allowed = false
      reason = 'Forbidden investment advice (individual stock ticker recommended)'
    }

    // Check for standard disclaimer
    const hasDisclaimer = lowerText.includes('disclaimer') || lowerText.includes('not financial advice')
    if (!hasDisclaimer) {
      complianceScore = Math.min(complianceScore, 0.7)
      // We don't block outright, but we lower compliance score
    }

    // Check for tax advice
    if (lowerText.includes('tax advice') || lowerText.includes('deduct this expense')) {
      complianceScore = Math.min(complianceScore, 0.8)
    }

    // Check for toxicity/inappropriate content
    const toxicKeywords = ['kill', 'suicide', 'bomb', 'hack', 'steal', 'cheat', 'fraud', 'exploit']
    const hasToxic = toxicKeywords.some(w => lowerText.includes(w))
    if (hasToxic) {
      allowed = false
      reason = 'Toxic or illicit content detected'
    }
  }

  return {
    allowed,
    redactedText,
    hallucinationScore,
    complianceScore,
    biasScore,
    piiScore,
    reason,
  }
}

export class EnkryptClient {
  private apiKey: string | undefined
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.ENKRYPT_API_KEY
    this.apiUrl = process.env.ENKRYPT_API_URL || 'https://api.enkryptai.com/v1/guardrails/validate'
  }

  async validateText(
    text: string,
    context: EnkryptValidationContext,
    isOutput = false
  ): Promise<EnkryptSafetyResult> {
    const db = getDbClient()
    
    // 1. Log beginning audit span
    const auditId = 'aud_' + Math.random().toString(36).substr(2, 9)
    
    // If no API key is set, use local safety fallback out of the box
    if (!this.apiKey) {
      const localResult = localSafetyGuard(text, context, isOutput)
      
      // Persist to safety audit logs table
      await db.execute({
        sql: `INSERT INTO safety_audit_logs (audit_id, trace_id, user_id, agent_name, pii_score, hallucination_score, compliance_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          auditId,
          context.trace_id,
          context.user_id,
          context.agent_name,
          localResult.piiScore,
          localResult.hallucinationScore,
          localResult.allowed ? 'ALLOWED' : 'BLOCKED',
        ],
      })

      return localResult
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text,
          detectors: ['hallucination', 'pii', 'financial_compliance', 'bias', 'toxicity', 'prompt_injection'],
          context: {
            user_id: context.user_id,
            trace_id: context.trace_id,
            agent_name: context.agent_name,
            prompt_version: context.prompt_version,
          },
        }),
      })

      const data = await response.json()
      
      const piiScore = data.detectors?.pii?.score || 0.0
      const hallucinationScore = data.detectors?.hallucination?.score || 0.0
      const complianceScore = data.detectors?.financial_compliance?.score || 1.0
      const allowed = data.allowed ?? true
      
      await db.execute({
        sql: `INSERT INTO safety_audit_logs (audit_id, trace_id, user_id, agent_name, pii_score, hallucination_score, compliance_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          auditId,
          context.trace_id,
          context.user_id,
          context.agent_name,
          piiScore,
          hallucinationScore,
          allowed ? 'ALLOWED' : 'BLOCKED',
        ],
      })

      return {
        allowed,
        redactedText: data.redacted_text || text,
        hallucinationScore,
        complianceScore,
        biasScore: data.detectors?.bias?.score || 0.0,
        piiScore,
        reason: data.reason || '',
      }
    } catch (e) {
      console.warn('Enkrypt AI request failed, using local safety backup', e)
      
      // Fallback locally
      const localResult = localSafetyGuard(text, context, isOutput)
      
      await db.execute({
        sql: `INSERT INTO safety_audit_logs (audit_id, trace_id, user_id, agent_name, pii_score, hallucination_score, compliance_status)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          auditId,
          context.trace_id,
          context.user_id,
          context.agent_name,
          localResult.piiScore,
          localResult.hallucinationScore,
          localResult.allowed ? 'ALLOWED' : 'BLOCKED',
        ],
      })

      return localResult
    }
  }
}
