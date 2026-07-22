import { NextRequest, NextResponse } from 'next/server'
import { getOAuthConfig, getOAuthRedirectUri } from '@/lib/integrations/oauth-config'
import { createServiceClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  // Next 15 exige URLs absolutas en redirect(); relativas lanzan TypeError.
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url))
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error'
      console.error('OAuth error from provider:', error, errorDescription)
      return redirectTo(
        `/integrations?error=${encodeURIComponent(errorDescription)}`
      )
    }

    if (!code || !state) {
      return redirectTo(
        `/integrations?error=${encodeURIComponent('Missing authorization code or state')}`
      )
    }

    const db = createServiceClient()

    // Verify state token
    const { data: session, error: sessionError } = await db
      .from('oauth_sessions')
      .select('*')
      .eq('state', state)
      .single()

    if (sessionError || !session) {
      console.error('Invalid state token')
      return redirectTo(
        `/integrations?error=${encodeURIComponent('Invalid state token')}`
      )
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await db.from('oauth_sessions').delete().eq('state', state)
      return redirectTo(
        `/integrations?error=${encodeURIComponent('Authorization expired')}`
      )
    }

    const { tool, client_id: clientId } = session

    const oauthConfig = getOAuthConfig(tool)
    if (!oauthConfig) {
      return redirectTo(
        `/integrations?error=${encodeURIComponent('Invalid tool')}`
      )
    }

    // Exchange code for token
    const clientIdEnv = process.env[oauthConfig.clientIdEnvVar]
    const clientSecretEnv = process.env[oauthConfig.clientSecretEnvVar]

    if (!clientIdEnv || !clientSecretEnv) {
      return redirectTo(
        `/integrations?error=${encodeURIComponent('OAuth not configured')}`
      )
    }

    const redirectUri = getOAuthRedirectUri(tool)

    if (!oauthConfig.tokenUrl) {
      return redirectTo(
        `/integrations?error=${encodeURIComponent('OAuth token URL not configured')}`
      )
    }

    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    })
    // PKCE: send the code_verifier stored by the /start route for this session
    if (session.code_verifier) {
      tokenParams.set('code_verifier', session.code_verifier)
    }
    const tokenHeaders: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    }
    if (oauthConfig.tokenAuthMethod === 'basic') {
      // e.g. Canva requires HTTP Basic client authentication
      tokenHeaders['Authorization'] =
        'Basic ' + Buffer.from(`${clientIdEnv}:${clientSecretEnv}`).toString('base64')
    } else {
      tokenParams.set('client_id', clientIdEnv)
      tokenParams.set('client_secret', clientSecretEnv)
    }

    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: 'POST',
      headers: tokenHeaders,
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return redirectTo(
        `/integrations?error=${encodeURIComponent('Failed to exchange authorization code')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token || null
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    const metadata = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      // legacy keys kept for older consumers of this metadata shape
      oauth_refresh_token: refreshToken,
      oauth_expires_at: expiresAt,
      oauth_provider: oauthConfig.name,
    }

    // Store connection
    const { data: existing } = await db
      .from('tool_connections')
      .select('id')
      .eq('client_id', clientId)
      .eq('tool_id', tool)
      .single()

    if (existing) {
      await db
        .from('tool_connections')
        .update({
          status: 'connected',
          auth_token: accessToken,
          metadata,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', clientId)
        .eq('tool_id', tool)
    } else {
      await db.from('tool_connections').insert({
        client_id: clientId,
        tool_id: tool,
        status: 'connected',
        auth_token: accessToken,
        metadata,
        connected_at: new Date().toISOString(),
      })
    }

    // Clean up state token
    await db.from('oauth_sessions').delete().eq('state', state)

    // Redirect back with success
    return redirectTo(`/integrations?success=${tool}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return redirectTo(
      `/integrations?error=${encodeURIComponent('OAuth callback failed')}`
    )
  }
}
