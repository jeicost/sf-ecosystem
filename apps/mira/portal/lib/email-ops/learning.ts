// Bucle de aprendizaje: reglas por cliente + ejemplos few-shot + correcciones.
//
// Los ejemplos entran en el prefijo CACHEADO del prompt, así que el orden tiene
// que ser determinista (mismo cliente → mismos bytes) o la caché nunca acierta.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { FieldValue } from './schema'

export const MAX_RULES_CHARS = 4000
export const MAX_EXAMPLES = 6
export const EXAMPLE_CHAR_BUDGET = 12000
export const EXAMPLE_MAX_CHARS = 1500

export interface TrainingExample {
  id: string
  source: 'upload' | 'correction' | 'seed'
  email_text: string
  attachments_text: string | null
  expected_kind: string
  expected_fields: Record<string, unknown>
  notes: string | null
  created_at: string
}

export interface ClientSettingsRow {
  client_id: string
  schema_key: string
  rules: string | null
  required_fields: string[] | null
}

export async function getClientSettings(db: SupabaseClient, clientId: string): Promise<ClientSettingsRow | null> {
  const { data, error } = await db
    .from('email_ops_settings')
    .select('client_id,schema_key,rules,required_fields')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return (data as ClientSettingsRow) || null
}

/**
 * Ejemplos para el prompt: primero los subidos/sembrados por el cliente (son el
 * "entrenamiento" oficial), después las correcciones más recientes. Se ordenan
 * por created_at ASC dentro de cada grupo para que el prefijo sea estable aunque
 * lleguen ejemplos nuevos por el final.
 */
export async function getFewShotExamples(
  db: SupabaseClient,
  clientId: string,
  opts: { max?: number; charBudget?: number } = {}
): Promise<TrainingExample[]> {
  const max = opts.max ?? MAX_EXAMPLES
  const budget = opts.charBudget ?? EXAMPLE_CHAR_BUDGET
  const { data, error } = await db
    .from('email_training_examples')
    .select('id,source,email_text,attachments_text,expected_kind,expected_fields,notes,created_at')
    .eq('client_id', clientId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error
  const rows = (data || []) as TrainingExample[]
  const primary = rows.filter((r) => r.source !== 'correction').sort((a, b) => a.created_at.localeCompare(b.created_at))
  const corrections = rows.filter((r) => r.source === 'correction').sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3)
  const picked: TrainingExample[] = []
  let used = 0
  for (const ex of [...primary, ...corrections]) {
    if (picked.length >= max) break
    const size = Math.min(ex.email_text.length, EXAMPLE_MAX_CHARS) + JSON.stringify(ex.expected_fields).length
    if (used + size > budget) continue
    picked.push(ex)
    used += size
  }
  return picked
}

/** Los ejemplos como texto para el system prompt (formato estable). */
export function formatExamplesForPrompt(examples: TrainingExample[]): string {
  if (examples.length === 0) return ''
  const parts = examples.map((ex, i) => {
    const body = ex.email_text.length > EXAMPLE_MAX_CHARS ? ex.email_text.slice(0, EXAMPLE_MAX_CHARS) + '…' : ex.email_text
    const expected = { kind: ex.expected_kind, fields: ex.expected_fields }
    return `<example n="${i + 1}"${ex.notes ? ` note="${ex.notes.replace(/"/g, "'").slice(0, 200)}"` : ''}>\n<email>\n${body}\n</email>\n<expected>\n${JSON.stringify(expected)}\n</expected>\n</example>`
  })
  return parts.join('\n')
}

/** Guarda una fila por campo corregido (diff), con un extracto del correo. */
export async function recordCorrections(
  db: SupabaseClient,
  params: {
    clientId: string
    ticketId: string
    userId: string | null
    changed: { field: string; before: FieldValue; after: FieldValue }[]
    emailExcerpt: string | null
  }
): Promise<void> {
  if (params.changed.length === 0) return
  const rows = params.changed.map((c) => ({
    client_id: params.clientId,
    ticket_id: params.ticketId,
    field: c.field,
    before: c.before,
    after: c.after,
    email_excerpt: params.emailExcerpt ? params.emailExcerpt.slice(0, 1500) : null,
    created_by: params.userId,
  }))
  const { error } = await db.from('email_corrections').insert(rows)
  if (error) throw error
}

/**
 * Al cerrar un ticket que tuvo correcciones, sus valores finales pasan a ser un
 * ejemplo (source='correction'). Idempotente: si ya existe un ejemplo con la
 * misma nota "ticket:<id>", no duplica.
 */
export async function promoteTicketToExample(
  db: SupabaseClient,
  params: {
    clientId: string
    ticketId: string
    emailText: string
    attachmentsText: string | null
    kind: string
    fields: Record<string, unknown>
    userId: string | null
  }
): Promise<boolean> {
  const { count } = await db
    .from('email_corrections')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_id', params.ticketId)
  if (!count) return false
  const marker = `ticket:${params.ticketId}`
  const { data: existing } = await db
    .from('email_training_examples')
    .select('id')
    .eq('client_id', params.clientId)
    .eq('notes', marker)
    .limit(1)
  if (existing && existing.length > 0) return false
  const { error } = await db.from('email_training_examples').insert({
    client_id: params.clientId,
    source: 'correction',
    email_text: params.emailText.slice(0, 4000),
    attachments_text: params.attachmentsText ? params.attachmentsText.slice(0, 2000) : null,
    expected_kind: params.kind,
    expected_fields: params.fields,
    notes: marker,
    created_by: params.userId,
  })
  if (error) throw error
  return true
}
