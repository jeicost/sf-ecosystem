import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { processPending } from '@/lib/email-ops/pipeline'
import { pollAllImapInboxes } from '@/lib/email-ops/imap-poll'
import { pollAllGraphInboxes } from '@/lib/microsoft/mail-poll'
import { recomputeOpenPriorities } from '@/lib/email-ops/priority'

// Red de seguridad de Email Ops: reintenta mensajes pendientes/fallidos (el
// webhook los procesa vía after(), pero un despliegue a medias o un timeout los
// deja colgados) y recalcula la prioridad de los abiertos (la hora de recogida
// se acerca sola). Invocado por el cron de Vercel con Bearer CRON_SECRET.

export const maxDuration = 300
/**
 * Cuántos correos procesa una pasada. Con el cron cada 10 minutos, 10 por
 * pasada son **60 correos a la hora para todas las marcas juntas** — y el
 * 14-oct-2026 entraron ~50/h entre GTD y Albasanz, con un pico de 143 en un
 * día. Es decir: el margen era del 20 % y una mañana cargada dejaba cola
 * para el resto del día (ese día, 107 correos de Albasanz sin tocar).
 *
 * 40 da 240/h. El coste de la pasada es tiempo, no dinero: se procesan en
 * serie a ~3-5 s cada uno, así que 40 son ~200 s y la ruta muere a los 300.
 * Si alguna vez se acerca al límite, bajar esto antes que subir maxDuration.
 * El gasto lo frenan los topes en dólares (mensual por marca y diario global),
 * no un contador de correos: un correo cuesta ~0,02 $ y el tope de 30 $ da
 * para ~1.500 al mes.
 */
const MAX_MESSAGES_PER_RUN = Number(process.env.EMAIL_OPS_MAX_PER_RUN || 40)

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1) Traer lo nuevo de los buzones IMAP (el webhook de Resend no interviene
  // en esos). 2) Reintentar lo que quedó pendiente, venga de donde venga.
  let imap: Awaited<ReturnType<typeof pollAllImapInboxes>> = []
  try {
    imap = await pollAllImapInboxes()
  } catch (err) {
    console.error('[cron/email-ops] imap poll failed', err)
  }

  // 1b) Buzones de Microsoft 365 leídos por Graph (OAuth, sin contraseña).
  let graph: Awaited<ReturnType<typeof pollAllGraphInboxes>> = []
  try {
    graph = await pollAllGraphInboxes()
  } catch (err) {
    console.error('[cron/email-ops] graph poll failed', err)
  }

  const results = await processPending({ limit: MAX_MESSAGES_PER_RUN })
  let repriced = 0
  try {
    repriced = await recomputeOpenPriorities(adminClient())
  } catch (err) {
    console.error('[cron/email-ops] reprice failed', err)
  }
  return NextResponse.json({
    imap: imap.map((r) => ({ address: r.address, fetched: r.fetched, processed: r.processed, error: r.error })),
    microsoft: graph.map((r) => ({ address: r.address, fetched: r.fetched, processed: r.processed, error: r.error })),
    processed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    repriced,
    results: results.map((r) => ({ id: r.messageId, ok: r.ok, ticketId: r.ticketId, error: r.error?.slice(0, 120), skipped: r.skipped })),
  })
}
