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

    // app_metadata.is_admin is only settable server-side; a bare session
    // (any signed-up Supabase user) must NOT grant admin access.
    if (!user || user.app_metadata?.is_admin !== true) {
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
