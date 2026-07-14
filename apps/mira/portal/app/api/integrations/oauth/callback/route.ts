import { NextRequest, NextResponse } from 'next/server'
import { getOAuthConfig, getOAuthRedirectUri } from '@/lib/integrations/oauth-config'
import { createServiceClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Unknown error'
      console.error('OAuth error from provider:', error, errorDescription)
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent(errorDescription)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
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
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent('Invalid state token')}`
      )
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await db.from('oauth_sessions').delete().eq('state', state)
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent('Authorization expired')}`
      )
    }

    const { tool, client_id: clientId } = session

    const oauthConfig = getOAuthConfig(tool)
    if (!oauthConfig) {
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent('Invalid tool')}`
      )
    }

    // Exchange code for token
    const clientIdEnv = process.env[oauthConfig.clientIdEnvVar]
    const clientSecretEnv = process.env[oauthConfig.clientSecretEnvVar]

    if (!clientIdEnv || !clientSecretEnv) {
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent('OAuth not configured')}`
      )
    }

    const redirectUri = getOAuthRedirectUri(tool)

    if (!oauthConfig.tokenUrl) {
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent('OAuth token URL not configured')}`
      )
    }

    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientIdEnv,
        client_secret: clientSecretEnv,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(
        `/integrations?error=${encodeURIComponent('Failed to exchange authorization code')}`
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

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
          metadata: {
            oauth_refresh_token: tokenData.refresh_token || null,
            oauth_expires_at: tokenData.expires_in
              ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
              : null,
            oauth_provider: oauthConfig.name,
          },
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
        metadata: {
          oauth_refresh_token: tokenData.refresh_token || null,
          oauth_expires_at: tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          oauth_provider: oauthConfig.name,
        },
        connected_at: new Date().toISOString(),
      })
    }

    // Clean up state token
    await db.from('oauth_sessions').delete().eq('state', state)

    // Redirect back with success
    return NextResponse.redirect(`/integrations?success=${tool}`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `/integrations?error=${encodeURIComponent('OAuth callback failed')}`
    )
  }
}
