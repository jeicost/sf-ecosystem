import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

const BUCKET = 'agent-documents'
const SIGNED_URL_EXPIRATION = 3600 // 1 hora, igual que /api/assets

/**
 * GET /api/documents/{id}/download
 *
 * Descarga de un documento de la biblioteca del cliente, con la firma
 * regenerada en cada petición.
 *
 * Por qué existe: `uploadFileToStorage` (lib/supabase-storage.ts:75) devuelve
 * una signed URL de 7 días y esa URL se guardaba tal cual en
 * `client_documentation.storage_url` de forma permanente — o sea, el enlace
 * de cualquier documento moría a la semana de subirlo. Mismo patrón que ya
 * resolvió /api/assets para los assets generados: guardar algo estable y
 * firmar fresco al leer.
 *
 * Como `client_documentation` no tiene columna de ruta (verificado contra el
 * esquema real: hay storage_url pero no storage_path/file_path), la ruta del
 * objeto se extrae de la propia URL almacenada — toda signed URL de Supabase
 * lleva dentro `/object/sign/{bucket}/{path}`. Así no hace falta migración y
 * funciona igual con las filas que ya existieran.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: row } = await admin
      .from('client_documentation')
      .select('id, client_id, storage_url, filename')
      .eq('id', id)
      .maybeSingle()

    if (!row) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, row.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }
    if (!row.storage_url) {
      return NextResponse.json({ error: 'Document has no stored file' }, { status: 404 })
    }

    const objectPath = extractObjectPath(row.storage_url)
    if (!objectPath) {
      // Fila antigua con una URL que no encaja con el formato de Storage:
      // devolverla tal cual es mejor que un 500 (puede ser un enlace externo),
      // aunque si era una signed URL caducada el navegador dará 400.
      return NextResponse.redirect(row.storage_url, 302)
    }

    const { data, error } = await admin
      .storage.from(BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_EXPIRATION, {
        download: row.filename || true,
      })

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: error?.message || 'File not found in storage' },
        { status: 404 }
      )
    }

    return NextResponse.redirect(data.signedUrl, 302)
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Download failed' },
      { status: 500 }
    )
  }
}

/**
 * Saca `clients/{id}/agents/documents/fichero.pdf` de una signed URL del tipo
 * https://<ref>.supabase.co/storage/v1/object/sign/agent-documents/clients/...?token=...
 * Devuelve null si la URL no tiene esa forma (enlace externo, formato viejo).
 */
function extractObjectPath(storageUrl: string): string | null {
  try {
    const { pathname } = new URL(storageUrl)
    const marker = `/object/sign/${BUCKET}/`
    const at = pathname.indexOf(marker)
    if (at === -1) return null
    const path = decodeURIComponent(pathname.slice(at + marker.length))
    // Defensa básica: nada de traversal ni rutas vacías
    if (!path || path.includes('..')) return null
    return path
  } catch {
    return null
  }
}
