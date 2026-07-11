import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'
import { DeletionWorker } from '@/lib/backend/governance'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const userPayload = authenticateUser(req)
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDbClient()
    const result = await db.execute({
      sql: `SELECT name, email, role FROM user_profiles WHERE user_id = ?`,
      args: [userPayload.userId],
    })

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const profile = result.rows[0]
    return NextResponse.json({
      userId: userPayload.userId,
      email: profile.email,
      name: profile.name,
      role: profile.role,
    })
  } catch (e: any) {
    console.error('Fetch profile error', e)
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initDb()
    const user = authenticateUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Trigger right-to-be-forgotten deletion pipeline
    const certificateId = await DeletionWorker.executeRightToBeForgotten(user.userId)

    return NextResponse.json({
      message: 'Right-to-be-Forgotten request completed successfully. All user data has been purged.',
      certificate_id: certificateId,
      status: 'COMPLETED',
    })
  } catch (e: any) {
    console.error('GDPR deletion error', e)
    return NextResponse.json({ error: 'Data purge execution failure', details: e.message }, { status: 500 })
  }
}
