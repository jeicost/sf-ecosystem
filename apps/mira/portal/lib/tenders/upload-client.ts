'use client'
import { createClient } from '@/lib/supabase'

// La mitad de navegador de la subida: pide la URL firmada y sube el fichero
// directo al almacenamiento. Devuelve la ruta, que es lo único que viaja luego
// a la API. Un PDF de 40 MB ya no toca Vercel.

export const MAX_UPLOAD_MB = 50

export async function uploadTenderFile(clientId: string, file: File): Promise<{ path: string } | { error: string }> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return { error: `“${file.name}” pesa ${(file.size / 1024 / 1024).toFixed(0)} MB y el máximo son ${MAX_UPLOAD_MB} MB.` }
  }
  const res = await fetch('/api/tender/upload-url', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, filename: file.name, size: file.size }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { error: data.error || 'No se pudo preparar la subida' }

  const { error } = await createClient().storage.from(data.bucket).uploadToSignedUrl(data.path, data.token, file, {
    contentType: file.type || 'application/octet-stream',
  })
  if (error) return { error: `No se ha podido subir “${file.name}”: ${error.message}` }
  return { path: data.path as string }
}
