import { createClient } from '@/lib/supabase'
import type { Attachment } from '@/lib/attachments'

// Lado cliente del pipeline de adjuntos: sube ficheros al bucket brand-assets
// y devuelve los metadatos que las rutas server consumen vía buildAttachmentBlocks.
// Extraído del chat de onboarding para que quick actions lo reutilice.

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
  const supabase = createClient()
  const uploaded: Attachment[] = []
  for (const file of files) {
    const path = `${clientId}/${prefix}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('brand-assets').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('brand-assets').getPublicUrl(path)
    uploaded.push({
      type: attachmentTypeFromFile(file),
      name: file.name,
      url: data.publicUrl,
      mimeType: file.type,
    })
  }
  return uploaded
}
