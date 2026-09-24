import { ImapFlow } from 'imapflow'
import { simpleParser, type ParsedMail, type Attachment } from 'mailparser'
import type { SupabaseClient } from '@supabase/supabase-js'
import { decryptSecret } from '@/lib/crypto'
import type { ReceivedEmail, InboundAttachmentMeta } from './resend-inbound'

// Segundo camino de entrada de Email Ops: leer el buzón del cliente por IMAP.
//
// El primero (Resend) exige dominio propio, DNS y que alguien del cliente ponga
// una regla de reenvío. Este no exige nada de eso: con las credenciales del
// buzón, MIRA lee directamente. A cambio, guardamos su contraseña (cifrada) y
// vemos TODO el buzón, no solo lo que quieran reenviar — es una decisión de
// negocio, no técnica.
//
// Todo el trabajo pesado (IA, ticket, aprendizaje) es el MISMO pipeline: aquí
// solo se traduce un correo IMAP a la forma que ya entiende processMessage.

export interface ImapCredentials {
  host: string
  port: number
  user: string
  /** En claro SOLO en memoria. En la BD viaja cifrada. */
  password: string
}

export interface ImapInboxRow {
  id: string
  client_id: string
  address: string
  department: string
  imap_host: string | null
  imap_port: number | null
  imap_user: string | null
  imap_password: string | null
  imap_last_uid: number | null
}

/** Prefijo que marca un mensaje leído por IMAP: `imap:<inboxId>:<uid>`. */
export const IMAP_ID_PREFIX = 'imap:'

export function imapMessageId(inboxId: string, uid: number): string {
  return `${IMAP_ID_PREFIX}${inboxId}:${uid}`
}

export function parseImapMessageId(id: string): { inboxId: string; uid: number } | null {
  if (!id.startsWith(IMAP_ID_PREFIX)) return null
  const [inboxId, uid] = id.slice(IMAP_ID_PREFIX.length).split(':')
  const n = Number(uid)
  return inboxId && Number.isFinite(n) ? { inboxId, uid: n } : null
}

/** Timeouts cortos: esto corre en una función serverless, no en un servidor propio. */
function client(c: ImapCredentials): ImapFlow {
  return new ImapFlow({
    host: c.host,
    port: c.port || 993,
    secure: true,
    auth: { user: c.user, pass: c.password },
    logger: false,
    // Nunca volcar el diálogo IMAP: llevaría la contraseña a los logs.
    emitLogs: false,
    greetingTimeout: 10000,
    socketTimeout: 60000,
  })
}

export interface ImapTestResult {
  ok: boolean
  error?: string
  /** Mensajes que hay ahora mismo en INBOX (señal de que la lectura funciona). */
  messages?: number
}

/**
 * Prueba de conexión para el alta: valida credenciales SIN guardar nada.
 * Devuelve el error tal cual lo da el servidor — es la forma honesta de
 * descubrir, por ejemplo, que Microsoft 365 tiene desactivado el acceso por
 * contraseña para IMAP en ese inquilino.
 */
export async function testImapConnection(c: ImapCredentials): Promise<ImapTestResult> {
  const cli = client(c)
  try {
    await cli.connect()
    const box = await cli.mailboxOpen('INBOX', { readOnly: true })
    const messages = typeof box.exists === 'number' ? box.exists : undefined
    return { ok: true, messages }
  } catch (err) {
    return { ok: false, error: cleanImapError(err) }
  } finally {
    try { await cli.logout() } catch { /* la conexión ya puede estar rota */ }
  }
}

/** Mensaje de error legible y SIN credenciales dentro. */
export function cleanImapError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const msg = raw.replace(/\bLOGIN\b.*/i, 'LOGIN [omitido]').slice(0, 300)
  if (/authenticationfailed|invalid credentials|login failed/i.test(msg)) {
    return `Credenciales rechazadas por el servidor: ${msg}`
  }
  if (/basic authentication|disabled|not enabled/i.test(msg)) {
    return `El servidor NO admite acceso por contraseña para IMAP (hace falta activarlo o usar OAuth): ${msg}`
  }
  return msg
}

/** La fecha del mensaje llega como Date o como texto según el servidor. */
function toIso(v: string | Date | undefined | null): string {
  if (!v) return new Date().toISOString()
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function toAttachmentMeta(a: Attachment, i: number): InboundAttachmentMeta {
  return {
    id: String(i),
    filename: a.filename || `adjunto-${i + 1}`,
    content_type: a.contentType || 'application/octet-stream',
    size: a.size,
  }
}

/** Un correo IMAP con la forma que ya entiende el pipeline, más sus adjuntos. */
export interface ImapFetched {
  uid: number
  received: ReceivedEmail
  attachments: Buffer[]
  receivedAt: string
}

function toReceived(parsed: ParsedMail): ReceivedEmail {
  const addrs = (v: ParsedMail['to']): string[] => {
    if (!v) return []
    const list = Array.isArray(v) ? v : [v]
    return list.flatMap((a) => a.value.map((x) => (x.name ? `${x.name} <${x.address}>` : x.address || ''))).filter(Boolean)
  }
  const from = parsed.from?.value?.[0]
  return {
    text: parsed.text || '',
    html: typeof parsed.html === 'string' ? parsed.html : '',
    headers: {
      'in-reply-to': parsed.inReplyTo || '',
      references: Array.isArray(parsed.references) ? parsed.references.join(' ') : parsed.references || '',
    },
    from: from ? (from.name ? `${from.name} <${from.address}>` : from.address || '') : '',
    to: addrs(parsed.to),
    cc: addrs(parsed.cc),
    subject: parsed.subject || '',
    messageId: parsed.messageId || null,
    attachments: (parsed.attachments || []).map(toAttachmentMeta),
  }
}

export function decryptCredentials(row: ImapInboxRow): ImapCredentials | null {
  const password = decryptSecret(row.imap_password)
  if (!row.imap_host || !row.imap_user || !password) return null
  return { host: row.imap_host, port: row.imap_port || 993, user: row.imap_user, password }
}

/**
 * Trae los correos NUEVOS de un buzón (UID mayor que el último procesado).
 * La primera vez solo mira los últimos `firstRunLimit` para no tragarse años
 * de histórico en la primera ejecución.
 */
export async function fetchNewMessages(
  row: ImapInboxRow,
  opts: { limit?: number; firstRunLimit?: number } = {}
): Promise<ImapFetched[]> {
  const creds = decryptCredentials(row)
  if (!creds) throw new Error('Buzón IMAP sin credenciales utilizables')
  const limit = opts.limit ?? 20
  const firstRunLimit = opts.firstRunLimit ?? 10

  const cli = client(creds)
  const out: ImapFetched[] = []
  try {
    await cli.connect()
    const box = await cli.mailboxOpen('INBOX', { readOnly: true })
    const total = typeof box.exists === 'number' ? box.exists : 0
    if (total === 0) return out

    // Sin marca previa: solo los últimos, por secuencia. Con marca: por UID.
    const range = row.imap_last_uid
      ? { uid: `${row.imap_last_uid + 1}:*` }
      : { seq: `${Math.max(1, total - firstRunLimit + 1)}:*` }

    for await (const msg of cli.fetch(range, { uid: true, source: true, internalDate: true })) {
      // El rango `n:*` de IMAP devuelve siempre al menos un mensaje aunque no
      // haya ninguno nuevo: hay que descartarlo explícitamente.
      if (row.imap_last_uid && msg.uid <= row.imap_last_uid) continue
      if (!msg.source) continue
      const parsed = await simpleParser(msg.source)
      out.push({
        uid: msg.uid,
        received: toReceived(parsed),
        attachments: (parsed.attachments || []).map((a) => a.content as Buffer),
        receivedAt: toIso(msg.internalDate || parsed.date),
      })
      if (out.length >= limit) break
    }
    return out
  } finally {
    try { await cli.logout() } catch { /* ya cerrada */ }
  }
}

/** Relee UN mensaje por UID (para reintentos: el buzón es la fuente de verdad). */
export async function fetchOneByUid(row: ImapInboxRow, uid: number): Promise<ImapFetched | null> {
  const creds = decryptCredentials(row)
  if (!creds) throw new Error('Buzón IMAP sin credenciales utilizables')
  const cli = client(creds)
  try {
    await cli.connect()
    await cli.mailboxOpen('INBOX', { readOnly: true })
    for await (const msg of cli.fetch({ uid: String(uid) }, { uid: true, source: true, internalDate: true })) {
      if (!msg.source) continue
      const parsed = await simpleParser(msg.source)
      return {
        uid: msg.uid,
        received: toReceived(parsed),
        attachments: (parsed.attachments || []).map((a) => a.content as Buffer),
        receivedAt: toIso(msg.internalDate || parsed.date),
      }
    }
    return null
  } finally {
    try { await cli.logout() } catch { /* ya cerrada */ }
  }
}

/** Buzones IMAP activos de todos los clientes (para el cron). */
export async function listImapInboxes(db: SupabaseClient): Promise<ImapInboxRow[]> {
  const { data, error } = await db
    .from('email_inboxes')
    .select('id,client_id,address,department,imap_host,imap_port,imap_user,imap_password,imap_last_uid')
    .eq('source', 'imap')
    .eq('active', true)
  if (error) throw error
  return (data || []) as unknown as ImapInboxRow[]
}
