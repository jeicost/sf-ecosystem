import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'

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

  try {
    // La sesión del navegador que vuelve de Google.
    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { getAll: () => cookieStore.getAll() }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return backTo('error&reason=no_session')

    const admin = adminClient()

    // La marca sale de la FILA de oauth_sessions, nunca del parámetro.
    //
    // Antes esto decodificaba un base64 sin firmar y se creía el clientId que
    // trajera: cualquiera con sesión podía editar el state, poner el UUID de
    // otra marca, dar consentimiento con SU cuenta de Google y quedarse con la
    // conexión de Drive de ese cliente — sus entregables subiéndose al Drive del
    // atacante y el sync alimentando su Brand Brain. El state es ahora opaco y
    // la fila la escribió /authorize, que sí autoriza (ver 0075).
    const { data: session } = await admin
      .from('oauth_sessions')
      .select('client_id, user_id, return_to, expires_at')
      .eq('state', state)
      .eq('tool', 'google-drive')
      .maybeSingle()

    if (!session) return backTo('error&reason=bad_state')
    // De un solo uso: gastado el state, la fila desaparece pase lo que pase.
    await admin.from('oauth_sessions').delete().eq('state', state)

    if (new Date(session.expires_at) < new Date()) return backTo('error&reason=state_expired')
    // El destino de vuelta también sale de la fila: como input del navegador
    // permitía '//evil.com', que pasa el filtro startsWith('/') y new URL()
    // resuelve como otro dominio — un open redirect desde un enlace legítimo.
    if (session.return_to) returnPath = session.return_to

    // Quien vuelve tiene que ser quien empezó, y seguir teniendo acceso a la marca.
    if (session.user_id && session.user_id !== user.id) return backTo('error&reason=wrong_user')
    const clientId: string = session.client_id
    if (!(await userCanAccessClient(user, clientId))) return backTo('error&reason=no_access')

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
