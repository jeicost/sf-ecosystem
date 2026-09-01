import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { PLAN_SECTIONS } from '@/lib/plans'
import type { UserPlan } from '@/lib/plans'
import { getActiveSectionFromPath } from '@/lib/sections'
import { checkRateLimit } from '@/lib/rate-limit'

// Path prefixes for the ~20 routes that call Claude/OpenAI/Tavily/Apollo —
// the only ones rate-limited (cheap reads/writes are left alone).
const EXPENSIVE_API_PREFIXES = [
  '/api/agent',
  '/api/comercial/',
  '/api/toolkit/',
  '/api/documents/',
  '/api/quick-actions',
  '/api/content-engine/',
  '/api/brief',
  '/api/brand-brain/',
  '/api/sales-engine/',
  // Email Ops: solo lo que llama a Claude (reprocesar); el listado no se limita.
  '/api/email-ops/reprocess',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — skip auth checks
  // NOTE: API routes are NOT in this list. They must be protected at middleware or route level.
  // Debug/seed/init routes (debug-*, fix-*, init-*, populate-*, etc.) have their own requireAuthGate()
  // and will 401 if called without auth — they should NOT skip auth at the middleware layer.
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') || // registro del cliente final: por definición aún no hay sesión
    pathname.startsWith('/api/signup') || // la ruta que lo crea; se defiende sola con rate limit por IP
    pathname.startsWith('/api/billing/webhook') || // Stripe firma con su secreto, no con una sesión
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/api/health') || // uptime monitors hit this unauthenticated
    pathname.startsWith('/api/webhook') || // Webhooks verify x-webhook-secret header, not user auth
    pathname.startsWith('/api/toolkit/generate-batch') || // Batch generation — protected by x-batch-secret in the route
    pathname.startsWith('/api/cron') // Crons de Vercel — protegidos por Bearer CRON_SECRET en la propia ruta
  ) {
    return NextResponse.next()
  }

  // Build a response we can attach refreshed cookies to
  let response = NextResponse.next({ request })

  // NOTE: intentionally NOT using @sf/supabase's createServerComponentClient here.
  // That factory's cookie adapter calls `set()` once PER COOKIE, which is correct
  // for a Server Component (a plain object jar, order/count-independent), but wrong
  // here: @supabase/ssr can batch multiple cookies in one setAll() (session cookies
  // get chunked into name.0/name.1/... once the encoded session is large enough,
  // e.g. for super_admin users with heavier user_metadata), and recreating
  // `response` on every individual cookie call discards whatever Set-Cookie header
  // was written on the previous cookie's now-abandoned response object -- only the
  // last cookie in the batch would ever reach the browser. Real setAll(), which
  // receives the whole batch at once, is required here so `response` gets recreated
  // exactly once per batch, after every cookie has already been applied to `request`.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  // getUser() validates the JWT on every request — no localStorage involved
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // API routes must return JSON, not a redirect: fetch() follows redirects by
    // default, so a caller doing the common `res.ok ? res.json() : ...` gets
    // `ok: true` with the /login page's HTML and throws parsing it as JSON
    // (confirmed happening for real in lib/client-context.tsx during a session
    // race). Pages still redirect, since a browser navigation should land on
    // the login form, not raw JSON.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin routes — protected, super_admin only
  if (pathname.startsWith('/admin')) {
    if (user.user_metadata?.plan !== 'super_admin') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
    return response
  }

  // Rate limit the expensive AI-calling routes (best-effort, see lib/rate-limit.ts).
  // Keyed by user id — cheap reads/writes elsewhere are never limited.
  if (EXPENSIVE_API_PREFIXES.some(p => pathname.startsWith(p))) {
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
  }

  // ─── Gate de suscripción: trial caducado / cancelado ───────────────────
  // Hasta ahora `subscription_status` y `trial_ends_at` se escribían (webhook
  // de Stripe, signup) y se PINTABAN (/billing), pero nada los leía para
  // denegar: el trial caducado y el 'canceled' eran idénticos a 'active' —
  // cobrar era opcional. Este gate cierra eso a nivel de PÁGINA (el nivel del
  // trial honesto); las rutas /api quedan bajo rate limit + cap de
  // generaciones, no bajo este gate.
  //
  // Exentos: super_admin y cuentas gestionadas (alta asistida sin suscripción
  // de Stripe — los 14 clientes históricos con condiciones acordadas fuera de
  // la plataforma; decisión de Carlos 01-sep: a ellos no se les corta nunca).
  // 'past_due' tampoco corta: la gracia es el ciclo de reintentos de Stripe,
  // que degrada a 'canceled' él solo si los cobros no entran.
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/billing')) {
    const gate = await checkSubscriptionGate(request, user)
    if (gate.blocked) {
      const billingUrl = new URL('/billing', request.url)
      billingUrl.searchParams.set('blocked', gate.reason)
      const redirect = NextResponse.redirect(billingUrl)
      if (gate.cacheValue) setGateCookie(redirect, gate.cacheValue)
      return redirect
    }
    if (gate.cacheValue) setGateCookie(response, gate.cacheValue)
  }

  // Enforce section-level plan access. DISABLED by default (ENFORCE_PLAN_LIMITS
  // unset) so this is a no-op for every existing beta client until explicitly
  // turned on in Vercel — before doing that, check each real client's plan
  // against what they actually use today (see docs/MIRA-LANZAMIENTO-FASE2.md).
  // getActiveSectionFromPath (lib/sections.ts) is the single source of truth
  // for section routing, including Marketing's routes (/roster, /command, ...)
  // which have no common /marketing prefix — the previous regex here only
  // ever matched /comercial and /finanzas, and used slugs (estrategia,
  // innovacion) that don't exist as routes at all.
  if (process.env.ENFORCE_PLAN_LIMITS === 'true') {
    const section = getActiveSectionFromPath(pathname)
    if (section) {
      const plan = (user.user_metadata?.plan ?? 'starter') as UserPlan
      const allowed = PLAN_SECTIONS[plan] ?? PLAN_SECTIONS.starter
      if (!allowed.includes(section.slug)) {
        const homeUrl = new URL('/home', request.url)
        homeUrl.searchParams.set('blocked', section.slug)
        homeUrl.searchParams.set('plan', plan)
        return NextResponse.redirect(homeUrl)
      }
    }
  }

  return response
}

// ─── Suscripción: helper del gate ────────────────────────────────────────
//
// Consulta la fila del cliente por PostgREST con la service key (RLS fuera:
// el middleware autoriza por el JWT ya validado arriba, no por políticas) y
// cachea el veredicto 5 min en una cookie HttpOnly para no pagar una consulta
// por navegación. Consecuencia asumida: tras pagar, el desbloqueo puede
// tardar hasta 5 min en las páginas — /billing nunca pasa por aquí, así que
// la pantalla de pago siempre responde.
//
// Fail-open deliberado: si la consulta falla, el portal NO se cae por culpa
// del gate (misma filosofía que checkGenerationCap). El fallo queda en logs.

const GATE_COOKIE = 'mira_subgate'
const GATE_TTL_MS = 5 * 60 * 1000

interface GateVerdict {
  blocked: boolean
  reason: 'trial_ended' | 'canceled' | ''
  /** Valor a cachear en cookie; null = no cachear (fallo de consulta). */
  cacheValue: string | null
}

function setGateCookie(res: NextResponse, value: string) {
  res.cookies.set(GATE_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(GATE_TTL_MS / 1000),
  })
}

async function checkSubscriptionGate(
  request: NextRequest,
  user: { id: string; user_metadata?: Record<string, unknown> }
): Promise<GateVerdict> {
  const ok: GateVerdict = { blocked: false, reason: '', cacheValue: null }

  const plan = user.user_metadata?.plan
  if (plan === 'super_admin' || plan === 'admin') return ok

  // Sin client_id en metadata no hay marca que facturar (usuarios de agencia
  // históricos): el gate no aplica.
  const clientId = user.user_metadata?.client_id
  if (typeof clientId !== 'string' || !clientId) return ok

  // Cookie fresca del mismo cliente → veredicto cacheado.
  const cached = request.cookies.get(GATE_COOKIE)?.value
  if (cached) {
    const [cid, verdict, reason, expires] = cached.split('|')
    if (cid === clientId && Number(expires) > Date.now()) {
      return verdict === 'blocked'
        ? { blocked: true, reason: (reason as GateVerdict['reason']) || 'canceled', cacheValue: cached }
        : ok
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return ok

  try {
    const res = await fetch(
      `${url}/rest/v1/clients?id=eq.${encodeURIComponent(clientId)}&select=subscription_status,trial_ends_at,stripe_subscription_id,onboarding_mode`,
      { headers: { apikey: key, authorization: `Bearer ${key}` } }
    )
    if (!res.ok) return ok
    const rows: Array<{
      subscription_status: string | null
      trial_ends_at: string | null
      stripe_subscription_id: string | null
      onboarding_mode: string | null
    }> = await res.json()
    const client = rows[0]
    if (!client) return ok

    // Cuenta gestionada (los 14 históricos): mismas condiciones que
    // managedAccount en /api/billing/status — jamás se bloquea.
    if (client.onboarding_mode === 'assisted' && !client.stripe_subscription_id) {
      return { ...ok, cacheValue: gateCookieValue(clientId, 'ok', '') }
    }

    const status = client.subscription_status
    let reason: GateVerdict['reason'] = ''
    if (status === 'canceled' || status === 'paused') {
      reason = 'canceled'
    } else if (status === 'trialing' && client.trial_ends_at) {
      const graceMs = 7 * 86_400_000 // 7 días de gracia tras caducar la prueba
      if (Date.now() > new Date(client.trial_ends_at).getTime() + graceMs) reason = 'trial_ended'
    }

    if (reason) {
      return { blocked: true, reason, cacheValue: gateCookieValue(clientId, 'blocked', reason) }
    }
    return { ...ok, cacheValue: gateCookieValue(clientId, 'ok', '') }
  } catch (err) {
    console.error('subscription gate: lookup failed (fail-open):', err instanceof Error ? err.message : err)
    return ok
  }
}

function gateCookieValue(clientId: string, verdict: 'ok' | 'blocked', reason: string): string {
  return `${clientId}|${verdict}|${reason}|${Date.now() + GATE_TTL_MS}`
}

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT Next.js internals and static files
    // IMPORTANT: Includes /api/* and /webhook/* — auth must be centralized here or delegated to individual routes
    '/((?!_next/static|_next/image|favicon.ico|.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
