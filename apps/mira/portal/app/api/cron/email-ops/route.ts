import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { processPending } from '@/lib/email-ops/pipeline'
import { recomputeOpenPriorities } from '@/lib/email-ops/priority'

// Red de seguridad de Email Ops: reintenta mensajes pendientes/fallidos (el
// webhook los procesa vía after(), pero un despliegue a medias o un timeout los
// deja colgados) y recalcula la prioridad de los abiertos (la hora de recogida
// se acerca sola). Invocado por el cron de Vercel con Bearer CRON_SECRET.

export const maxDuration = 300
const MAX_MESSAGES_PER_RUN = 10

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await processPending({ limit: MAX_MESSAGES_PER_RUN })
  let repriced = 0
  try {
    repriced = await recomputeOpenPriorities(adminClient())
  } catch (err) {
    console.error('[cron/email-ops] reprice failed', err)
  }
  return NextResponse.json({
    processed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok && !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    repriced,
    results: results.map((r) => ({ id: r.messageId, ok: r.ok, ticketId: r.ticketId, error: r.error?.slice(0, 120), skipped: r.skipped })),
  })
}
