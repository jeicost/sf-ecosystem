import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { syncMicrosoftFolder } from '@/lib/microsoft/sync'

// Sincronización de carpetas de Microsoft 365 (vercel.json: cada 30 minutos).
//
// Dos trabajos en una pasada: (1) vaciar la cola de carpetas con backlog
// ('pending'/'partial'), que es lo que hace que una carpeta comercial de miles
// de ficheros entre en días y no en meses (40 docs × 48 pasadas ≈ 1.900/día);
// (2) repasar por delta las carpetas ya completas cada 12 horas para traer lo
// nuevo. Invocado por Vercel con Authorization: Bearer CRON_SECRET.

export const maxDuration = 300
const RUN_BUDGET_MS = 250_000
const MAX_FOLDERS_PER_RUN = 6
const DOCS_PER_FOLDER = 40
const REFRESH_AFTER_HOURS = 12

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const started = Date.now()
  const admin = adminClient()
  const staleCutoff = new Date(Date.now() - REFRESH_AFTER_HOURS * 3600 * 1000).toISOString()

  // Primero el backlog; después, lo que lleve más tiempo sin repasar.
  const { data: backlog, error } = await admin
    .from('microsoft_folders')
    .select('*')
    .eq('auto_sync_enabled', true)
    .in('sync_status', ['pending', 'partial', 'syncing'])
    .order('last_synced_at', { ascending: true, nullsFirst: true })
    .limit(MAX_FOLDERS_PER_RUN)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const folders = [...(backlog || [])]
  if (folders.length < MAX_FOLDERS_PER_RUN) {
    const { data: stale } = await admin
      .from('microsoft_folders')
      .select('*')
      .eq('auto_sync_enabled', true)
      .in('sync_status', ['completed', 'error'])
      .or(`last_synced_at.is.null,last_synced_at.lt.${staleCutoff}`)
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(MAX_FOLDERS_PER_RUN - folders.length)
    folders.push(...(stale || []))
  }

  const results: Array<{ folder: string; ok: boolean; detail: string }> = []
  for (const folder of folders) {
    if (Date.now() - started > RUN_BUDGET_MS * 0.8) break
    try {
      const r = await syncMicrosoftFolder(admin, folder, { maxDocs: DOCS_PER_FOLDER, deadline: started + RUN_BUDGET_MS })
      results.push({ folder: folder.folder_name ?? folder.id, ok: !('error' in r), detail: 'error' in r ? r.error.slice(0, 120) : `${r.ingested} ingested, ${r.remaining} remaining (${r.status})` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'sync failed'
      console.error(`microsoft-sync cron: folder ${folder.id} failed:`, msg)
      results.push({ folder: folder.folder_name ?? folder.id, ok: false, detail: msg.slice(0, 120) })
    }
  }
  return NextResponse.json({ synced: results.filter((r) => r.ok).length, total: results.length, results })
}
