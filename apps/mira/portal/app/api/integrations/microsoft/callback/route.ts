import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'
import { microsoftConfig, exchangeCode, decodeIdToken, getMe, scopesFor, type MicrosoftPurpose } from '@/lib/microsoft/graph'
import { upsertConnection } from '@/lib/microsoft/connections'

/**
 * GET /api/integrations/microsoft/callback?code=&state=
 * Vuelta del consentimiento de Microsoft. Canjea el código (con PKCE), lee
 * quién es la cuenta y guarda la conexión cifrada bajo la marca de la fila
 * de oauth_sessions. También recibe la vuelta del consentimiento de
 * administrador (admin_consent=True, sin code).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')
  const adminConsent = searchParams.get('admin_consent')

  let returnPath = '/integrations'
  const backTo = (status: string) => NextResponse.redirect(new URL(`${returnPath}?microsoft=${status}`, req.url))

  if (oauthError) return backTo(`error&reason=${encodeURIComponent(searchParams.get('error_description')?.split('.')[0] || oauthError)}`)
  if (!state) return backTo('error&reason=missing_state')

  try {
    const admin = adminClient()
    const { data: session } = await admin
      .from('oauth_sessions')
      .select('client_id, user_id, return_to, expires_at, tool, code_verifier')
      .eq('state', state)
      .like('tool', 'microsoft:%')
      .maybeSingle()
    if (!session) return backTo('error&reason=bad_state')
    if (session.return_to) returnPath = session.return_to

    // El consentimiento de administrador no trae código ni crea conexión: el
    // administrador solo autoriza la app en su organización. El state se
    // conserva para que la persona pueda conectar su cuenta a continuación.
    if (adminConsent === 'True' && !code) return backTo('admin_consent')

    // De un solo uso: gastado el state, la fila desaparece pase lo que pase.
    await admin.from('oauth_sessions').delete().eq('state', state)
    if (!code) return backTo('error&reason=missing_code')
    if (new Date(session.expires_at) < new Date()) return backTo('error&reason=state_expired')

    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { getAll: () => cookieStore.getAll() }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return backTo('error&reason=no_session')
    if (session.user_id && session.user_id !== user.id) return backTo('error&reason=wrong_user')
    const clientId: string = session.client_id
    if (!(await userCanAccessClient(user, clientId))) return backTo('error&reason=no_access')

    const config = microsoftConfig()
    if (!config) return backTo('error&reason=not_configured')
    const purpose: MicrosoftPurpose = session.tool === 'microsoft:mail' ? 'mail' : 'files'
    const tokens = await exchangeCode(config, code, session.code_verifier || '', scopesFor(purpose))
    if (!tokens.ok) {
      console.error('microsoft callback: token exchange failed:', tokens.error)
      return backTo('error&reason=token_exchange')
    }

    const claims = decodeIdToken(tokens.tokens.idToken)
    let fallbackEmail: string | null = null
    let fallbackName: string | null = null
    if (!claims.preferredUsername) {
      try {
        const me = await getMe(tokens.tokens.accessToken)
        fallbackEmail = me.mail || me.userPrincipalName || null
        fallbackName = me.displayName || null
      } catch { /* sin /me: se intenta con lo del id_token */ }
    }

    const saved = await upsertConnection(admin, { clientId, userId: user.id, tokens: tokens.tokens, claims, fallbackEmail, fallbackName, purpose })
    if ('error' in saved) {
      console.error('microsoft callback store error:', saved.error)
      return backTo('error&reason=store_failed')
    }
    return backTo(`connected&purpose=${purpose}&id=${saved.id}`)
  } catch (e) {
    console.error('microsoft callback error:', e)
    return backTo('error&reason=unknown')
  }
}
