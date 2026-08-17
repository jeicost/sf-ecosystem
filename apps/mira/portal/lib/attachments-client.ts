import type { Attachment } from '@/lib/attachments'

// Lado cliente del pipeline de adjuntos: sube ficheros al bucket brand-assets
// y devuelve los metadatos que las rutas server consumen vía buildAttachmentBlocks.
// Extraído del chat de onboarding para que quick actions lo reutilice.

// DOCX/PPTX también son 'text': el servidor decide el extractor por mimeType
// (lib/attachments.ts, officeKindOf). Ese módulo arrastra el lector de PDF y
// no debe entrar en el bundle del navegador, de ahí que aquí no se importe.
export function attachmentTypeFromFile(file: File): Attachment['type'] {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'text'
}

export async function uploadFilesToBucket(
  clientId: string,
  files: File[],
  prefix = 'assets'
): Promise<Attachment[]> {
  // La subida va por API route (server-side, admin client): el bucket
  // brand-assets no permite INSERT desde el navegador — la subida directa
  // fallaba con RLS para TODOS los usuarios (2026-07-28).
  const form = new FormData()
  form.append('clientId', clientId)
  form.append('prefix', prefix)
  for (const file of files) form.append('files', file)

  const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.attachments) {
    throw new Error(data?.error || `Failed to upload files (${res.status})`)
  }
  return data.attachments as Attachment[]
}
