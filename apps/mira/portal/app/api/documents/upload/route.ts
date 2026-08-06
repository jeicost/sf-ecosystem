import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToStorage } from '@/lib/supabase-storage'
import { resolveRequestClient } from '@/lib/resolve-client'

// Subida de un fichero a la biblioteca del cliente (paso 1 de 2: fichero a
// Storage; el paso 2 guarda la fila en client_documentation vía POST
// /api/documents).
//
// Esta ruta devolvía 401 SIEMPRE: importaba `getUser` de '@/lib/auth', que es
// un módulo 'use client' que lee localStorage — en el servidor
// `typeof window === 'undefined'` y devuelve null sin excepción. Consecuencia:
// la biblioteca de documentos nunca funcionó (client_documentation con 0 filas
// el 2026-08-05). Además resolvía el cliente con
// `mira_users.primary_client_id`, columna que no existe en el esquema real
// (42703), así que de haber pasado el auth habría subido todo a un
// `clients/default/` compartido, sin aislamiento entre clientes.
//
// Ahora usa resolveRequestClient, el mismo patrón que el resto de rutas
// (/api/documents, /api/assets, /api/brand-brain/...): valida sesión real
// server-side y honra ?clientId= comprobando el grant del usuario.

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // El bucket 'agent-documents' es privado y ya existe (creado en la ronda de
    // 0056_brand_assets_private). No se llama a initializeStorageBucket() en
    // cada subida: listBuckets()+createBucket() por petición es un viaje extra
    // a la API de Storage para algo que solo puede pasar una vez en la vida
    // del proyecto, y falla en silencio si la service key no tiene permiso.
    const result = await uploadFileToStorage(access.clientId, 'documents', file)

    if (!result.success || !result.url) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      fileUrl: result.url,
      clientId: access.clientId,
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 }
    )
  }
}
