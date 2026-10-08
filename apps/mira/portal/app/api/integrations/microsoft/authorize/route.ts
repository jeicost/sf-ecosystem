import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { authorizeUrl, adminConsentUrl, microsoftConfig, scopesFor, type MicrosoftPurpose } from '@/lib/microsoft/graph'

/**
 * POST /api/integrations/microsoft/authorize
 * Body: { clientId, purpose: 'files' | 'mail', returnTo?, loginHint? }
 * Arranca el OAuth de Microsoft 365 para una marca. Devuelve { authUrl } y,
 * para el administrador del cliente, { adminConsentUrl }.
 *
 * Mismo patrón que Drive: el state es OPACO y la marca, la persona, el
 * propósito y el destino de vuelta viven en oauth_sessions (con el
 * code_verifier de PKCE). El callback solo se fía de esa fila.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { clientId?: string; purpose?: string; returnTo?: string; loginHint?: string }
    const config = microsoftConfig()
    if (!config) {
      return NextResponse.json({ error: 'microsoft_not_configured', message: 'Microsoft 365 is not configured yet (MS_OAUTH_CLIENT_ID / MS_OAUTH_CLIENT_SECRET / MS_REDIRECT_URI).' }, { status: 503 })
    }
    // strict: conectar una cuenta ESCRIBE bajo una marca; sin clientId explícito, 400.
    const access = await resolveRequestClient(typeof body.clientId === 'string' && body.clientId ? body.clientId : null, { strict: true })
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const purpose: MicrosoftPurpose = body.purpose === 'mail' ? 'mail' : 'files'
    const scopes = scopesFor(purpose)
    const state = randomUUID()
    // PKCE: 48 bytes → 64 chars base64url (la norma admite 43-128).
    const codeVerifier = randomBytes(48).toString('base64url')
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')
    const returnTo = typeof body.returnTo === 'string' && body.returnTo.startsWith('/') && !body.returnTo.startsWith('//') ? body.returnTo : null

    const { error } = await adminClient().from('oauth_sessions').insert({
      state,
      // El propósito viaja en el nombre de la herramienta: el callback sabe
      // qué permisos se pidieron sin fiarse de nada que venga del navegador.
      tool: `microsoft:${purpose}`,
      client_id: access.clientId,
      user_id: access.userId,
      code_verifier: codeVerifier,
      return_to: returnTo,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    if (error) {
      console.error('microsoft authorize: no se pudo guardar el state:', error.message)
      return NextResponse.json({ error: 'Could not start the Microsoft 365 connection' }, { status: 500 })
    }

    return NextResponse.json({
      authUrl: authorizeUrl({ config, state, codeChallenge, scopes, loginHint: typeof body.loginHint === 'string' ? body.loginHint : undefined }),
      adminConsentUrl: adminConsentUrl(config, scopes, state),
      scopes,
    })
  } catch (error) {
    console.error('microsoft authorize error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Authorization failed' }, { status: 500 })
  }
}
