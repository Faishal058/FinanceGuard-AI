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
    const result = await db.execute({
      sql: `SELECT * FROM mock_vector_store WHERE user_id = ?`,
      args: [user.userId],
    })

    const memories = result.rows.map((row: any) => {
      try {
        const metadata = JSON.parse(row.metadata_json as string)
        return {
          id: row.id,
          type: metadata.document_type === 'conversation_memory' ? 'insight' : 'fact',
          content: row.text,
          confidence: 0.90,
          createdAt: metadata.timestamp ? metadata.timestamp.split('T')[0] : 'Today',
          related: metadata.document_id ? [`Session: ${metadata.document_id}`] : ['Chat Session'],
        }
      } catch (err) {
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({ memories })
  } catch (e: any) {
    console.error('Memories GET error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
