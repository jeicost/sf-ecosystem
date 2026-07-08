import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { PLAN_SECTIONS } from '@/lib/plans'
import type { UserPlan } from '@/lib/plans'

const SECTION_SLUGS = ['marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — skip all checks
  if (pathname.startsWith('/login') || pathname.startsWith('/reset-password') || pathname.startsWith('/api/webhook') || pathname.startsWith('/api/debug')) {
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

  // Enforce section-level plan access
  const plan = (user.user_metadata?.plan ?? 'starter') as UserPlan
  const sectionMatch = pathname.match(/^\/(marketing|comercial|estrategia|innovacion|finanzas)(\/|$)/)
  if (sectionMatch) {
    const section = sectionMatch[1]
    const allowed = PLAN_SECTIONS[plan] ?? PLAN_SECTIONS.starter
    if (!allowed.includes(section)) {
      return NextResponse.redirect(new URL('/home', request.url))
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
