import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/backend/db'
import { authenticateUser } from '@/lib/backend/auth'
import { DeletionWorker } from '@/lib/backend/governance'

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
