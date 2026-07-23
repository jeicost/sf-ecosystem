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
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/api/health') || // uptime monitors hit this unauthenticated
    pathname.startsWith('/api/webhook') || // Webhooks verify x-webhook-secret header, not user auth
    pathname.startsWith('/api/toolkit/generate-batch') // Batch generation — protected by x-batch-secret in the route
  ) {
    return NextResponse.next()
  }

  // Build a response we can attach refreshed cookies to
  let response = NextResponse.next({ request })

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
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
