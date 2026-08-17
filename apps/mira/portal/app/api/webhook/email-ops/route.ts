import { NextRequest, NextResponse, after } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { captureError } from '@/lib/capture-error'
import { verifySvixSignature, parseInboundEvent, extractAddress, extractDisplayName } from '@/lib/email-ops/resend-inbound'
import { resolveInboxByRecipients } from '@/lib/email-ops/inboxes'
import { processMessage } from '@/lib/email-ops/pipeline'
import type { StoredAttachment } from '@/lib/email-ops/types'

// Webhook de Resend Inbound (`email.received`). Exento de sesión en proxy.ts
// (/api/webhook/*): la autenticación es la firma Svix con RESEND_WEBHOOK_SECRET.
//
// Contrato: responder 200 en <1 s e idempotente (Resend reintenta). El trabajo
// pesado (cuerpo, adjuntos, IA) va en after(), y el cron /api/cron/email-ops
// recoge lo que se quede a medias.

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'RESEND_WEBHOOK_SECRET not configured' }, { status: 500 })
  }
  const rawBody = await req.text()
  if (!verifySvixSignature(rawBody, req.headers, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let json: unknown
  try {
    json = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const event = parseInboundEvent(json)
  if (!event) return NextResponse.json({ ignored: 'not email.received' })

  const db = adminClient()
  try {
    const inbox = await resolveInboxByRecipients(db, [...event.to, ...event.cc].map(extractAddress))
    if (!inbox) {
      // Configuración, no fallo transitorio: 200 para que Resend no reintente.
      console.warn('[email-ops] unknown inbound address', { to: event.to, cc: event.cc, emailId: event.emailId })
      captureError(new Error('email-ops: unknown inbound address'), { to: event.to, cc: event.cc, emailId: event.emailId })
      return NextResponse.json({ ignored: 'unknown_address' })
    }

    const attachments: StoredAttachment[] = event.attachments.map((a) => ({
      resend_id: a.id, filename: a.filename, content_type: a.content_type, size: a.size ?? null, path: null, extracted: null,
    }))
    const { data, error } = await db
      .from('email_messages')
      .insert({
        client_id: inbox.client_id,
        inbox_id: inbox.id,
        resend_email_id: event.emailId,
        message_id: event.messageId,
        from_address: extractAddress(event.from),
        from_name: extractDisplayName(event.from) || null,
        to_addresses: event.to.map(extractAddress),
        cc_addresses: event.cc.map(extractAddress),
        subject: event.subject,
        attachments,
        status: 'received',
        received_at: event.createdAt || new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      if ((error as { code?: string }).code === '23505') return NextResponse.json({ duplicate: true })
      throw error
    }

    const messageId = data.id as string
    after(async () => {
      await processMessage(messageId)
    })
    return NextResponse.json({ ok: true, messageId })
  } catch (err) {
    captureError(err, { route: 'webhook/email-ops', emailId: event.emailId })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
  }
}
