// Materialización de posts en la Cola de Aprobación — extraído del route del
// content-engine (F4) para que el Monthly Content System lo reutilice: el deck
// mensual embebe las captions y el botón "Enviar a la Cola" las materializa
// aquí. Single source of truth: el copy que revisa el cliente se compone
// igual venga del engine o del monthly. El engine sigue funcionando como
// motor interno con este mismo módulo.

import type { adminClient } from '@/lib/supabase'

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
export function composeCopy(pillarName: string, post: GeneratedPost): string {
  const parts: string[] = [`[Pilar: ${pillarName}]`]
  if (post.hook && !post.copy.startsWith(post.hook)) parts.push(post.hook)
  parts.push(post.copy)
  if (post.cta) parts.push(`CTA: ${post.cta}`)
  if (post.visual_direction) parts.push(`🎨 Dirección visual: ${post.visual_direction}`)
  if (post.reel_script?.scenes?.length) parts.push(formatReelScript(post.reel_script))
  return parts.filter(Boolean).join('\n\n')
}

export interface MaterializeItem {
  pillarName: string
  pillarId?: string | null
  post: GeneratedPost
  scheduledTime?: string | null // ISO — el monthly lo deriva de suggested_day
}

/**
 * Inserta posts en approval_queue (status pending_review) + post_history como
 * draft (best-effort). Devuelve cuántos entraron.
 */
export async function materializePosts(
  db: Admin,
  clientId: string,
  items: MaterializeItem[]
): Promise<{ inserted: number }> {
  if (!items.length) return { inserted: 0 }
  const now = new Date().toISOString()

  const queueRows = items.map(({ pillarName, post, scheduledTime }) => {
    const platform = post.platform.toLowerCase() as Platform
    return {
      client_id: clientId,
      platform: PLATFORM_LABEL[platform] ?? post.platform,
      tipo: 'content',
      copy: composeCopy(pillarName, post),
      caption: (post.caption || post.copy).slice(0, 300),
      hashtags: asStringArray(post.hashtags),
      status: 'pending_review',
      submitted_at: now,
      tone_warning: false,
      ...(scheduledTime ? { scheduled_time: scheduledTime } : {}),
    }
  })

  const { error: queueError } = await db.from('approval_queue').insert(queueRows)
  if (queueError) throw new Error(`approval_queue: ${queueError.message}`)

  // post_history como draft (tiene columna pillar_id) — no crítico
  try {
    await db.from('post_history').insert(
      items.map(({ pillarName, pillarId, post }) => {
        const platform = post.platform.toLowerCase() as Platform
        return {
          client_id: clientId,
          ...(pillarId ? { pillar_id: pillarId } : {}),
          platform: PLATFORM_LABEL[platform] ?? post.platform,
          content: composeCopy(pillarName, post),
          status: 'draft',
          performance: {},
        }
      })
    )
  } catch {
    /* non-critical */
  }

  return { inserted: queueRows.length }
}
