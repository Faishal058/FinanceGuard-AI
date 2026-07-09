import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'
import { ConsentManager } from '@/lib/backend/governance'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT * FROM consent_records WHERE user_id = ?`,
      args: [user.userId],
    })

    const consents = result.rows.map(row => ({
      consent_id: row.consent_id,
      consent_type: row.consent_type,
      purpose: row.purpose,
      status: row.status,
      granted_at: row.granted_at,
      withdrawn_at: row.withdrawn_at,
    }))

    return NextResponse.json({ consents })
  } catch (e: any) {
    console.error('Consent GET error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { consent_type, purpose } = body

    if (!consent_type || !purpose) {
      return NextResponse.json({ error: 'consent_type and purpose are required' }, { status: 400 })
    }

    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Browser'

    await ConsentManager.recordConsent(user.userId, consent_type, purpose, ipAddress, userAgent)

    return NextResponse.json({ message: 'Consent recorded successfully' }, { status: 201 })
  } catch (e: any) {
    console.error('Consent POST error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const consent_type = url.searchParams.get('consent_type') as any

    if (!consent_type) {
      return NextResponse.json({ error: 'consent_type is required as query param' }, { status: 400 })
    }

    await ConsentManager.withdrawConsent(user.userId, consent_type)

    return NextResponse.json({ message: 'Consent withdrawn successfully' })
  } catch (e: any) {
    console.error('Consent DELETE error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
