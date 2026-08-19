// Cuota de imágenes — la parte de servidor: cuenta, decide y corta.
//
// CONTEO: todas las imágenes del producto (Estudio, portadas de decks, quick
// actions visuales, chat de agente) pasan por generateAndStoreImage(), que
// registra en mira_usage_log con model='gpt-image-1'. Contar esas filas del mes
// es el número real de imágenes generadas, venga de donde venga — por eso no
// hace falta tabla nueva ni contador propio que mantener en sincronía.
//
// TOPE: lo incluido por el plan de la MARCA (clients.plan → lib/billing/plans.ts)
// más los packs de 100 comprados ese mismo mes (tabla image_packs, 0073).

import { createServiceClient } from '@/lib/supabase-admin'
import { billingPlan } from '@/lib/billing/plans'
import { isGenerationCapExempt } from '@/lib/anthropic-client'
import { startOfMonthUtc } from '@/lib/generation-cap-server'
import { IMAGE_QUOTA_ERROR_CODE, type ImageQuotaStatus } from '@/lib/image-quota'
import { NextResponse } from 'next/server'

/** El modelo con el que se generan TODAS las imágenes (ver lib/generation/openai-image.ts). */
const IMAGE_MODEL = 'gpt-image-1'

export class ImageQuotaExceededError extends Error {
  constructor(public readonly limit: number) {
    super(`Monthly image quota reached (${limit})`)
    this.name = 'ImageQuotaExceededError'
  }
}

/** Imágenes generadas por esta marca en el mes en curso. */
export async function countImagesThisMonth(clientId: string): Promise<number> {
  const db = createServiceClient()
  const { count, error } = await db
    .from('mira_usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('model', IMAGE_MODEL)
    .gte('created_at', startOfMonthUtc().toISOString())
  if (error) throw new Error(`image usage count failed: ${error.message}`)
  return count ?? 0
}

/** Imágenes compradas en packs este mes. Los packs no se acumulan de un mes al siguiente. */
export async function countPackImagesThisMonth(clientId: string): Promise<number> {
  const db = createServiceClient()
  const { data, error } = await db
    .from('image_packs')
    .select('images')
    .eq('client_id', clientId)
    .gte('created_at', startOfMonthUtc().toISOString())
  if (error) throw new Error(`image packs read failed: ${error.message}`)
  return (data ?? []).reduce((sum: number, r: { images: number }) => sum + (r.images ?? 0), 0)
}

export async function getImageQuotaStatus(clientId: string): Promise<ImageQuotaStatus> {
  const month = startOfMonthUtc().toISOString().slice(0, 7)
  const db = createServiceClient()
  const { data: client } = await db.from('clients').select('plan').eq('id', clientId).maybeSingle()
  const planImages = billingPlan(client?.plan).images

  if (isGenerationCapExempt(clientId)) {
    return { enabled: false, limit: null, used: 0, remaining: null, planImages, packImages: 0, month }
  }

  const [used, packImages] = await Promise.all([
    countImagesThisMonth(clientId),
    countPackImagesThisMonth(clientId),
  ])
  const limit = planImages + packImages
  return { enabled: true, limit, used, remaining: Math.max(0, limit - used), planImages, packImages, month }
}

/**
 * ¿Puede esta marca generar una imagen más?
 *
 * Falla ABIERTO si la telemetría no se puede leer: un fallo nuestro de lectura
 * no debe impedir que un cliente que ha pagado genere. Mismo criterio que
 * checkGenerationCap() en lib/anthropic-client.ts.
 */
export async function hasImageQuota(clientId: string): Promise<boolean> {
  try {
    const status = await getImageQuotaStatus(clientId)
    if (!status.enabled || status.limit == null) return true
    return status.used < status.limit
  } catch (e) {
    console.error('[image-quota] no se pudo comprobar el cupo, dejo pasar:', e)
    return true
  }
}

/** Para el catch de las rutas que generan imágenes: 429 con código estable. */
export function imageQuotaErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof ImageQuotaExceededError)) return null
  return NextResponse.json(
    { error: err.message, code: IMAGE_QUOTA_ERROR_CODE, limit: err.limit },
    { status: 429 },
  )
}
