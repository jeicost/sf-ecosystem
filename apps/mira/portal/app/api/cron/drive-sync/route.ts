import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { syncDriveFolder } from '@/lib/drive-sync'

// Auto-sync diario de las carpetas de conocimiento conectadas (B3): recorre
// drive_folders con auto_sync_enabled y las sincroniza al cerebro. Invocado
// por el cron de Vercel (vercel.json) con Authorization: Bearer CRON_SECRET.
// Sin esto, el sync era solo manual (botón por carpeta).

export const maxDuration = 300

const MAX_FOLDERS_PER_RUN = 12
// Circuit-breaker de la síntesis Drive→Brand Brain (Fase 1): tope de
// propuestas NUEVAS por corrida, para que una noche con muchas carpetas
// cambiadas a la vez no inunde el buzón de brain_change_proposals (ya de por
// sí sin paginación ni vista cross-cliente hasta la Fase 2). Tiene que ser
// MENOR que MAX_FOLDERS_PER_RUN -- un valor igual o mayor lo vuelve
// inalcanzable (como máximo 1 propuesta por carpeta, nunca más que
// MAX_FOLDERS_PER_RUN en una corrida), confirmado por revisión adversarial
// el 2026-07-30.
const MAX_NEW_PROPOSALS_PER_RUN = 8

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()
  let { data: folders, error } = await admin
    .from('drive_folders')
    .select('*')
    .eq('auto_sync_enabled', true)
    .neq('purpose', 'deliverables') // entregables es destino de escritura, no fuente
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(MAX_FOLDERS_PER_RUN)

  // Pre-0049: sin la columna auto_sync_enabled, tratar todas las carpetas de
  // conocimiento como auto-sync (el default de la migración es true igualmente).
  if (error?.message.includes('auto_sync_enabled')) {
    ;({ data: folders, error } = await admin
      .from('drive_folders')
      .select('*')
      .neq('purpose', 'deliverables')
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(MAX_FOLDERS_PER_RUN))
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ folder: string; ok: boolean; detail?: string }> = []
  let newProposalsThisRun = 0
  for (const folder of folders ?? []) {
    try {
      const skipSynthesis = newProposalsThisRun >= MAX_NEW_PROPOSALS_PER_RUN
      const result = await syncDriveFolder(admin, folder.client_id, folder, { skipSynthesis })
      const ok = !('error' in result)
      if (ok && 'proposalCreated' in result && result.proposalCreated) newProposalsThisRun++
      results.push({
        folder: folder.folder_name,
        ok,
        detail: 'error' in result ? result.error.slice(0, 120) : `${result.filesSynced} files`,
      })
    } catch (err) {
      // Un fallo (token caducado, carpeta borrada) no debe parar el resto
      const msg = err instanceof Error ? err.message : 'sync failed'
      console.error(`drive-sync cron: folder ${folder.id} failed:`, msg)
      results.push({ folder: folder.folder_name, ok: false, detail: msg.slice(0, 120) })
    }
  }

  return NextResponse.json({
    synced: results.filter(r => r.ok).length,
    total: results.length,
    newProposals: newProposalsThisRun,
    results,
  })
}
