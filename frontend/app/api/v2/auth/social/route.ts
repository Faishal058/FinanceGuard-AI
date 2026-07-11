import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { hashPassword, signToken, signRefreshToken } from '@/lib/backend/auth'
import { ConsentManager } from '@/lib/backend/governance'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const body = await req.json()
    const { provider, email, name } = body

    if (!email || !provider) {
      return NextResponse.json({ error: 'Email and provider are required' }, { status: 400 })
    }

    const db = getDbClient()

    // 1. Check if user already exists
    const existing = await db.execute({
      sql: `SELECT ua.user_id, up.name, up.role 
            FROM user_auth ua
            JOIN user_profiles up ON ua.user_id = up.user_id
            WHERE ua.email = ?`,
      args: [email],
    })

    let userId = ''
    let userName = name || (provider === 'google' ? 'Google User' : 'Microsoft User')
    let role = 'user'

    if (existing.rows.length > 0) {
      const user = existing.rows[0]
      userId = user.user_id as string
      userName = user.name as string
      role = user.role as string
    } else {
      // 2. Register new social user
      userId = 'usr_' + Math.random().toString(36).substr(2, 9)
      const fakePass = Math.random().toString(36).substr(2, 12)
      const passHash = await hashPassword(fakePass)

      await db.execute({
        sql: `INSERT INTO user_profiles (user_id, email, name, role) VALUES (?, ?, ?, 'user')`,
        args: [userId, email, userName],
      })

      await db.execute({
        sql: `INSERT INTO user_auth (user_id, email, password_hash) VALUES (?, ?, ?)`,
        args: [userId, email, passHash],
      })

      // Auto-grant all required consents
      const ipAddress = (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1'
      const userAgent = req.headers.get('user-agent') || 'Browser'
      const consentTypes: Array<'data_processing' | 'memory_storage' | 'financial_analysis' | 'advisory_output'> = [
        'data_processing',
        'memory_storage',
        'financial_analysis',
        'advisory_output',
      ]
      for (const consentType of consentTypes) {
        await ConsentManager.recordConsent(userId, consentType, `Social OAuth consent: ${consentType}`, ipAddress, userAgent)
      }
    }

    // 3. Issue tokens
    const token = signToken({ userId, email, role })
    const refreshToken = signRefreshToken({ userId })

    // Save refresh token to db
    await db.execute({
      sql: `UPDATE user_auth SET refresh_token = ? WHERE user_id = ?`,
      args: [refreshToken, userId],
    })

    return NextResponse.json({
      message: `${provider} authentication successful`,
      user: { userId, email, name: userName, role },
      token,
      refreshToken,
    }, { status: 200 })
  } catch (e: any) {
    console.error('Social auth POST error', e)
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 })
  }
}
