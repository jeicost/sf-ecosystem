// OpenAI image generation for visual quick actions.
// Generates an image from a prompt and stores it in the generated-assets bucket.

import { createServiceClient } from '@/lib/supabase-admin'
import { getClientApiKey } from '@/lib/integrations/getClientApiKey'

const VISUAL_BUCKET = 'generated-assets'
const SIGNED_URL_EXPIRATION = 3600 * 24 * 7 // 7 days

export async function generateAndStoreImage(
  prompt: string,
  clientId: string,
  actionId: string
): Promise<string | null> {
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
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[openai-image] Generation failed:', res.status, err.slice(0, 300))
      return null
    }

    const json = await res.json()
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

    const storagePath = `clients/${clientId}/quick-actions/${actionId}/${Date.now()}.png`
    const { error: uploadError } = await db.storage
      .from(VISUAL_BUCKET)
      .upload(storagePath, buffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('[openai-image] Upload failed:', uploadError.message)
      return null
    }

    const { data: signed } = await db.storage
      .from(VISUAL_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION)

    return signed?.signedUrl ?? null
  } catch (error) {
    console.error('[openai-image] Error:', error)
    return null
  }
}
