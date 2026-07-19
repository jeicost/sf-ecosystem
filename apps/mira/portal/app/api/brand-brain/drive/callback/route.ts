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

  const backTo = (status: string) =>
    NextResponse.redirect(new URL(`/brand-brain?drive=${status}`, req.url))

  if (oauthError) return backTo(`error&reason=${encodeURIComponent(oauthError)}`)
  if (!code || !state) return backTo('error&reason=missing_code')

  let clientId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    clientId = decoded.clientId
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

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle explicit authorization denial
    if (error) {
      console.warn(`Google OAuth error: ${error} - ${errorDescription}`)
      return NextResponse.json(
        {
          success: false,
          authorized: false,
          message: `Authorization denied: ${error}`,
        },
        { status: 400 }
      )
    }

    if (!code || !state) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing authorization code or state',
        },
        { status: 400 }
      )
    }

    // Decode state to extract clientId
    let clientId: string
    try {
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
      clientId = decodedState.clientId

      // Verify state wasn't tampered with (basic check: should be recent)
      const stateAge = Date.now() - decodedState.timestamp
      if (stateAge > 600000) { // 10 minutes
        return NextResponse.json(
          { success: false, message: 'Authorization state expired' },
          { status: 400 }
        )
      }
    } catch (e) {
      console.error('Failed to decode state:', e)
      return NextResponse.json(
        { success: false, message: 'Invalid authorization state' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Verify user has access to this client
    if (!process.env.NEXT_PUBLIC_DEV_MODE_BYPASS || user || !authError) {
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const admin = adminClient()
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessData?.length) {
        return NextResponse.json({ error: 'No client access' }, { status: 403 })
      }
    }

    // Exchange authorization code for tokens
    const admin = adminClient()
    const tokenExchangeResult = await exchangeCodeForTokens(code)

    if (!tokenExchangeResult.success || !tokenExchangeResult.accessToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to exchange authorization code for tokens',
          clientId,
        },
        { status: 500 }
      )
    }

    // Calculate token expiration time (typically ~1 hour)
    const expiresIn = tokenExchangeResult.expiresIn || 3600
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    // Store tokens in drive_connections table or update if exists
    const { data: existingConnection } = await admin
      .from('drive_connections')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()

    let updateResult
    if (existingConnection) {
      // Update existing connection
      updateResult = await admin
        .from('drive_connections')
        .update({
          access_token: tokenExchangeResult.accessToken,
          refresh_token: tokenExchangeResult.refreshToken || null,
          token_expires_at: tokenExpiresAt,
          is_authorized: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)
        .select()
        .single()
    } else {
      // Create new connection
      updateResult = await admin
        .from('drive_connections')
        .insert({
          client_id: clientId,
          access_token: tokenExchangeResult.accessToken,
          refresh_token: tokenExchangeResult.refreshToken || null,
          token_expires_at: tokenExpiresAt,
          is_authorized: true,
        })
        .select()
        .single()
    }

    if (updateResult.error) {
      console.error('Failed to store tokens:', updateResult.error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to store authorization tokens',
          clientId,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        authorized: true,
        message: 'Successfully authorized Google Drive access',
        clientId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Google Drive callback error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Callback processing failed',
      },
      { status: 500 }
    )
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
    }
  } catch (error) {
    console.error('Error exchanging code for tokens:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange error',
    }
  }
}
