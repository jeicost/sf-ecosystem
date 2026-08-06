// OpenAI image generation for visual quick actions.
// Generates an image from a prompt and stores it in the generated-assets bucket.

import { createServiceClient } from '@/lib/supabase-admin'
import { getClientApiKey } from '@/lib/integrations/getClientApiKey'
import { logUsage } from '@/lib/anthropic-client'

const VISUAL_BUCKET = 'generated-assets'
const SIGNED_URL_EXPIRATION = 3600 * 24 * 7 // 7 days

export interface StoredImage {
  /** Storage path inside the generated-assets bucket (embeds the clientId). */
  path: string
  /** Signed URL (7 days) — kept for backwards compatibility with image_url. */
  signedUrl: string
}

export async function generateAndStoreImage(
  prompt: string,
  clientId: string,
  actionId: string
): Promise<StoredImage | null> {
  // Key del cliente (Integraciones → OpenAI) con fallback a la key de plataforma
  const apiKey = await getClientApiKey(clientId, 'openai', process.env.OPENAI_API_KEY)
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt.slice(0, 4000),
        size: '1024x1024',
        n: 1,
        // PNG sin comprimir daba ~1,6 MB por imagen (medido en Storage:
        // 1.658.096 y 1.583.909 bytes). El .pptx las embebe en base64, así que
        // un deck con las 3 imágenes que permite attachDeckImages pesaba
        // 5,07 MB y superaba el límite de 4,5 MB de respuesta de una función
        // serverless de Vercel -> FUNCTION_PAYLOAD_TOO_LARGE al descargar.
        // JPEG al 85% baja cada imagen a ~85 KB (medido con una generación real
        // el 2026-08-06: 84.747 bytes, 19× menos) sin diferencia visible en
        // fotografía/ilustración editorial, que es todo lo que generamos aquí.
        // Con 3 imágenes el .pptx pasa de ~5,07 MB a ~0,5 MB.
        output_format: 'jpeg',
        output_compression: 85,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[openai-image] Generation failed:', res.status, err.slice(0, 300))
      return null
    }

    const json = await res.json()

    // Registrar consumo (nunca rompe la generación, ver logUsage)
    await logUsage({
      clientId,
      route: 'quick-actions:image',
      model: 'gpt-image-1',
      usage: {
        input_tokens: json?.usage?.input_tokens ?? 0,
        output_tokens: json?.usage?.output_tokens ?? 0,
      },
      usedClientKey: apiKey !== process.env.OPENAI_API_KEY,
    })

    const b64 = json?.data?.[0]?.b64_json
    if (!b64) {
      console.error('[openai-image] No b64_json in response')
      return null
    }

    const buffer = Buffer.from(b64, 'base64')
    const db = createServiceClient()

    // Ensure bucket exists (no-op if already created)
    const { data: buckets } = await db.storage.listBuckets()
    if (!buckets?.some((b) => b.name === VISUAL_BUCKET)) {
      await db.storage.createBucket(VISUAL_BUCKET, { public: false, fileSizeLimit: 52428800 })
    }

    const storagePath = `clients/${clientId}/quick-actions/${actionId}/${Date.now()}.jpg`
    const { error: uploadError } = await db.storage
      .from(VISUAL_BUCKET)
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      console.error('[openai-image] Upload failed:', uploadError.message)
      return null
    }

    const { data: signed } = await db.storage
      .from(VISUAL_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION)

    if (!signed?.signedUrl) return null
    return { path: storagePath, signedUrl: signed.signedUrl }
  } catch (error) {
    console.error('[openai-image] Error:', error)
    return null
  }
}
