import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
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

    // The redirect_uri sent to Google MUST match the one the callback uses for
    // the code exchange, and el callback exige GOOGLE_REDIRECT_URI — sin él, el
    // flujo arrancaría pero el exchange fallaría siempre. Fallamos temprano.
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    if (!redirectUri) {
      return NextResponse.json(
        { error: 'GOOGLE_REDIRECT_URI no configurado — el flujo de Drive no puede completarse' },
        { status: 503 }
      )
    }

    // Autorización canónica (lib/resolve-client). La versión anterior tenía el
    // peor agujero de este grupo de rutas: con clientId explícito en el body NO
    // se comprobaba ni la sesión — cualquiera podía arrancar un OAuth cuyo
    // callback guardaba la conexión de Drive bajo el cliente que quisiera.
    // El callback confía en el clientId del state, así que el state solo puede
    // nacer autorizado.
    const access = await resolveRequestClient(
      typeof explicitClientId === 'string' && explicitClientId ? explicitClientId : null
    )
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }
    const clientId = access.clientId

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
    // drive.file permite crear/escribir SOLO ficheros creados por la app
    // (necesario para exportar entregables al Drive del cliente). Conexiones
    // antiguas solo-readonly caen al fallback de Service Account hasta re-autorizar.
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
    ]
    const state = Buffer.from(JSON.stringify({ clientId, timestamp: Date.now(), returnTo: typeof returnTo === 'string' ? returnTo : undefined })).toString('base64')

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', googleClientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
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
