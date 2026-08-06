import { getClientApiKey } from '@/lib/integrations/getClientApiKey'
import { createServiceClient } from '@/lib/supabase-admin'

/**
 * ─── MAGNIFIC / FREEPIK — MEJORA Y ESCALADO DE IMÁGENES ──────────────────
 *
 * La pieza que faltaba entre "Claude ve la imagen" y "OpenAI pinta una nueva":
 * un motor que trabaja sobre el PÍXEL ORIGINAL en vez de regenerar desde cero.
 *
 * Contexto (2026-08-06): MIRA solo sabía generar texto→imagen con gpt-image-1.
 * La quick action `editar_imagen_visual` prometía "preservar logo/texto/layout"
 * pero no hacía nada de eso: Claude miraba la imagen, escribía un
 * `refinement_prompt`, y se generaba una imagen COMPLETAMENTE NUEVA con ese
 * texto — la original nunca salía de MIRA. De ahí que el resultado se
 * pareciera al producto del cliente sin llegar a serlo.
 *
 * ⚠️ Sobre el proveedor: Magnific fue adquirida por Freepik y **no tiene API
 * pública propia**. Verificado el 2026-08-06:
 *   · https://api.magnific.ai/v1/account        → 404 (no existe)
 *   · https://api.freepik.com/v1/ai/image-upscaler → 401 (existe, pide key)
 * El validador que había en lib/integrations/api-validators.ts apuntaba al
 * primero, así que habría dicho "Invalid API key" para cualquier clave. La
 * integración 'magnific' usa por tanto la API de Freepik y su misma key.
 *
 * La API es ASÍNCRONA: se envía la imagen, devuelve un task_id, y hay que
 * consultar el estado hasta que termina.
 */

const FREEPIK_API = 'https://api.freepik.com/v1'
const UPSCALER_PATH = '/ai/image-upscaler'
const VISUAL_BUCKET = 'generated-assets'
const SIGNED_URL_EXPIRATION = 3600 * 24 * 7

/** Tope de espera. El escalado tarda entre 10 s y ~2 min según tamaño. */
const MAX_POLL_MS = 150_000
const POLL_INTERVAL_MS = 3_000

export interface UpscaleOptions {
  /** 'precise' conserva al máximo el original; 'creative' reinterpreta más. */
  mode?: 'precise' | 'creative'
  /** 1-10. Cuánta libertad tiene el modelo para inventar detalle. */
  creativity?: number
  /** 1-10. Nitidez y microdetalle. */
  hdr?: number
  /** Multiplicador de resolución. */
  scaleFactor?: '2x' | '4x'
  /** Guía opcional de qué es la imagen — mejora bastante el resultado. */
  prompt?: string
}

export interface UpscaledImage {
  path: string
  signedUrl: string
}

/**
 * Escala y mejora una imagen existente, y la guarda en `generated-assets`.
 *
 * Devuelve null (nunca lanza) si el cliente no tiene key de Freepik o si el
 * proveedor falla: el flujo que la invoca debe poder seguir con la imagen
 * original, igual que hoy un fallo de imagen no tumba una quick action.
 */
export async function upscaleAndStoreImage(
  imageBuffer: Buffer,
  clientId: string,
  actionId: string,
  options: UpscaleOptions = {}
): Promise<UpscaledImage | null> {
  // La integración se llama 'magnific' en el marketplace (es el nombre que
  // conoce el usuario), pero se acepta también 'freepik' porque es la misma
  // key y algunos clientes la habrán conectado por ahí.
  const apiKey =
    (await getClientApiKey(clientId, 'magnific', process.env.FREEPIK_API_KEY)) ||
    (await getClientApiKey(clientId, 'freepik', process.env.FREEPIK_API_KEY))
  if (!apiKey) return null

  try {
    const taskId = await startUpscale(apiKey, imageBuffer, options)
    if (!taskId) return null

    const resultUrl = await waitForResult(apiKey, taskId)
    if (!resultUrl) return null

    const res = await fetch(resultUrl)
    if (!res.ok) {
      console.error('[magnific] Could not download the upscaled image:', res.status)
      return null
    }
    const outputBuffer = Buffer.from(await res.arrayBuffer())

    const db = createServiceClient()
    const storagePath = `clients/${clientId}/upscaled/${actionId}/${Date.now()}.jpg`
    const { error: uploadError } = await db.storage
      .from(VISUAL_BUCKET)
      .upload(storagePath, outputBuffer, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) {
      console.error('[magnific] Upload failed:', uploadError.message)
      return null
    }

    const { data: signed } = await db.storage
      .from(VISUAL_BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRATION)
    if (!signed?.signedUrl) return null

    return { path: storagePath, signedUrl: signed.signedUrl }
  } catch (error) {
    console.error('[magnific] Upscale failed:', error)
    return null
  }
}

async function startUpscale(
  apiKey: string,
  imageBuffer: Buffer,
  options: UpscaleOptions
): Promise<string | null> {
  const res = await fetch(`${FREEPIK_API}${UPSCALER_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-freepik-api-key': apiKey },
    body: JSON.stringify({
      image: imageBuffer.toString('base64'),
      // Por defecto 'precise': el objetivo aquí es conservar el producto del
      // cliente, no reinterpretarlo. Para eso ya está gpt-image-1.
      sharpen: options.hdr ?? 3,
      creativity: options.creativity ?? (options.mode === 'creative' ? 6 : 1),
      hdr: options.hdr ?? 3,
      scale_factor: options.scaleFactor ?? '2x',
      ...(options.prompt ? { prompt: options.prompt.slice(0, 1000) } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[magnific] Upscale request rejected:', res.status, body.slice(0, 300))
    return null
  }

  const json = await res.json().catch(() => null)
  return json?.data?.task_id || json?.task_id || null
}

/** Consulta el estado hasta que la tarea termina, falla o se agota el tiempo. */
async function waitForResult(apiKey: string, taskId: string): Promise<string | null> {
  const deadline = Date.now() + MAX_POLL_MS

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

    const res = await fetch(`${FREEPIK_API}${UPSCALER_PATH}/${taskId}`, {
      headers: { 'x-freepik-api-key': apiKey },
    })
    if (!res.ok) {
      console.error('[magnific] Status check failed:', res.status)
      return null
    }

    const json = await res.json().catch(() => null)
    const status = json?.data?.status || json?.status
    if (status === 'COMPLETED' || status === 'completed') {
      const generated = json?.data?.generated || json?.generated
      return Array.isArray(generated) ? generated[0] : generated || null
    }
    if (status === 'FAILED' || status === 'failed') {
      console.error('[magnific] Task failed:', JSON.stringify(json).slice(0, 300))
      return null
    }
  }

  console.error('[magnific] Timed out waiting for the upscale to finish')
  return null
}
