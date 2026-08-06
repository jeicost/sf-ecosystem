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
// 4 MB, no 15. El límite de 15 era una promesa que la plataforma no puede
// cumplir: en Vercel, el cuerpo de una petición a un route handler está
// limitado a ~4,5 MB y no se puede subir por configuración (bodySizeLimit solo
// aplica a Server Actions). Con 15 MB, una foto de móvil fallaba con un 413
// crudo ANTES de llegar a este código, así que ni siquiera se podía dar un
// mensaje decente. Ahora se rechaza aquí, con una explicación.
const MAX_BYTES = 4 * 1024 * 1024

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
      return NextResponse.json({ error: 'No file received' }, { status: 400 })
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files per upload` }, { status: 400 })
    }

    const storage = adminClient().storage.from('brand-assets')
    const uploaded: Attachment[] = []

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 4 MB. Resize it or take a smaller screenshot.` },
          { status: 400 }
        )
      }
      if (!isAllowedMime(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type || 'unknown'} (${file.name})` },
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
        return NextResponse.json({ error: `Could not upload "${file.name}": ${error.message}` }, { status: 500 })
      }

      const type: Attachment['type'] =
        file.type === 'application/pdf' ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'text'
      uploaded.push({
        type,
        name: file.name,
        url: `/api/brand-assets?path=${encodeURIComponent(path)}`,
        mimeType: file.type || 'text/plain',
        path,
      })
    }

    return NextResponse.json({ attachments: uploaded, success: true })
  } catch (error) {
    console.error('Attachment upload error:', error)
    return NextResponse.json({ error: 'Internal error uploading files' }, { status: 500 })
  }
}
