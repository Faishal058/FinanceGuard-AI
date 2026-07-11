import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { hashPassword, signToken, signRefreshToken } from '@/lib/backend/auth'
import { ConsentManager } from '@/lib/backend/governance'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider') || 'google'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const email = `${provider.toLowerCase()}.user@financeguard.ai`
    const name = provider === 'google' ? 'Google Demo User' : 'Microsoft Demo User'

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
    let role = 'user'

    if (existing.rows.length > 0) {
      const user = existing.rows[0]
      userId = user.user_id as string
      role = user.role as string
    } else {
      // Register new user
      userId = 'usr_' + Math.random().toString(36).substr(2, 9)
      const fakePass = Math.random().toString(36).substr(2, 12)
      const passHash = await hashPassword(fakePass)

      await db.execute({
        sql: `INSERT INTO user_profiles (user_id, email, name, role) VALUES (?, ?, ?, 'user')`,
        args: [userId, email, name],
      })

      await db.execute({
        sql: `INSERT INTO user_auth (user_id, email, password_hash) VALUES (?, ?, ?)`,
        args: [userId, email, passHash],
      })

      // Auto-grant consents
      const ipAddress = (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1'
      const userAgent = req.headers.get('user-agent') || 'Browser'
      const consentTypes: Array<'data_processing' | 'memory_storage' | 'financial_analysis' | 'advisory_output'> = [
        'data_processing',
        'memory_storage',
        'financial_analysis',
        'advisory_output',
      ]
      for (const consentType of consentTypes) {
        await ConsentManager.recordConsent(userId, consentType, `${provider} simulated consent: ${consentType}`, ipAddress, userAgent)
      }
    }

    // 2. Issue tokens
    const token = signToken({ userId, email, role })
    const refreshToken = signRefreshToken({ userId })

    // Save refresh token to db
    await db.execute({
      sql: `UPDATE user_auth SET refresh_token = ? WHERE user_id = ?`,
      args: [refreshToken, userId],
    })

    return NextResponse.redirect(`${appUrl}/login?token=${token}&refreshToken=${refreshToken}`)
  } catch (e: any) {
    console.error('OAuth simulation error', e)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/login?error=Simulation failed`)
  }
}
