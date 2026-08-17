// Prioridad de un ticket, 0..100. Función pura, la misma en el pipeline, en el
// PATCH y en el cron que recalcula los abiertos (la proximidad cambia con el reloj).
//
//   proximidad de la recogida  <4h 50 · <24h 40 · <72h 25 · más 10 · desconocida 15
//   tipo de entrega            internacional +15 · nacional +5
//   urgencia (1..5)            ×4
//   antigüedad abierto         hasta +10 (1 punto por cada 6h)
//   incompleto (faltan campos) +5

import type { SupabaseClient } from '@supabase/supabase-js'

export interface PriorityInput {
  fields: Record<string, unknown>
  urgency: number | null | undefined
  missing_fields: string[]
  first_message_at: string | null | undefined
  delivery_type?: string | null
}

function pickupAt(fields: Record<string, unknown>): Date | null {
  const date = typeof fields.fecha === 'string' ? fields.fecha : null
  if (!date) return null
  const time = typeof fields.recogida_hora_inicio === 'string' ? fields.recogida_hora_inicio : '08:00'
  const d = new Date(`${date}T${time}:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function computePriority(input: PriorityInput, now: Date = new Date()): number {
  let score = 0

  const pickup = pickupAt(input.fields)
  if (!pickup) score += 15
  else {
    const hours = (pickup.getTime() - now.getTime()) / 3600000
    if (hours < 4) score += 50
    else if (hours < 24) score += 40
    else if (hours < 72) score += 25
    else score += 10
  }

  const type = input.delivery_type ?? (typeof input.fields.tipo_entrega === 'string' ? input.fields.tipo_entrega : null)
  if (type === 'internacional') score += 15
  else if (type === 'nacional') score += 5

  const u = typeof input.urgency === 'number' ? Math.min(5, Math.max(1, input.urgency)) : 3
  score += u * 4

  if (input.first_message_at) {
    const openHours = (now.getTime() - new Date(input.first_message_at).getTime()) / 3600000
    if (openHours > 0) score += Math.min(10, Math.floor(openHours / 6))
  }

  if (input.missing_fields.length > 0) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}

/** Recalcula la prioridad de los tickets abiertos (la ventana de recogida se acerca sola). */
export async function recomputeOpenPriorities(db: SupabaseClient, opts: { limit?: number } = {}): Promise<number> {
  const { data, error } = await db
    .from('email_tickets')
    .select('id,fields,urgency,missing_fields,first_message_at,delivery_type,priority')
    .eq('status', 'open')
    .eq('kind', 'shipment_request')
    .order('updated_at', { ascending: true })
    .limit(opts.limit ?? 500)
  if (error) throw error
  let changed = 0
  const now = new Date()
  for (const t of data || []) {
    const p = computePriority(
      {
        fields: (t.fields as Record<string, unknown>) || {},
        urgency: t.urgency as number | null,
        missing_fields: (t.missing_fields as string[]) || [],
        first_message_at: t.first_message_at as string | null,
        delivery_type: t.delivery_type as string | null,
      },
      now
    )
    if (Number(t.priority) !== p) {
      const { error: upErr } = await db.from('email_tickets').update({ priority: p }).eq('id', t.id)
      if (!upErr) changed++
    }
  }
  return changed
}
