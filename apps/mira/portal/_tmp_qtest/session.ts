// Crea una cookie de sesión real (@supabase/ssr) para un usuario, sin conocer su password:
// magiclink por Admin API -> verify -> sesión -> cookie sb-<ref>-auth-token (base64url, troceada).
import { createClient } from '@supabase/supabase-js'

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY!
const REF = new URL(URL_).hostname.split('.')[0]
const MAX = 3180

function b64url(s: string) {
  return Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function cookieForUser(email: string): Promise<string> {
  const admin = createClient(URL_, SR, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error || !data?.properties?.hashed_token) throw new Error(`generateLink: ${error?.message}`)
  const anon = createClient(URL_, ANON, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: verified, error: vErr } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.properties.hashed_token,
  })
  const session = verified?.session
  if (!session?.access_token) throw new Error(`verify failed: ${vErr?.message}`)
  const payload = 'base64-' + b64url(JSON.stringify(session))
  const name = `sb-${REF}-auth-token`
  if (payload.length <= MAX) return `${name}=${payload}`
  const parts: string[] = []
  for (let i = 0; i < payload.length; i += MAX) parts.push(payload.slice(i, i + MAX))
  return parts.map((p, i) => `${name}.${i}=${p}`).join('; ')
}
