// Agrupación de mensajes en hilos (un hilo = un ticket).
//
// Orden de preferencia:
//   1. In-Reply-To / References apuntando a un Message-ID que ya tenemos.
//   2. Ticket ABIERTO del mismo buzón con el mismo asunto normalizado en los
//      últimos 14 días. Es el camino real: el reenvío por regla de Outlook
//      reescribe Message-ID y suele perder In-Reply-To.
//   3. Hilo nuevo con clave propia.
//
// La parte pura (normalizeSubject, isGenericSubject) es testeable sin BD.

import type { SupabaseClient } from '@supabase/supabase-js'

const PREFIX_RE = /^\s*((re|fw|fwd|rv|tr|enc|aw|wg|sv|vs|r|f)\s*(\[\d+\])?\s*:\s*)+/i

export function normalizeSubject(subject: string | null | undefined): string {
  let s = (subject || '').trim()
  // Quitar prefijos de respuesta/reenvío repetidos, en varios idiomas.
  let prev = ''
  while (prev !== s) {
    prev = s
    s = s.replace(PREFIX_RE, '')
  }
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[“”"'`]/g, '').trim()
}

/** Asuntos tan genéricos que no sirven para agrupar ("Pedido", "Envío"…). */
const GENERIC = new Set([
  '', 'solicitud', 'pedido', 'envio', 'envío', 'recogida', 'entrega', 'urgente', 'consulta',
  'hola', 'buenos dias', 'buenos días', 'buenas', 'sin asunto', 'no subject', 'presupuesto',
])

export function isGenericSubject(normalized: string): boolean {
  return normalized.length < 4 || GENERIC.has(normalized)
}

export function newThreadKey(messageId: string | null, resendEmailId: string): string {
  return `msg:${(messageId || resendEmailId).replace(/[<>\s]/g, '')}`
}

export interface ThreadResolveInput {
  clientId: string
  inboxId: string | null
  messageId: string | null
  inReplyTo: string | null
  references: string[]
  subject: string | null
  resendEmailId: string
  receivedAt: string
}

export const THREAD_WINDOW_DAYS = 14

export async function resolveThreadKey(db: SupabaseClient, input: ThreadResolveInput): Promise<string> {
  const refs = Array.from(
    new Set([input.inReplyTo, ...input.references].filter((r): r is string => !!r && r.trim().length > 0))
  ).map((r) => r.trim())

  if (refs.length > 0) {
    const { data } = await db
      .from('email_messages')
      .select('thread_key')
      .eq('client_id', input.clientId)
      .in('message_id', refs)
      .not('thread_key', 'is', null)
      .limit(1)
    const key = data?.[0]?.thread_key
    if (typeof key === 'string' && key) return key
  }

  const norm = normalizeSubject(input.subject)
  if (!isGenericSubject(norm) && input.inboxId) {
    const since = new Date(new Date(input.receivedAt).getTime() - THREAD_WINDOW_DAYS * 86400000).toISOString()
    const { data } = await db
      .from('email_tickets')
      .select('thread_key,subject')
      .eq('client_id', input.clientId)
      .eq('inbox_id', input.inboxId)
      .eq('status', 'open')
      .gte('last_message_at', since)
      .order('last_message_at', { ascending: false })
      .limit(50)
    for (const t of data || []) {
      if (normalizeSubject(t.subject as string) === norm && typeof t.thread_key === 'string') return t.thread_key
    }
  }

  return newThreadKey(input.messageId, input.resendEmailId)
}
