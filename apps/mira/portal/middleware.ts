import { proxy } from '@/proxy'

export const middleware = proxy

export const config = {
  matcher: [
    // Run middleware on all routes EXCEPT Next.js internals and static files
    // IMPORTANT: Includes /api/* and /webhook/* — auth must be centralized here or delegated to individual routes
    '/((?!_next/static|_next/image|favicon.ico|.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
