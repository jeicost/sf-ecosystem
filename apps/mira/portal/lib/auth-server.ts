import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates that the authenticated user has access to the specified clientId.
 * User must either:
 * 1. Have user_metadata.client_id === clientId, OR
 * 2. Have plan 'admin' or 'super_admin' (unrestricted access)
 *
 * @param req NextRequest with authentication cookies
 * @param clientId The client/brand ID to validate access for
 * @returns { user, clientId } on success, or NextResponse with 401/403 on failure
 */
export async function requireClientAccess(
  req: NextRequest,
  clientId: string
): Promise<
  | { success: true; user: any; clientId: string }
  | NextResponse
> {
  // Validate clientId parameter
  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientId' },
      { status: 400 }
    )
  }

  // Build response wrapper for cookie handling
  let response = NextResponse.next({ request: req })

  // Create server client with cookie support (validates JWT from auth session)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          )
        },
      },
    }
  )

  // Validate JWT session (getUser() checks the JWT in cookies)
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing session' },
      { status: 401 }
    )
  }

  // Check access: user's client_id must match, OR user has admin/super_admin plan
  const userPlan = user.user_metadata?.plan as string | undefined
  const userClientId = user.user_metadata?.client_id as string | undefined

  const hasAccess = userClientId === clientId || userPlan === 'admin' || userPlan === 'super_admin'

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Forbidden: No access to this client' },
      { status: 403 }
    )
  }

  return {
    success: true,
    user,
    clientId,
  }
}
