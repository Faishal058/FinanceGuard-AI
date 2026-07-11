import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const provider = searchParams.get('provider')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'Google Client ID is not configured in .env' }, { status: 400 })
    }
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(`${appUrl}/api/v2/auth/callback/google`)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `prompt=select_account`
    
    return NextResponse.redirect(googleAuthUrl)
  }

  if (provider === 'microsoft') {
    const clientId = process.env.MICROSOFT_CLIENT_ID
    if (!clientId) {
      return NextResponse.json({ error: 'Microsoft Client ID is not configured in .env' }, { status: 400 })
    }
    const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(`${appUrl}/api/v2/auth/callback/microsoft`)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile User.Read')}&` +
      `response_mode=query`

    return NextResponse.redirect(msAuthUrl)
  }

  return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
}
