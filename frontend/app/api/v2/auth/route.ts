import { NextRequest, NextResponse } from 'next/server'
import { getDbClient, initDb } from '@/lib/backend/db'
import { hashPassword, comparePassword, signToken, signRefreshToken } from '@/lib/backend/auth'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const body = await req.json()
    const { action, email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const db = getDbClient()

    if (action === 'signup') {
      if (!name) {
        return NextResponse.json({ error: 'Name is required for signup' }, { status: 400 })
      }

      // Check if user already exists
      const existing = await db.execute({
        sql: `SELECT email FROM user_auth WHERE email = ?`,
        args: [email],
      })

      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
      }

      const userId = 'usr_' + Math.random().toString(36).substr(2, 9)
      const passHash = await hashPassword(password)

      // Create profile and auth record inside a transaction
      await db.execute({
        sql: `INSERT INTO user_profiles (user_id, email, name, role) VALUES (?, ?, ?, 'user')`,
        args: [userId, email, name],
      })

      await db.execute({
        sql: `INSERT INTO user_auth (user_id, email, password_hash) VALUES (?, ?, ?)`,
        args: [userId, email, passHash],
      })

      const token = signToken({ userId, email, role: 'user' })
      const refreshToken = signRefreshToken({ userId })

      return NextResponse.json({
        message: 'Signup successful',
        user: { userId, email, name, role: 'user' },
        token,
        refreshToken,
      }, { status: 201 })
    } else {
      // Default: login
      const result = await db.execute({
        sql: `SELECT ua.user_id, ua.password_hash, up.name, up.role 
              FROM user_auth ua
              JOIN user_profiles up ON ua.user_id = up.user_id
              WHERE ua.email = ?`,
        args: [email],
      })

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const user = result.rows[0]
      const isValid = await comparePassword(password, user.password_hash as string)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const userId = user.user_id as string
      const token = signToken({ userId, email, role: user.role as string })
      const refreshToken = signRefreshToken({ userId })

      // Save refresh token to db
      await db.execute({
        sql: `UPDATE user_auth SET refresh_token = ? WHERE user_id = ?`,
        args: [refreshToken, userId],
      })

      return NextResponse.json({
        message: 'Login successful',
        user: { userId, email, name: user.name, role: user.role },
        token,
        refreshToken,
      }, { status: 200 })
    }
  } catch (e: any) {
    console.error('Auth endpoint error', e)
    return NextResponse.json({ error: 'Internal Server Error', details: e.message }, { status: 500 })
  }
}
