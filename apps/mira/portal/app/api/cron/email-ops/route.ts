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

// 800, no 300: lo que limita una pasada es el TIEMPO, no el número de correos.
// Medido el 14-oct-2026 en producción con processed_at: **16 s por correo** de
// mediana y hasta 25 s con adjuntos (el modelo más la descarga y lectura de los
// albaranes). Con 300 s solo caben ~18 correos por pasada, así que subir el
// número sin subir esto no sirve de nada: la función muere a medias. 800 es el
// mismo techo que ya usan las rutas de licitaciones en este plan.
export const maxDuration = 800
/**
 * Cuántos correos procesa una pasada. Con el cron cada 10 minutos, 10 por
 * pasada eran **60 correos a la hora para todas las marcas juntas** — y el
 * 14-oct-2026 entraron ~50/h entre GTD y Albasanz, con un pico de 143 en un
 * día. El margen era del 20 % y una mañana cargada dejaba cola para el resto
 * del día (ese día, 107 correos de Albasanz sin tocar).
 *
 * 40 por pasada son ~640 s a 16 s cada uno: entra en los 800 con margen, y da
 * 240 correos/hora. Si alguna vez se acerca al techo, lo que toca es procesar
 * en paralelo (processPending los hace en serie), no subir más el tiempo.
 * El gasto lo frenan los topes en DÓLARES (mensual por marca y diario global),
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
