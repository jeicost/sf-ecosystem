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
