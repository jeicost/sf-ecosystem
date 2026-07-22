import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protect /admin/* and /api/admin/* routes
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // Skip auth for login page itself
    if (path === '/admin/login') {
      return NextResponse.next()
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Middleware enforces authentication only (it can't query roles at the
    // edge). Authorization — global admin vs per-project editor — is enforced
    // in every /api/admin route via requireSession() + canAccessProject().
    if (!user) {
      if (path.startsWith('/api/admin')) {
        return new Response('Unauthorized', { status: 401 })
      }
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
