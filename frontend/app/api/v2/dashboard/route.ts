import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDbClient()

    // 1. Fetch user profile metrics (written by profile-builder after CSV ingest)
    const profileRes = await db.execute({
      sql: `SELECT * FROM user_profiles WHERE user_id = ?`,
      args: [user.userId],
    })

    // BUG-11 FIX: Only count completed documents, not processing/failed ones
    const docRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM documents_metadata WHERE user_id = ? AND status = 'completed'`,
      args: [user.userId],
    })
    const docCount = (docRes.rows[0]?.count as number) || 0

    // 3. Fetch recent safety audit logs for activity feed
    const auditRes = await db.execute({
      sql: `SELECT * FROM safety_audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5`,
      args: [user.userId],
    })

    const activityFeed = auditRes.rows.map((row) => ({
      id: row.audit_id,
      type: row.pii_score && (row.pii_score as number) > 0.5 ? 'security' : 'analysis',
      title: row.agent_name === 'Advisor Agent' ? 'Advisory report validated' : `${row.agent_name} completed`,
      description: row.compliance_status === 'ALLOWED'
        ? 'Safety check completed with zero violations'
        : 'Potential risk flag detected and logged',
      timestamp: row.timestamp,
    }))

    if (docCount > 0) {
      activityFeed.unshift({
        id: 'act_doc_01',
        type: 'upload',
        title: 'Financial document parsed',
        description: `Successfully indexed transaction profiles from ${docCount} document${docCount > 1 ? 's' : ''}`,
        timestamp: new Date().toISOString(),
      })
    }

    if (docCount === 0) {
      return NextResponse.json({
        metrics: {
          netWorth: 0, totalAssets: 0, totalLiabilities: 0,
          monthlyIncome: 0, monthlyExpenses: 0, savingsRate: 0,
          debtRatio: 0, healthScore: 0, riskTolerance: 5, documentCount: 0,
        },
        netWorthTrend: [
          { date: 'M-5', value: 0 }, { date: 'M-4', value: 0 }, { date: 'M-3', value: 0 },
          { date: 'M-2', value: 0 }, { date: 'M-1', value: 0 }, { date: 'Now', value: 0 },
        ],
        assetAllocation: [],
        activityFeed: [],
      })
    }

    const profile = profileRes.rows[0] as any

    // Read real financial metrics written by the profile builder agent after CSV ingest
    const netWorth     = (profile?.net_worth as number) || 0
    const dti          = (profile?.debt_to_income_ratio as number) || 0
    const riskTolerance = (profile?.risk_tolerance_score as number) || 5
    const monthlyIncome  = (profile?.monthly_gross as number) || 0
    const monthlyExpenses = (profile?.monthly_burn as number) || 0

    const savingsRate = monthlyIncome > 0
      ? parseFloat(((monthlyIncome - monthlyExpenses) / monthlyIncome).toFixed(3))
      : 0

    const totalAssets = netWorth > 0 ? netWorth : 0
    // Annualized debt from DTI
    const totalLiabilities = dti > 0 && monthlyIncome > 0
      ? parseFloat((dti * monthlyIncome * 12).toFixed(0))
      : 0

    // BUG-13 FIX: Compute net worth trend dynamically from real surplus
    const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses)
    const now = new Date()
    const netWorthTrend = Array.from({ length: 6 }, (_, i) => {
      const monthsAgo = 5 - i
      const d = new Date(now)
      d.setMonth(d.getMonth() - monthsAgo)
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      // project backwards: netWorth was lower before surplus accumulation
      const value = Math.max(0, netWorth - monthlySurplus * monthsAgo)
      return { date: label, value: parseFloat(value.toFixed(0)) }
    })

    // BUG-12 FIX: Compute health score dynamically
    let healthScore = 70
    if (dti < 0.20) healthScore += 10
    if (dti > 0.40) healthScore -= 15
    if (dti > 0.43) healthScore -= 10 // extra penalty for critical DTI
    if (savingsRate > 0.30) healthScore += 10
    if (savingsRate > 0.20) healthScore += 5
    if (savingsRate < 0.10) healthScore -= 15
    if (savingsRate < 0.05) healthScore -= 10 // extra penalty
    if (netWorth > 200000) healthScore += 8
    if (netWorth > 50000) healthScore += 4
    healthScore = Math.min(100, Math.max(0, Math.round(healthScore)))

    // BUG-03 FIX: Derive asset allocation from real profile ratios
    // Estimate: Checking = net worth - savings * 6 estimate, Emergency = 2 months surplus, rest = investment
    const emergencyFundEst = monthlySurplus * 2
    const checkingEst      = monthlySurplus * 1
    const investmentEst    = Math.max(0, netWorth - emergencyFundEst - checkingEst)
    const liabEst          = totalLiabilities

    const total = checkingEst + emergencyFundEst + investmentEst + liabEst
    const assetAllocation = total > 0 ? [
      { name: 'Checking',        value: Math.round(checkingEst / total * 100),       fill: '#6366f1' },
      { name: 'Emergency Fund',  value: Math.round(emergencyFundEst / total * 100),   fill: '#10b981' },
      { name: 'Investments',     value: Math.round(investmentEst / total * 100),      fill: '#f59e0b' },
      { name: 'Liabilities',     value: Math.round(liabEst / total * 100),            fill: '#ef4444' },
    ].filter(a => a.value > 0) : []

    return NextResponse.json({
      metrics: {
        netWorth,
        totalAssets,
        totalLiabilities,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        debtRatio: dti,
        healthScore,
        riskTolerance,
        documentCount: docCount,
      },
      netWorthTrend,
      assetAllocation,
      activityFeed,
    })
  } catch (e: any) {
    console.error('Dashboard endpoint error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
