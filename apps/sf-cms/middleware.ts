import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Protect /admin/* and /api/admin/* routes
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const sessionCookie = request.cookies.get('sf-cms-session')

    if (!sessionCookie) {
      if (path.startsWith('/api/admin')) {
        return new Response('Unauthorized', { status: 401 })
      }
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
