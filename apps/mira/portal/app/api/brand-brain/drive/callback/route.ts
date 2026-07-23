import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

/**
 * POST /api/brand-brain/drive/callback
 * Handles Google Drive OAuth2 callback after user grants permission.
 *
 * Query parameters (from Google OAuth redirect):
 *   - code: Authorization code from Google
 *   - state: State parameter containing encoded clientId
 *   - error: Error code if user denied access
 *
 * Response:
 *   - success: boolean
 *   - message: Status message
 *   - clientId: Client ID for reference
 *   - authorized: Whether authorization succeeded
 */
// Google redirects the browser here with GET after consent.
// Exchange the code, store tokens, and send the user back to Brand Brain.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  let returnPath = '/integrations'
  const backTo = (status: string) =>
    NextResponse.redirect(new URL(`${returnPath}?drive=${status}`, req.url))

  if (oauthError) return backTo(`error&reason=${encodeURIComponent(oauthError)}`)
  if (!code || !state) return backTo('error&reason=missing_code')

  let clientId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    clientId = decoded.clientId
    if (typeof decoded.returnTo === 'string' && decoded.returnTo.startsWith('/')) returnPath = decoded.returnTo
    if (Date.now() - decoded.timestamp > 600000) return backTo('error&reason=state_expired')
  } catch {
    return backTo('error&reason=bad_state')
  }
  if (!clientId) return backTo('error&reason=no_client')

  try {
    // La tabla exige user_id: lo tomamos de la sesión del navegador que vuelve de Google
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return backTo('error&reason=no_session')

    const admin = adminClient()
    const tokens = await exchangeCodeForTokens(code)
    if (!tokens.success || !tokens.accessToken) return backTo('error&reason=token_exchange')

    const tokenExpiresAt = new Date(Date.now() + (tokens.expiresIn || 3600) * 1000).toISOString()
    const { data: existing } = await admin
      .from('drive_connections')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()

    const row = {
      user_id: user.id,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken || null,
      token_expires_at: tokenExpiresAt,
      is_authorized: true,
      // Google returns the space-delimited scopes it actually granted (may be
      // narrower than what was requested). Recorded so we can detect old
      // connections that predate the drive.file scope -- see DEBT.md (k).
      granted_scopes: tokens.scope ? tokens.scope.split(' ').filter(Boolean) : null,
      updated_at: new Date().toISOString(),
    }

    const result = existing
      ? await admin.from('drive_connections').update(row).eq('id', existing.id)
      : await admin.from('drive_connections').insert({ client_id: clientId, ...row })

    if (result.error) {
      console.error('drive callback store error:', result.error)
      return backTo('error&reason=store_failed')
    }

    return backTo('connected')
  } catch (e) {
    console.error('drive callback error:', e)
    return backTo('error&reason=unknown')
  }
}


/**
 * Exchange Google OAuth authorization code for access tokens
 * NOTE: This is a placeholder structure. Implementation requires:
 * - Making HTTPS POST to https://oauth2.googleapis.com/token
 * - Including client_id, client_secret, code, grant_type, redirect_uri
 * - Parsing response JSON for access_token, refresh_token, expires_in
 */
async function exchangeCodeForTokens(
  code: string
): Promise<{
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  scope?: string
  error?: string
}> {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return {
        success: false,
        error: 'Google OAuth configuration incomplete',
      }
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Token exchange failed:', errorData)
      return {
        success: false,
        error: errorData.error_description || 'Token exchange failed',
      }
    }

    const tokens = await response.json()
    return {
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange error',
    }
  }
}
