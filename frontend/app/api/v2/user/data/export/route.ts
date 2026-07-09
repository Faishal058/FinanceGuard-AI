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

    // 1. Get profile data
    const profileRes = await db.execute({
      sql: `SELECT * FROM user_profiles WHERE user_id = ?`,
      args: [user.userId],
    })

    // 2. Get document metadata
    const docRes = await db.execute({
      sql: `SELECT id, name, type, size, uploaded_at FROM documents_metadata WHERE user_id = ?`,
      args: [user.userId],
    })

    // 3. Get consent records
    const consentRes = await db.execute({
      sql: `SELECT consent_type, purpose, status, granted_at, withdrawn_at FROM consent_records WHERE user_id = ?`,
      args: [user.userId],
    })

    // 4. Get safety audit logs
    const auditRes = await db.execute({
      sql: `SELECT audit_id, trace_id, agent_name, pii_score, compliance_status, timestamp FROM safety_audit_logs WHERE user_id = ?`,
      args: [user.userId],
    })

    const exportData = {
      export_meta: {
        user_id: user.userId,
        email: user.email,
        timestamp: new Date().toISOString(),
        standard: 'GDPR Article 20 Portability compliance',
      },
      profile: profileRes.rows[0] || null,
      documents: docRes.rows,
      consents: consentRes.rows,
      safety_audit_logs: auditRes.rows,
    }

    // Set headers to trigger file download
    const response = NextResponse.json(exportData)
    response.headers.set('Content-Disposition', `attachment; filename=financeguard_export_${user.userId}.json`)
    return response
  } catch (e: any) {
    console.error('Data export error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
