import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { hashPassword, signToken, signRefreshToken } from '@/lib/backend/auth'
import { ConsentManager } from '@/lib/backend/governance'

export async function GET(req: NextRequest) {
  try {
    await initDb()
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!code) {
      return NextResponse.redirect(`${appUrl}/login?error=OAuth code missing`)
    }

    const clientId = process.env.MICROSOFT_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${appUrl}/login?error=Microsoft credentials not configured`)
    }

    // 1. Exchange auth code for tokens
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/v2/auth/callback/microsoft`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok) {
      console.error('Microsoft token exchange error', tokenData)
      return NextResponse.redirect(`${appUrl}/login?error=Token exchange failed`)
    }

    // 2. Retrieve user details from Microsoft Graph API
    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userRes.json()
    if (!userRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=Failed to retrieve user profile`)
    }

    // Microsoft Graph returns userPrincipalName or mail as email
    const email = userData.mail || userData.userPrincipalName
    const name = userData.displayName || 'Microsoft User'

    if (!email) {
      return NextResponse.redirect(`${appUrl}/login?error=Email not provided by Microsoft`)
    }

    const db = getDbClient()

    // 3. Check if user already exists
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
      // Register new Microsoft user
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
        await ConsentManager.recordConsent(userId, consentType, `Microsoft OAuth consent: ${consentType}`, ipAddress, userAgent)
      }
    }

    // 4. Issue tokens
    const token = signToken({ userId, email, role })
    const refreshToken = signRefreshToken({ userId })

    // Save refresh token to db
    await db.execute({
      sql: `UPDATE user_auth SET refresh_token = ? WHERE user_id = ?`,
      args: [refreshToken, userId],
    })

    // Redirect user to login with tokens in query parameters
    return NextResponse.redirect(`${appUrl}/login?token=${token}&refreshToken=${refreshToken}`)
  } catch (e: any) {
    console.error('Microsoft OAuth callback error', e)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/login?error=OAuth internal error`)
  }
}
