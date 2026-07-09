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
    
    // 1. Fetch user profile metrics
    const profileRes = await db.execute({
      sql: `SELECT * FROM user_profiles WHERE user_id = ?`,
      args: [user.userId],
    })

    // 2. Fetch uploads counts
    const docRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM documents_metadata WHERE user_id = ?`,
      args: [user.userId],
    })
    const docCount = (docRes.rows[0]?.count as number) || 0

    // 3. Fetch recent safety audit logs
    const auditRes = await db.execute({
      sql: `SELECT * FROM safety_audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5`,
      args: [user.userId],
    })

    const activityFeed = auditRes.rows.map((row, index) => ({
      id: row.audit_id,
      type: row.pii_score && (row.pii_score as number) > 0.5 ? 'security' : 'analysis',
      title: row.agent_name === 'Advisor Agent' ? 'Advisory report validated' : 'Safety audit completed',
      description: row.compliance_status === 'ALLOWED' ? 'Completed safety check with zero violations' : 'Potential risk flag redacted',
      timestamp: row.timestamp,
    }))

    // Add document upload to activity feed if it exists
    if (docCount > 0) {
      activityFeed.unshift({
        id: 'act_doc_01',
        type: 'upload',
        title: 'Financial document parsed',
        description: `Successfully indexed transaction profiles`,
        timestamp: new Date().toISOString(),
      })
    }

    const profile = profileRes.rows[0]
    
    // Standard default financial profile properties
    const netWorth = profile ? (profile.net_worth as number) : 485230.00
    const dti = profile ? (profile.debt_to_income_ratio as number) : 0.208
    const riskTolerance = profile ? (profile.risk_tolerance_score as number) : 5
    
    const monthlyIncome = profile && profile.monthly_gross ? (profile.monthly_gross as number) : 8500.00
    const monthlyExpenses = profile && profile.monthly_burn ? (profile.monthly_burn as number) : 3200.00
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0.62
    
    // Health score algorithm: higher net worth, lower DTI, higher savings rate = higher score
    let healthScore = 70
    if (dti < 0.20) healthScore += 10
    if (dti > 0.40) healthScore -= 15
    if (savingsRate > 0.30) healthScore += 10
    if (savingsRate < 0.10) healthScore -= 15
    if (netWorth > 200000) healthScore += 8
    healthScore = Math.min(100, Math.max(0, healthScore))

    return NextResponse.json({
      metrics: {
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        savingsRate,
        debtRatio: dti,
        healthScore,
        riskTolerance,
        documentCount: docCount,
      },
      netWorthTrend: [
        { date: '1/1', value: netWorth - 35000 },
        { date: '2/1', value: netWorth - 27000 },
        { date: '3/1', value: netWorth - 20000 },
        { date: '4/1', value: netWorth - 13000 },
        { date: '5/1', value: netWorth - 7000 },
        { date: '6/1', value: netWorth },
      ],
      assetAllocation: [
        { name: 'Checking', value: 9, fill: '#6366f1' },
        { name: 'Emergency Fund', value: 26, fill: '#10b981' },
        { name: 'Investments', value: 71, fill: '#f59e0b' },
        { name: 'Liabilities', value: -26, fill: '#ef4444' },
      ],
      activityFeed,
    })
  } catch (e: any) {
    console.error('Dashboard endpoint error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
