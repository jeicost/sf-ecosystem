import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])

// Subida de logo server-side, misma convención logos/{clientId}.{ext} usada
// por BrandBrainEditor y el chat de onboarding. El bucket brand-assets es
// privado (0056) -- la subida directa desde el navegador ya no aplica.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const access = await resolveRequestClient((form.get('clientId') as string) || null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El logo supera el límite de 10MB' }, { status: 400 })
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: `Tipo de archivo no soportado: ${file.type || 'desconocido'}` }, { status: 415 })
    }

    const ext = file.name.split('.').pop() || 'png'
    const path = `logos/${access.clientId}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await adminClient()
      .storage.from('brand-assets')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) {
      return NextResponse.json({ error: `Error subiendo el logo: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ path })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: 'Error interno subiendo el logo' }, { status: 500 })
  }
}
