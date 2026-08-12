// Materialización de posts en la Cola de Aprobación — extraído del route del
// content-engine (F4) para que el Monthly Content System lo reutilice: el deck
// mensual embebe las captions y el botón "Enviar a la Cola" las materializa
// aquí. Single source of truth: el copy que revisa el cliente se compone
// igual venga del engine o del monthly. El engine sigue funcionando como
// motor interno con este mismo módulo.

import type { adminClient } from '@/lib/supabase'
import { validatePiece, type QaFlag } from '@/lib/content-engine/qa-validator'

type Admin = ReturnType<typeof adminClient>

export const VALID_PLATFORMS = ['instagram', 'linkedin', 'tiktok', 'facebook'] as const
export type Platform = (typeof VALID_PLATFORMS)[number]

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  facebook: 'Facebook',
}

export interface ReelScene {
  time: string
  action: string
  text_overlay?: string
}

export interface GeneratedPost {
  platform: string
  hook: string
  copy: string
  caption: string
  hashtags?: string[]
  cta?: string
  visual_direction?: string
  reel_script?: { duration?: string; scenes?: ReelScene[] }
}

export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export function formatReelScript(script: NonNullable<GeneratedPost['reel_script']>): string {
  const lines: string[] = [`🎬 Guión de Reel${script.duration ? ` (${script.duration})` : ''}:`]
  for (const scene of script.scenes ?? []) {
    const overlay = scene.text_overlay ? ` · Texto: "${scene.text_overlay}"` : ''
    lines.push(`${scene.time} — ${scene.action}${overlay}`)
  }
  return lines.join('\n')
}

/** Copy completo revisable en approval_queue (sin columna de metadata → el pilar va en el copy). */
/**
 * SOLO el texto publicable: lo que el cliente puede copiar y pegar tal cual.
 *
 * Antes esta función metía aquí dentro el pilar y la dirección visual, así que
 * quien copiaba la pieza para publicarla se llevaba las instrucciones del
 * diseñador a Instagram. Eso ahora vive en composeProductionNotes().
 */
export function composeCopy(_pillarName: string, post: GeneratedPost): string {
  const parts: string[] = []
  if (post.hook && !post.copy.startsWith(post.hook)) parts.push(post.hook)
  parts.push(post.copy)
  if (post.cta) parts.push(post.cta)
  return parts.filter(Boolean).join('\n\n')
}

/** Lo que necesita quien PRODUCE la pieza, separado de lo que se publica. */
export function composeProductionNotes(pillarName: string, post: GeneratedPost): string | null {
  const parts: string[] = [`Pilar: ${pillarName}`]
  if (post.visual_direction) parts.push(`Dirección visual: ${post.visual_direction}`)
  if (post.reel_script?.scenes?.length) parts.push(formatReelScript(post.reel_script))
  return parts.length > 1 ? parts.join('\n\n') : parts[0]
}

export interface MaterializeItem {
  pillarName: string
  pillarId?: string | null
  post: GeneratedPost
  scheduledTime?: string | null // ISO — el monthly lo deriva de suggested_day
  assetUrl?: string | null // P4: cover generada — /approvals la muestra
}

/**
 * Etiquetas de la pieza para el loop de aprendizaje (raíl, fase 0). Se guardan
 * en post_history.performance.tags — sin migración, la columna jsonb ya existe.
 * A las 48-72h el recap asociará las métricas a estas etiquetas.
 */
function pieceTags(pillarName: string, post: GeneratedPost, platformLabel: string) {
  return {
    pillar: pillarName,
    hook: post.hook ? post.hook.slice(0, 120) : null,
    format: post.reel_script?.scenes?.length ? 'reel' : 'post',
    platform: platformLabel,
  }
}

/**
 * Inserta posts en el raíl. Orden INVERTIDO respecto al original: primero
 * post_history (para capturar sus ids y ETIQUETAR la pieza), luego
 * approval_queue con post_id ENLAZADO a su fila de historial. Ese enlace es lo
 * que permite que aprobar/publicar propague el estado (ver /api/approvals/decide)
 * y que el loop de aprendizaje asocie métricas a etiquetas. Devuelve cuántos
 * entraron.
 */
export async function materializePosts(
  db: Admin,
  clientId: string,
  items: MaterializeItem[]
): Promise<{ inserted: number }> {
  if (!items.length) return { inserted: 0 }
  const now = new Date().toISOString()

  // Las reglas del propio cliente (qa_rules, banned_phrases, política de
  // idiomas) se comprueban ANTES de que la pieza llegue a su bandeja: estaban
  // escritas en el Cerebro y no las verificaba nadie.
  let brandData: Record<string, unknown> | null = null
  try {
    const { data } = await db.from('brand_profiles').select('brand_data').eq('client_id', clientId).maybeSingle()
    brandData = (data?.brand_data as Record<string, unknown>) ?? null
  } catch {
    /* sin Cerebro, se materializa igual pero sin validar */
  }
  const flagsByItem: QaFlag[][] = items.map(({ post }) =>
    validatePiece(brandData, { copy: post.copy, caption: post.caption, hook: post.hook, hashtags: post.hashtags, cta: post.cta })
  )

  // 1) post_history PRIMERO — con .select('id') para enlazar y etiquetado en
  //    performance.tags. Postgres devuelve las filas en orden de inserción, así
  //    que el índice i corresponde 1:1 con items[i]. Si el insert o el conteo
  //    fallan, postIds queda a null y el raíl sigue funcionando sin enlace.
  let postIds: (string | null)[] = items.map(() => null)
  const historyRows = items.map(({ pillarName, pillarId, post }) => {
    const platform = post.platform.toLowerCase() as Platform
    const label = PLATFORM_LABEL[platform] ?? post.platform
    return {
      client_id: clientId,
      ...(pillarId ? { pillar_id: pillarId } : {}),
      platform: label,
      content: composeCopy(pillarName, post),
      status: 'draft',
      performance: { tags: pieceTags(pillarName, post, label) },
    }
  })
  try {
    const { data } = await db.from('post_history').insert(historyRows).select('id')
    if (data && data.length === items.length) postIds = data.map((r: { id: string }) => r.id)
  } catch {
    /* sin enlace, el raíl sigue funcionando */
  }

  // 2) approval_queue con post_id enlazado a su fila de historial
  const queueRows = items.map(({ pillarName, post, scheduledTime, assetUrl }, i) => {
    const platform = post.platform.toLowerCase() as Platform
    return {
      client_id: clientId,
      ...(postIds[i] ? { post_id: postIds[i] } : {}),
      platform: PLATFORM_LABEL[platform] ?? post.platform,
      tipo: 'content',
      copy: composeCopy(pillarName, post),
      caption: (post.caption || post.copy).slice(0, 300),
      hashtags: asStringArray(post.hashtags),
      status: 'pending_review',
      submitted_at: now,
      production_notes: composeProductionNotes(pillarName, post),
      qa_flags: flagsByItem[i],
      // tone_warning ya existía y nadie lo encendía nunca: ahora lo enciende el
      // validador cuando la pieza rompe una regla escrita de la marca.
      tone_warning: flagsByItem[i].length > 0,
      ...(scheduledTime ? { scheduled_time: scheduledTime } : {}),
      ...(assetUrl ? { asset_url: assetUrl } : {}),
    }
  })

  const { error: queueError } = await db.from('approval_queue').insert(queueRows)
  if (queueError) throw new Error(`approval_queue: ${queueError.message}`)

  return { inserted: queueRows.length }
}
