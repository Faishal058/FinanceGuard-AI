import { TelemetryProvider } from './governance'
import { EnkryptSafetyResult } from './enkrypt'

export interface QualityGateEvaluation {
  gateId: string
  metricName: string
  threshold: string
  actualValue: any
  passed: boolean
  actionRequired: 'NONE' | 'LOG_WARNING' | 'BLOCK_OUTPUT' | 'ESCALATE_TO_HUMAN' | 'RETRY_LOWER_TEMP' | 'RETRY_AUGMENTED_CONTEXT' | 'RETRY_STRICT_FORMAT'
}

export interface QualityGateResult {
  passed: boolean
  overallAction: 'ALLOW' | 'BLOCK' | 'ESCALATE' | 'RETRY'
  evaluations: QualityGateEvaluation[]
}

export class QualityGateService {
  static evaluate(
    agentName: string,
    traceId: string,
    promptVersion: string,
    safetyResult: EnkryptSafetyResult,
    latencyMs: number,
    tokenCount: number,
    confidenceScore: number,
    isJsonValid = true
  ): QualityGateResult {
    const evaluations: QualityGateEvaluation[] = []
    
    // QG-1: Hallucination
    const hallucinationPassed = safetyResult.hallucinationScore < 0.05
    evaluations.push({
      gateId: 'QG-1',
      metricName: 'Hallucination Score',
      threshold: '< 0.05',
      actualValue: safetyResult.hallucinationScore,
      passed: hallucinationPassed,
      actionRequired: hallucinationPassed ? 'NONE' : 'RETRY_LOWER_TEMP',
    })

    // QG-2: Compliance
    const compliancePassed = safetyResult.complianceScore >= 0.95
    evaluations.push({
      gateId: 'QG-2',
      metricName: 'Compliance Score',
      threshold: '>= 0.95',
      actualValue: safetyResult.complianceScore,
      passed: compliancePassed,
      actionRequired: compliancePassed ? 'NONE' : 'ESCALATE_TO_HUMAN',
    })

    // QG-3: Bias
    const biasPassed = safetyResult.biasScore < 0.03
    evaluations.push({
      gateId: 'QG-3',
      metricName: 'Bias Score',
      threshold: '< 0.03',
      actualValue: safetyResult.biasScore,
      passed: biasPassed,
      actionRequired: biasPassed ? 'NONE' : 'LOG_WARNING',
    })

    // QG-4: PII Detection
    const piiPassed = safetyResult.piiScore === 0.0 || safetyResult.allowed
    evaluations.push({
      gateId: 'QG-4',
      metricName: 'PII Detection',
      threshold: '0 PII tokens',
      actualValue: safetyResult.piiScore,
      passed: piiPassed,
      actionRequired: piiPassed ? 'NONE' : 'BLOCK_OUTPUT',
    })

    // QG-5: Confidence Score
    const confidencePassed = confidenceScore >= 0.85
    evaluations.push({
      gateId: 'QG-5',
      metricName: 'Confidence Score',
      threshold: '>= 0.85',
      actualValue: confidenceScore,
      passed: confidencePassed,
      actionRequired: confidencePassed ? 'NONE' : 'RETRY_AUGMENTED_CONTEXT',
    })

    // QG-6: Latency
    const latencyPassed = latencyMs < 2500
    evaluations.push({
      gateId: 'QG-6',
      metricName: 'Latency',
      threshold: '< 2.5s',
      actualValue: latencyMs,
      passed: latencyPassed,
      actionRequired: latencyPassed ? 'NONE' : 'LOG_WARNING',
    })

    // QG-7: Token Count
    const tokensPassed = tokenCount < 4096
    evaluations.push({
      gateId: 'QG-7',
      metricName: 'Token Count',
      threshold: '< 4096',
      actualValue: tokenCount,
      passed: tokensPassed,
      actionRequired: tokensPassed ? 'NONE' : 'LOG_WARNING',
    })

    // QG-8: JSON Schema Validation
    evaluations.push({
      gateId: 'QG-8',
      metricName: 'JSON Schema Validation',
      threshold: '100% pass',
      actualValue: isJsonValid ? 'VALID' : 'INVALID',
      passed: isJsonValid,
      actionRequired: isJsonValid ? 'NONE' : 'RETRY_STRICT_FORMAT',
    })

    // Log the entire evaluation to DB asynchronously
    TelemetryProvider.logEvaluation(
      traceId,
      agentName,
      promptVersion,
      {
        hallucination: safetyResult.hallucinationScore,
        compliance: safetyResult.complianceScore,
        bias: safetyResult.biasScore,
        safety: safetyResult.allowed ? 1.0 : 0.0,
      },
      latencyMs,
      tokenCount
    ).catch(e => console.error('Failed to log evaluation telemetry', e))

    // Determine overall action priority:
    // BLOCK_OUTPUT > ESCALATE_TO_HUMAN > RETRY/WARNING > ALLOW
    let overallAction: QualityGateResult['overallAction'] = 'ALLOW'
    const failedActions = evaluations.filter(e => !e.passed).map(e => e.actionRequired)

    if (failedActions.includes('BLOCK_OUTPUT') || !safetyResult.allowed) {
      overallAction = 'BLOCK'
    } else if (failedActions.includes('ESCALATE_TO_HUMAN')) {
      overallAction = 'ESCALATE'
    } else if (
      failedActions.includes('RETRY_LOWER_TEMP') ||
      failedActions.includes('RETRY_AUGMENTED_CONTEXT') ||
      failedActions.includes('RETRY_STRICT_FORMAT')
    ) {
      overallAction = 'RETRY'
    }

    const passed = safetyResult.allowed && evaluations.every(
      e => e.gateId === 'QG-3' || e.gateId === 'QG-6' || e.gateId === 'QG-7' || e.passed
    )

    return {
      passed,
      overallAction,
      evaluations,
    }
  }
}
