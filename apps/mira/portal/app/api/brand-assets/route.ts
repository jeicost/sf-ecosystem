import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

const BUCKET = 'brand-assets'
const SIGNED_URL_EXPIRATION = 3600 // 1 hour

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/brand-assets?path=...
 *
 * Proxy autenticado al bucket privado brand-assets: valida sesión + grant
 * sobre el cliente dueño del path y redirige (302) a una signed URL fresca.
 * Acepta dos formas de path, las únicas que existen en el bucket:
 *   - logos/{clientId}.{ext}            (logo de marca)
 *   - {clientId}/{prefix}/{filename}     (adjuntos subidos vía /api/attachments/upload)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }
    if (path.includes('..') || path.includes('\\') || path.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    const segments = path.split('/')
    if (segments.some((s) => !s)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    let clientId: string
    if (segments[0] === 'logos') {
      if (segments.length !== 2) {
        return NextResponse.json({ error: 'Invalid path — expected logos/{clientId}.{ext}' }, { status: 400 })
      }
      clientId = segments[1].split('.')[0]
    } else {
      if (segments.length < 3) {
        return NextResponse.json(
          { error: 'Invalid path — expected {clientId}/{prefix}/...' },
          { status: 400 }
        )
      }
      clientId = segments[0]
    }
    if (!UUID_REGEX.test(clientId)) {
      return NextResponse.json({ error: 'Invalid clientId in path' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const { data, error } = await adminClient()
      .storage.from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRATION)

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || 'Asset not found' },
        { status: 404 }
      )
    }

    return NextResponse.redirect(data.signedUrl, 302)
  } catch (error) {
    console.error('brand-assets proxy error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Asset resolution failed' },
      { status: 500 }
    )
  }
}
