import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { lintClientBrain, hasLintFindings } from '@/lib/brain-lint'

// Revisión semanal de salud del Brand Brain (Fase 3, 2026-07-30) -- mismo
// molde que /api/cron/drive-sync: Bearer CRON_SECRET, fallo aislado por
// cliente, resultado escrito en project_memory (reusa el visor existente,
// ProjectMemoryViewer.tsx -- no hace falta una tabla ni una vista nuevas).

export const maxDuration = 300
const MAX_CLIENTS_PER_RUN = 30

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = adminClient()
  const { data: clients, error } = await admin
    .from('clients')
    .select('id')
    .eq('status', 'active')
    .limit(MAX_CLIENTS_PER_RUN)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Array<{ clientId: string; ok: boolean; flagged?: boolean; detail?: string }> = []

  for (const client of clients ?? []) {
    try {
      const report = await lintClientBrain(admin, client.id)
      const flagged = hasLintFindings(report)

      if (flagged) {
        const today = new Date().toISOString().slice(0, 10)
        const summaryParts: string[] = []
        if (report.openContradictions.count > 0) {
          summaryParts.push(`${report.openContradictions.count} contradicción(es) abierta(s)`)
        }
        if (report.emptySections.length > 0) {
          summaryParts.push(`${report.emptySections.length} sección(es) vacía(s)`)
        }
        if (report.staleSections.length > 0) {
          summaryParts.push(`${report.staleSections.length} sección(es) sin actualizar hace 90+ días`)
        }
        if (report.orphanDriveFolders.length > 0) {
          summaryParts.push(`${report.orphanDriveFolders.length} carpeta(s) de Drive sin ninguna propuesta derivada`)
        }

        const memoryPayload = {
          client_id: client.id,
          title: `Revisión automática del Brand Brain — ${today}`,
          category: 'insight' as const,
          summary: summaryParts.join(', '),
          full_content: report,
          tags: ['brain_lint', today],
          source_department: 'brain-lint',
        }

        const { data: existing } = await admin
          .from('project_memory')
          .select('id')
          .eq('client_id', client.id)
          .contains('tags', ['brain_lint', today])
          .limit(1)

        if (existing?.length) {
          await admin.from('project_memory').update(memoryPayload).eq('id', existing[0].id)
        } else {
          await admin.from('project_memory').insert(memoryPayload)
        }
      }

      results.push({ clientId: client.id, ok: true, flagged })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'lint failed'
      console.error(`brain-lint cron: client ${client.id} failed:`, msg)
      results.push({ clientId: client.id, ok: false, detail: msg.slice(0, 120) })
    }
  }

  return NextResponse.json({
    total: results.length,
    flagged: results.filter((r) => r.flagged).length,
    results,
  })
}
