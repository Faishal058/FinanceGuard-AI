import { initDb } from '../lib/backend/db'
import { QualityGateService } from '../lib/backend/quality-gates'

describe('Quality Gates Evaluator Service', () => {
  beforeAll(async () => {
    await initDb()
  })

  test('ALLOW: Safe response matches all quality gates', () => {
    const safetyResult = {
      allowed: true,
      hallucinationScore: 0.01,
      complianceScore: 1.0,
      biasScore: 0.01,
      piiScore: 0.0,
    }

    const res = QualityGateService.evaluate(
      'Advisor Agent',
      'tr_allow_01',
      '4.2.1',
      safetyResult,
      1200, // Latency
      1000, // Token count
      0.95 // Confidence
    )

    expect(res.passed).toBe(true)
    expect(res.overallAction).toBe('ALLOW')
    
    // Check specific gates
    const hallucinationGate = res.evaluations.find(e => e.gateId === 'QG-1')
    expect(hallucinationGate?.passed).toBe(true)
    expect(hallucinationGate?.actionRequired).toBe('NONE')

    const complianceGate = res.evaluations.find(e => e.gateId === 'QG-2')
    expect(complianceGate?.passed).toBe(true)
  })

  test('RETRY: Hallucinated output triggers lower temperature retry action', () => {
    const safetyResult = {
      allowed: true,
      hallucinationScore: 0.08, // Exceeds 0.05 limit
      complianceScore: 1.0,
      biasScore: 0.01,
      piiScore: 0.0,
    }

    const res = QualityGateService.evaluate(
      'Advisor Agent',
      'tr_retry_01',
      '4.2.1',
      safetyResult,
      800,
      500,
      0.90
    )

    expect(res.passed).toBe(false)
    expect(res.overallAction).toBe('RETRY')
    
    const hallucinationGate = res.evaluations.find(e => e.gateId === 'QG-1')
    expect(hallucinationGate?.passed).toBe(false)
    expect(hallucinationGate?.actionRequired).toBe('RETRY_LOWER_TEMP')
  })

  test('ESCALATE: Non-compliant output triggers human workflow escalation action', () => {
    const safetyResult = {
      allowed: true,
      hallucinationScore: 0.01,
      complianceScore: 0.88, // Fails 0.95 limit
      biasScore: 0.01,
      piiScore: 0.0,
    }

    const res = QualityGateService.evaluate(
      'Advisor Agent',
      'tr_escalate_01',
      '4.2.1',
      safetyResult,
      950,
      750,
      0.92
    )

    expect(res.passed).toBe(false)
    expect(res.overallAction).toBe('ESCALATE')

    const complianceGate = res.evaluations.find(e => e.gateId === 'QG-2')
    expect(complianceGate?.passed).toBe(false)
    expect(complianceGate?.actionRequired).toBe('ESCALATE_TO_HUMAN')
  })

  test('BLOCK: Unsafe or injection attempts trigger blocking action', () => {
    const safetyResult = {
      allowed: false, // Security block trigger
      hallucinationScore: 0.01,
      complianceScore: 1.0,
      biasScore: 0.01,
      piiScore: 0.0,
    }

    const res = QualityGateService.evaluate(
      'Advisor Agent',
      'tr_block_01',
      '4.2.1',
      safetyResult,
      200,
      100,
      0.99
    )

    expect(res.passed).toBe(false)
    expect(res.overallAction).toBe('BLOCK')
  })
})
