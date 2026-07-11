import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'
import { QdrantClientWrapper } from '@/lib/backend/qdrant'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const qdrant = new QdrantClientWrapper()
    await qdrant.initCollection('user_memory')
    
    // Fetch real conversation memories from Qdrant/local fallback
    const points = await qdrant.scrollPoints('user_memory', user.userId, 100)
    
    let memories = points.map((p: any) => {
      const payload = p.payload || {}
      return {
        id: p.id,
        type: payload.document_type === 'conversation_memory' ? 'insight' : 'fact',
        content: payload.query ? `Q: "${payload.query}" -> Answer: ${payload.summary}` : p.text,
        confidence: 0.90,
        createdAt: payload.timestamp ? payload.timestamp.split('T')[0] : 'Today',
        related: payload.document_id ? [`Session: ${payload.document_id}`] : ['Chat Memory'],
      }
    })

    // If no conversation memory points are found in Qdrant yet, 
    // dynamically generate real financial insights from their uploaded profiles!
    if (memories.length === 0) {
      const db = getDbClient()
      const profileRes = await db.execute({
        sql: `SELECT * FROM user_profiles WHERE user_id = ?`,
        args: [user.userId],
      })

      if (profileRes.rows.length > 0) {
        const profile = profileRes.rows[0] as any
        const gross = Number(profile.monthly_gross || 0)
        const burn = Number(profile.monthly_burn || 0)
        const netWorth = Number(profile.net_worth || 0)
        const dti = Number(profile.debt_to_income_ratio || 0)

        const savingsRate = gross > 0 ? ((gross - burn) / gross * 100) : 0
        const todayStr = new Date().toISOString().split('T')[0]

        memories = [
          {
            id: 'dyn_mem_1',
            type: 'fact',
            content: `Monthly gross income is calculated at $${gross.toLocaleString()} with average monthly burn rate at $${burn.toLocaleString()}.`,
            confidence: 0.95,
            createdAt: todayStr,
            related: ['Parsed Statement Data'],
          },
          {
            id: 'dyn_mem_2',
            type: 'insight',
            content: dti > 0.36
              ? `Debt-to-Income (DTI) ratio is elevated at ${(dti * 100).toFixed(1)}%. We recommend organizing a structured paydown strategy.`
              : `Debt-to-Income (DTI) ratio is healthy at ${(dti * 100).toFixed(1)}%, which is well below the 36% risk limit.`,
            confidence: 0.92,
            createdAt: todayStr,
            related: ['Liability Metrics'],
          },
          {
            id: 'dyn_mem_3',
            type: 'pattern',
            content: savingsRate < 10
              ? `Savings rate is low at ${savingsRate.toFixed(1)}%. Restructuring minor utility/discretionary costs can generate monthly cash surplus.`
              : `Savings rate is healthy at ${savingsRate.toFixed(1)}% of total monthly gross income.`,
            confidence: 0.88,
            createdAt: todayStr,
            related: ['Burn Rate Assessment'],
          },
        ]

        if (netWorth > 0) {
          memories.push({
            id: 'dyn_mem_4',
            type: 'recommendation',
            content: `Net worth is computed at $${netWorth.toLocaleString()} based on uploaded asset balances. Consider asset allocation rebalancing.`,
            confidence: 0.85,
            createdAt: todayStr,
            related: ['Asset Holdings'],
          })
        }
      }
    }

    return NextResponse.json({ memories })
  } catch (e: any) {
    console.error('Memories GET error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
