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

    // Fetch all workflow executions for this user, newest first
    const execRes = await db.execute({
      sql: `SELECT * FROM workflow_executions WHERE user_id = ? ORDER BY started_at DESC LIMIT 20`,
      args: [user.userId],
    })

    const workflows = await Promise.all(
      execRes.rows.map(async (row: any) => {
        // Fetch steps for this execution
        const stepsRes = await db.execute({
          sql: `SELECT * FROM workflow_steps WHERE execution_id = ? ORDER BY started_at ASC`,
          args: [row.id],
        })

        const steps = stepsRes.rows.map((s: any) => ({
          name: s.step_name,
          status: s.status,
          duration: s.duration_ms ? `${(s.duration_ms / 1000).toFixed(0)}s` : '—',
        }))

        // Format relative time
        const startedAt = new Date(row.started_at as string)
        const now = new Date()
        const diffMs = now.getTime() - startedAt.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const lastRun = diffMins === 0
          ? 'Just now'
          : diffMins < 60
            ? `${diffMins}m ago`
            : `${Math.floor(diffMins / 60)}h ago`

        // Format duration
        const durationMs = row.duration_ms as number | null
        const duration = durationMs
          ? durationMs >= 60000
            ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
            : `${(durationMs / 1000).toFixed(0)}s`
          : row.status === 'running' ? 'In progress...' : '—'

        return {
          id: row.id,
          name: row.name,
          status: row.status,
          duration,
          lastRun,
          traceId: row.trace_id,
          errorMessage: row.error_message,
          steps: steps.length > 0 ? steps : [
            { name: 'Profile Builder', status: row.status === 'completed' ? 'completed' : row.status === 'failed' ? 'failed' : 'pending', duration: '—' },
            { name: 'Risk Agent', status: row.status === 'completed' ? 'completed' : row.status === 'failed' ? 'failed' : 'pending', duration: '—' },
            { name: 'Forecast Agent', status: row.status === 'completed' ? 'completed' : row.status === 'failed' ? 'failed' : 'pending', duration: '—' },
            { name: 'Advisor Agent', status: row.status === 'completed' ? 'completed' : row.status === 'failed' ? 'failed' : 'pending', duration: '—' },
          ],
        }
      })
    )

    const total = workflows.length
    const completed = workflows.filter(w => w.status === 'completed').length
    const running = workflows.filter(w => w.status === 'running').length
    const failed = workflows.filter(w => w.status === 'failed').length

    return NextResponse.json({ workflows, stats: { total, completed, running, failed } })
  } catch (e: any) {
    console.error('Workflows GET error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
