import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { buildOAuthUrl, getOAuthConfig } from '@/lib/integrations/oauth-config'
import { createServiceClient } from '@/lib/supabase-admin'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { tool: string } }
) {
  try {
    const { tool } = params
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const oauthConfig = getOAuthConfig(tool)
    if (!oauthConfig) {
      return NextResponse.json({ error: 'Invalid tool' }, { status: 400 })
    }

    // Check if env vars are configured
    const clientIdEnv = process.env[oauthConfig.clientIdEnvVar]
    if (!clientIdEnv) {
      return NextResponse.json(
        {
          error: `OAuth not configured for ${oauthConfig.name}`,
          message: `Set ${oauthConfig.clientIdEnvVar} and ${oauthConfig.clientSecretEnvVar} env vars`,
        },
        { status: 503 }
      )
    }

    // Create state token
    const state = Buffer.from(
      JSON.stringify({
        clientId,
        tool,
        timestamp: Date.now(),
        nonce: randomBytes(32).toString('base64url'),
      })
    ).toString('base64')

    // PKCE (S256) — only for tools that opt in via config.pkce (e.g. Canva)
    let codeVerifier: string | null = null
    let codeChallenge: string | undefined
    if (oauthConfig.pkce) {
      // 48 random bytes → 64 base64url chars (spec allows 43-128)
      codeVerifier = randomBytes(48).toString('base64url')
      codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
    }

    // Store state in a temporary session or cookie (simple approach: store in Supabase)
    const db = createServiceClient()
    const { error: sessionInsertError } = await db.from('oauth_sessions').insert({
      state,
      tool,
      client_id: clientId,
      code_verifier: codeVerifier,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60000).toISOString(), // 15 min
    })
    if (sessionInsertError) {
      console.error('oauth_sessions insert failed:', sessionInsertError)
      return NextResponse.json(
        { error: 'OAuth session could not be created (has migration 0036 been applied?)' },
        { status: 500 }
      )
    }

    // Build OAuth URL
    const oauthUrl = buildOAuthUrl(tool, clientIdEnv, state, codeChallenge)
    if (!oauthUrl) {
      return NextResponse.json({ error: 'Failed to build OAuth URL' }, { status: 500 })
    }

    return NextResponse.redirect(oauthUrl)
  } catch (error) {
    console.error('OAuth start error:', error)
    return NextResponse.json({ error: 'Failed to start OAuth flow' }, { status: 500 })
  }
}
