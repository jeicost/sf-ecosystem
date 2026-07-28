import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import type { Attachment } from '@/lib/attachments'

export const runtime = 'nodejs'
export const maxDuration = 60

// Subida de adjuntos server-side. El bucket brand-assets no tiene policy de
// INSERT para usuarios autenticados (verificado 2026-07-28: cero objetos de
// cliente en todo el bucket — la subida directa desde navegador NUNCA funcionó),
// así que la autorización se hace aquí con resolveRequestClient y escribe el
// admin client, igual que el resto de rutas.

const ALLOWED_PREFIXES = new Set(['quick-actions', 'assets', 'business-reports', 'onboarding'])
const MAX_FILES = 5
const MAX_BYTES = 15 * 1024 * 1024

function isAllowedMime(mime: string): boolean {
  return (
    mime === 'application/pdf' ||
    mime.startsWith('image/') ||
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === '' // algunos navegadores no informan mime en .md/.txt
  )
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'file'
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const access = await resolveRequestClient((form.get('clientId') as string) || null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const rawPrefix = (form.get('prefix') as string) || 'assets'
    const prefix = ALLOWED_PREFIXES.has(rawPrefix) ? rawPrefix : 'assets'
    const files = form.getAll('files').filter((f): f is File => f instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Máximo ${MAX_FILES} archivos por subida` }, { status: 400 })
    }

    const storage = adminClient().storage.from('brand-assets')
    const uploaded: Attachment[] = []

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" supera el límite de 15MB` },
          { status: 400 }
        )
      }
      if (!isAllowedMime(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no soportado: ${file.type || 'desconocido'} (${file.name})` },
          { status: 415 }
        )
      }

      // client_id SIEMPRE del acceso resuelto, nunca del body — un usuario no
      // puede escribir en la carpeta de otro cliente.
      const path = `${access.clientId}/${prefix}/${Date.now()}-${sanitizeName(file.name)}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error } = await storage.upload(path, buffer, {
        contentType: file.type || 'text/plain',
        upsert: true,
      })
      if (error) {
        return NextResponse.json({ error: `Error subiendo "${file.name}": ${error.message}` }, { status: 500 })
      }

      const { data } = storage.getPublicUrl(path)
      const type: Attachment['type'] =
        file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'text'
      uploaded.push({ type, name: file.name, url: data.publicUrl, mimeType: file.type || 'text/plain' })
    }

    return NextResponse.json({ attachments: uploaded, success: true })
  } catch (error) {
    console.error('Attachment upload error:', error)
    return NextResponse.json({ error: 'Error interno subiendo archivos' }, { status: 500 })
  }
}
