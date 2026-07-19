import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import type { AuthorizeRequest, AuthorizeResponse } from '@/lib/drive-connection.types'

/**
 * POST /api/brand-brain/drive/authorize
 * Initiates Google Drive OAuth2 flow for a client.
 *
 * Request body:
 *   - clientId (optional): Explicit client ID for dev mode
 *   - redirectUrl: URL to redirect to after authorization (should be /api/brand-brain/drive/callback)
 *
 * Response:
 *   - authUrl: OAuth2 authorization URL to redirect user to
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AuthorizeRequest>
    const { redirectUrl, clientId: explicitClientId, returnTo } = body

    if (!redirectUrl) {
      return NextResponse.json({ error: 'Missing redirectUrl' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let clientId: string
    if (explicitClientId) {
      clientId = explicitClientId
    } else if (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' && (!user || authError)) {
      clientId = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else {
      const admin = adminClient()
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessData?.length) {
        return NextResponse.json({ error: 'No client access' }, { status: 403 })
      }
      clientId = accessData[0].project_id
    }

    // Validate required environment variables for Google OAuth
    const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

    if (!clientSecret || !googleClientId) {
      console.error('Missing Google OAuth configuration')
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      )
    }

    // Build OAuth2 authorization URL
    const scopes = ['https://www.googleapis.com/auth/drive.readonly']
    const state = Buffer.from(JSON.stringify({ clientId, timestamp: Date.now(), returnTo: typeof returnTo === 'string' ? returnTo : undefined })).toString('base64')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', googleClientId)
    authUrl.searchParams.set('redirect_uri', redirectUrl)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('access_type', 'offline') // Request refresh token
    authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token

    const response: AuthorizeResponse = {
      authUrl: authUrl.toString(),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Google Drive authorize error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authorization failed' },
      { status: 500 }
    )
  }
}
