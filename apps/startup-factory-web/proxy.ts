import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['es', 'en', 'th']
const defaultLocale = 'es'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasLocale = locales.some(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`)
  if (!hasLocale && pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
  }
  if (!hasLocale && pathname !== '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}${pathname}`, request.url))
  }
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
}
