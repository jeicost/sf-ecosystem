// Entrada de correo por Resend Inbound.
//
// El webhook `email.received` trae SOLO metadatos (from, to, subject, ids de
// adjuntos); el cuerpo y las cabeceras se piden después a la API de recepción,
// y cada adjunto da una URL firmada de descarga. Así el webhook responde en
// milisegundos y los adjuntos grandes no pasan por el límite de cuerpo de Vercel.
//
// Firma: Resend firma con Svix (svix-id / svix-timestamp / svix-signature) y un
// secreto `whsec_<base64>`. Se verifica con crypto nativo — no hace falta el
// paquete svix para un HMAC.

import { createHmac, timingSafeEqual } from 'crypto'

const RESEND_API = 'https://api.resend.com'
const SIGNATURE_TOLERANCE_S = 5 * 60

export interface InboundAttachmentMeta {
  id: string
  filename: string
  content_type: string
  size?: number
}

export interface InboundEvent {
  emailId: string
  from: string
  to: string[]
  cc: string[]
  subject: string
  messageId: string | null
  createdAt: string | null
  attachments: InboundAttachmentMeta[]
}

export interface ReceivedEmail {
  text: string
  html: string
  headers: Record<string, string>
  from: string
  to: string[]
  cc: string[]
  subject: string
  messageId: string | null
  attachments: InboundAttachmentMeta[]
}

/**
 * Verifica la firma Svix del webhook. Devuelve false ante cualquier defecto
 * (cabecera ausente, timestamp fuera de tolerancia, ninguna firma v1 válida).
 */
export function verifySvixSignature(
  rawBody: string,
  headers: { get(name: string): string | null },
  secret: string
): boolean {
  const id = headers.get('svix-id')
  const ts = headers.get('svix-timestamp')
  const sigHeader = headers.get('svix-signature')
  if (!id || !ts || !sigHeader || !secret) return false

  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return false
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - tsNum) > SIGNATURE_TOLERANCE_S) return false

  const keyB64 = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  let key: Buffer
  try {
    key = Buffer.from(keyB64, 'base64')
  } catch {
    return false
  }
  if (key.length === 0) return false

  const expected = createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest()

  // La cabecera puede llevar varias firmas separadas por espacio ("v1,xxx v1,yyy").
  for (const part of sigHeader.split(' ')) {
    const [version, sig] = part.split(',')
    if (version !== 'v1' || !sig) continue
    let candidate: Buffer
    try {
      candidate = Buffer.from(sig, 'base64')
    } catch {
      continue
    }
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return true
  }
  return false
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  if (typeof v === 'string' && v.trim()) return [v]
  return []
}

function asAttachments(v: unknown): InboundAttachmentMeta[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .map((a) => ({
      id: String(a.id ?? ''),
      filename: String(a.filename ?? a.name ?? 'attachment'),
      content_type: String(a.content_type ?? a.contentType ?? 'application/octet-stream'),
      size: typeof a.size === 'number' ? a.size : undefined,
    }))
    .filter((a) => a.id)
}

/** Interpreta el JSON del webhook. null si no es un `email.received` utilizable. */
export function parseInboundEvent(json: unknown): InboundEvent | null {
  if (!json || typeof json !== 'object') return null
  const evt = json as Record<string, unknown>
  if (evt.type !== 'email.received') return null
  const data = (evt.data ?? {}) as Record<string, unknown>
  const emailId = String(data.email_id ?? data.id ?? '')
  if (!emailId) return null
  return {
    emailId,
    from: typeof data.from === 'string' ? data.from : '',
    to: asStringArray(data.to),
    cc: asStringArray(data.cc),
    subject: typeof data.subject === 'string' ? data.subject : '',
    messageId: typeof data.message_id === 'string' ? data.message_id : null,
    createdAt: typeof data.created_at === 'string' ? data.created_at : null,
    attachments: asAttachments(data.attachments),
  }
}

function apiKey(): string {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY is not configured')
  return key
}

async function resendGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${RESEND_API}${path}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${path} → ${res.status}: ${body.slice(0, 200)}`)
  }
  return (await res.json()) as Record<string, unknown>
}

/** Cuerpo, cabeceras y lista de adjuntos de un correo recibido. */
export async function fetchReceivedEmail(emailId: string): Promise<ReceivedEmail> {
  const data = await resendGet(`/emails/receiving/${encodeURIComponent(emailId)}`)
  const rawHeaders = (data.headers ?? {}) as Record<string, unknown>
  const headers: Record<string, string> = {}
  for (const [k, v] of Object.entries(rawHeaders)) {
    if (typeof v === 'string') headers[k.toLowerCase()] = v
    else if (Array.isArray(v)) headers[k.toLowerCase()] = v.filter((x) => typeof x === 'string').join(' ')
  }
  return {
    text: typeof data.text === 'string' ? data.text : '',
    html: typeof data.html === 'string' ? data.html : '',
    headers,
    from: typeof data.from === 'string' ? data.from : '',
    to: asStringArray(data.to),
    cc: asStringArray(data.cc),
    subject: typeof data.subject === 'string' ? data.subject : '',
    messageId: typeof data.message_id === 'string' ? data.message_id : headers['message-id'] || null,
    attachments: asAttachments(data.attachments),
  }
}

/** Descarga un adjunto (la API da una URL firmada temporal). */
export async function fetchAttachment(
  emailId: string,
  attachmentId: string
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  const meta = await resendGet(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`
  )
  const url = typeof meta.download_url === 'string' ? meta.download_url : null
  if (!url) throw new Error(`Attachment ${attachmentId}: no download_url`)
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Attachment download ${res.status}`)
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    filename: typeof meta.filename === 'string' ? meta.filename : 'attachment',
    contentType: typeof meta.content_type === 'string' ? meta.content_type : 'application/octet-stream',
  }
}

/** Extrae la dirección pura de "Nombre <a@b.c>" (minúsculas). */
export function extractAddress(raw: string): string {
  const m = raw.match(/<([^>]+)>/)
  return (m ? m[1] : raw).trim().toLowerCase()
}

/** Extrae el nombre visible de "Nombre <a@b.c>" (o vacío). */
export function extractDisplayName(raw: string): string {
  const m = raw.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>/)
  return m ? m[1].trim() : ''
}
