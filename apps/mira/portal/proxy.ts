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

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT Next.js internals and static files
    // IMPORTANT: Includes /api/* and /webhook/* — auth must be centralized here or delegated to individual routes
    '/((?!_next/static|_next/image|favicon.ico|.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
