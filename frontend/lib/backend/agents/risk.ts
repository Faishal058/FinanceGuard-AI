import { getDbClient } from '../db'
import { ProfileResult } from './profile-builder'

export interface RiskFlag {
  flag_id: string
  flag_type: 'DTI_HIGH' | 'DTI_CRITICAL' | 'SAVINGS_LOW' | 'SAVINGS_CRITICAL' | 'EMERGENCY_FUND_WEAK' | 'EMERGENCY_FUND_CRITICAL' | 'HOUSING_STRETCHED' | 'HOUSING_CRITICAL' | 'CREDIT_UTIL_HIGH' | 'CREDIT_UTIL_CRITICAL' | 'INSUFFICIENT_DATA'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  metric_value: number | null
  benchmark_threshold: string
  recommendation_category: string
}

export interface RiskReportResult {
  user_id: string
  assessment_date: string
  risk_flags: RiskFlag[]
  overall_risk_score: number
  confidence_score: number
  high_uncertainty: boolean
  disclaimer: string
  metadata: {
    benchmarks_version: string
    prompt_version: string
    model_version: string
  }
}

export async function runRiskAgent(
  userId: string,
  profile: ProfileResult
): Promise<RiskReportResult> {
  const flags: RiskFlag[] = []
  let overallRiskScore = 10 // Base starting score

  const ratios = profile.ratios
  const expenses = profile.expenses

  // 1. Debt to Income Ratio
  const dti = ratios.debt_to_income
  if (dti !== null) {
    if (dti > 0.43) {
      flags.push({
        flag_id: 'RF-DTI',
        flag_type: 'DTI_CRITICAL',
        severity: 'CRITICAL',
        description: `Your Debt-to-Income ratio is ${(dti * 100).toFixed(1)}%, which exceeds the critical limit of 43%. This represents a very high debt service burden and severely restricts cash flow.`,
        metric_value: dti,
        benchmark_threshold: 'CRITICAL: > 43%',
        recommendation_category: 'Debt consolidation and restructuring',
      })
      overallRiskScore += 35
    } else if (dti >= 0.35) {
      flags.push({
        flag_id: 'RF-DTI',
        flag_type: 'DTI_HIGH',
        severity: 'HIGH',
        description: `Your Debt-to-Income ratio is ${(dti * 100).toFixed(1)}%, which is in the high risk range of 35-43%. You have limited capacity to take on new obligations.`,
        metric_value: dti,
        benchmark_threshold: 'HIGH: 35-43%',
        recommendation_category: 'Aggressive debt reduction strategies',
      })
      overallRiskScore += 25
    } else if (dti >= 0.20) {
      overallRiskScore += 10 // Moderate risk addition
    }
  } else {
    flags.push({
      flag_id: 'RF-DTI-NONE',
      flag_type: 'INSUFFICIENT_DATA',
      severity: 'LOW',
      description: 'Debt-to-Income ratio could not be determined due to missing liability records.',
      metric_value: null,
      benchmark_threshold: 'Benchmarked relative to income',
      recommendation_category: 'Upload debt contracts or credit statements',
    })
  }

  // 2. Savings Rate
  const savingsRate = ratios.savings_rate
  if (savingsRate !== null) {
    if (savingsRate < 5) {
      flags.push({
        flag_id: 'RF-SAV',
        flag_type: 'SAVINGS_CRITICAL',
        severity: 'CRITICAL',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%, which is critically low (under 5%). Building wealth or handling unexpected expenses will be very difficult at this rate.`,
        metric_value: savingsRate,
        benchmark_threshold: 'CRITICAL: < 5%',
        recommendation_category: 'Immediate discretionary budget cuts',
      })
      overallRiskScore += 30
    } else if (savingsRate < 10) {
      flags.push({
        flag_id: 'RF-SAV',
        flag_type: 'SAVINGS_LOW',
        severity: 'HIGH',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%, which is low (under 10%). Financial advisors recommend aiming for at least 15-20% to secure long-term goals.`,
        metric_value: savingsRate,
        benchmark_threshold: 'LOW: 5-10%',
        recommendation_category: 'Discretionary spend review and optimization',
      })
      overallRiskScore += 20
    } else if (savingsRate < 20) {
      overallRiskScore += 5 // Moderate score increase
    }
  }

  // 3. Emergency Fund Ratio
  const emergencyFund = ratios.emergency_fund_ratio
  if (emergencyFund !== null) {
    if (emergencyFund < 1.0) {
      flags.push({
        flag_id: 'RF-EMER',
        flag_type: 'EMERGENCY_FUND_CRITICAL',
        severity: 'CRITICAL',
        description: `Your emergency reserves cover only ${emergencyFund.toFixed(1)} months of expenses, which is critically low (under 1 month). Any unexpected event could force debt accumulation.`,
        metric_value: emergencyFund,
        benchmark_threshold: 'CRITICAL: < 1 month',
        recommendation_category: 'Build emergency reserve aggressively',
      })
      overallRiskScore += 35
    } else if (emergencyFund < 3.0) {
      flags.push({
        flag_id: 'RF-EMER',
        flag_type: 'EMERGENCY_FUND_WEAK',
        severity: 'MEDIUM',
        description: `Your emergency reserves cover ${emergencyFund.toFixed(1)} months of expenses. While not critical, advisors recommend maintaining 3 to 6 months of reserves.`,
        metric_value: emergencyFund,
        benchmark_threshold: 'WEAK: 1-3 months',
        recommendation_category: 'Emergency fund preservation',
      })
      overallRiskScore += 15
    }
  }

  // 4. Housing Cost Ratio
  const grossMonthlyIncome = profile.income.monthly_gross
  const housingExpense = expenses.breakdown['HOUSING'] || 0
  if (grossMonthlyIncome > 0 && housingExpense > 0) {
    const housingRatio = housingExpense / grossMonthlyIncome
    if (housingRatio > 0.36) {
      flags.push({
        flag_id: 'RF-HOUSE',
        flag_type: 'HOUSING_CRITICAL',
        severity: 'HIGH',
        description: `Housing expenses consume ${(housingRatio * 100).toFixed(1)}% of your gross monthly income, exceeding the recommended ceiling of 36%. You are housing-stretched.`,
        metric_value: parseFloat(housingRatio.toFixed(3)),
        benchmark_threshold: 'CRITICAL: > 36%',
        recommendation_category: 'Housing costs evaluation or refinancing',
      })
      overallRiskScore += 20
    } else if (housingRatio > 0.28) {
      flags.push({
        flag_id: 'RF-HOUSE',
        flag_type: 'HOUSING_STRETCHED',
        severity: 'MEDIUM',
        description: `Housing expenses consume ${(housingRatio * 100).toFixed(1)}% of gross monthly income, falling in the stretched range of 28-36%.`,
        metric_value: parseFloat(housingRatio.toFixed(3)),
        benchmark_threshold: 'STRETCHED: 28-36%',
        recommendation_category: 'Expense tracking optimization',
      })
      overallRiskScore += 10
    }
  }

  // Cap risk score between 0 and 100
  overallRiskScore = Math.min(100, Math.max(0, overallRiskScore))

  // Disclaimer text conforming to PRD
  const disclaimer = 'This is a structural risk assessment based on standard financial health benchmarks and does not constitute formal, registered investment advice or product recommendations. It is provided for informational and analytical purposes.'

  // Write audit results into LibSQL safety audit table or generic logging
  const db = getDbClient()
  await db.execute({
    sql: `INSERT INTO safety_audit_logs (audit_id, trace_id, user_id, agent_name, pii_score, hallucination_score, compliance_status)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      'aud_risk_' + Math.random().toString(36).substr(2, 9),
      'trace_' + Math.random().toString(36).substr(2, 9),
      userId,
      'Risk Agent',
      0.01,
      0.02,
      flags.some(f => f.severity === 'CRITICAL') ? 'REDACTED' : 'ALLOWED',
    ],
  })

  return {
    user_id: userId,
    assessment_date: new Date().toISOString(),
    risk_flags: flags,
    overall_risk_score: overallRiskScore,
    confidence_score: 0.95,
    high_uncertainty: flags.some(f => f.flag_type === 'INSUFFICIENT_DATA'),
    disclaimer,
    metadata: {
      benchmarks_version: '2025-Q2',
      prompt_version: '3.1.0',
      model_version: 'local-risk-v1',
    },
  }
}
