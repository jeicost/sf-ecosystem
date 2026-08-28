// Bucle de feedback del "diseñador de documentos" — helper ÚNICO (P3, 2026-07-29).
// Las últimas notas negativas del cliente sobre un tipo de salida (informe,
// documento, quick action o monthly) se reinyectan en la SIGUIENTE generación
// de ese mismo tipo. Sustituye al par duplicado getDocumentFeedbackBlock /
// getRefineFeedbackBlock. Tolerante a tabla ausente (pre-0050) y a columnas
// nuevas ausentes (pre-0053).

import { adminClient } from '@/lib/supabase'

/**
 * Bloque de prompt con el feedback negativo previo para esta clave de salida.
 * `toolKey` es tool_slug para informes/documentos, action_type para quick
 * actions (misma columna tool_slug en la tabla).
 */
export async function getFeedbackBlock(clientId: string, toolKey: string): Promise<string> {
  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('document_feedback')
      .select('note, created_at')
      .eq('client_id', clientId)
      .eq('tool_slug', toolKey)
      .eq('outcome', 'not_helpful')
      .not('note', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)
    if (error || !data?.length) return ''
    const notes = data.map((f) => `- ${f.note}`).join('\n')
    return `\n\nCLIENT FEEDBACK ON PREVIOUS ${toolKey} OUTPUTS (address these — do NOT repeat them):\n${notes}`
  } catch {
    return ''
  }
}

/**
 * Bucle de mejora que NO depende de que nadie haga clic.
 *
 * `getFeedbackBlock` lleva desde su creación reinyectando el feedback del
 * cliente. Medido el 28-ago-2026: `document_feedback` tenía 0 filas tras 93
 * informes, así que ese bucle no ha girado NUNCA. La UI existe y funciona; lo
 * que no existe es la costumbre de puntuar, y construir la calidad del producto
 * sobre un clic voluntario es construirla sobre nada.
 *
 * El crítico del pipeline (lib/generation/report-pipeline.ts) sí deja constancia
 * en CADA informe: `_pipeline.findings`. Eso es feedback real, generado sin
 * intervención humana. Aquí se recogen las debilidades RECURRENTES de este
 * cliente en esta herramienta para que la siguiente generación las evite de
 * entrada, en vez de esperar a que el crítico vuelva a cazarlas.
 */
export async function getSelfCritiqueBlock(clientId: string, toolKey: string): Promise<string> {
  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('generation_queue')
      .select('result_data')
      .eq('client_id', clientId)
      .eq('tool_slug', toolKey)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)
    if (error || !data?.length) return ''

    // kind → dónde apareció. Solo interesa lo que se REPITE: un hallazgo suelto
    // es ruido de una generación concreta, uno que sale tres veces es un sesgo.
    const tally = new Map<string, { count: number; where: Set<string> }>()
    for (const row of data) {
      const findings = (row.result_data as any)?._pipeline?.findings
      if (!Array.isArray(findings)) continue
      for (const f of findings) {
        if (!f?.kind) continue
        const entry = tally.get(f.kind) || { count: 0, where: new Set<string>() }
        entry.count++
        if (f.where) entry.where.add(String(f.where))
        tally.set(f.kind, entry)
      }
    }

    const recurring = [...tally.entries()]
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
    if (!recurring.length) return ''

    const lines = recurring
      .map(([kind, v]) => `- ${kind} (${v.count}x) — e.g. ${[...v.where].slice(0, 2).join('; ')}`)
      .join('\n')
    return `\n\nRECURRING WEAKNESSES IN YOUR OWN PREVIOUS ${toolKey} OUTPUTS FOR THIS CLIENT (an independent reviewer flagged these repeatedly — do not repeat them):\n${lines}`
  } catch {
    return ''
  }
}

export interface SaveFeedbackInput {
  clientId: string
  outcome: 'helpful' | 'not_helpful'
  toolKey: string
  queueId?: string | null
  actionId?: string | null
  context?: 'toolkit' | 'document' | 'quick_action' | 'monthly'
  note?: string | null
  createdBy?: string | null
}

/** Inserta feedback; si las columnas 0053 no existen aún, reintenta sin ellas. */
export async function saveFeedback(input: SaveFeedbackInput): Promise<{ ok: boolean; error?: string }> {
  const admin = adminClient()
  const base = {
    client_id: input.clientId,
    queue_id: input.queueId ?? null,
    tool_slug: input.toolKey,
    outcome: input.outcome,
    note: input.note ?? null,
    created_by: input.createdBy ?? null,
  }
  const full = {
    ...base,
    ...(input.actionId ? { action_id: input.actionId } : {}),
    ...(input.context ? { context: input.context } : {}),
  }
  let { error } = await admin.from('document_feedback').insert(full)
  if (error && /action_id|context/.test(error.message)) {
    ;({ error } = await admin.from('document_feedback').insert(base))
  }
  return error ? { ok: false, error: error.message } : { ok: true }
}
