// Contexto operativo del Monthly Content System (F4): pilares reales del
// cliente + el tablero del mes anterior desde approval_queue con su feedback
// (approved → APPROVE, rejected → PASS). El sistema mensual aprende de lo que
// el cliente aprobó y descartó — no arranca de cero cada mes.

import { adminClient } from '@/lib/supabase'

export interface MonthlyPillar {
  id: string
  pillar_name: string
  description: string | null
  themes: string[]
  examples: string[]
}

export interface MonthlyOperatingContext {
  pillars: MonthlyPillar[]
  pillarsBlock: string
  previousBoardBlock: string
  previousStats: { approved: number; rejected: number; pending: number }
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

/** Rango [inicio, fin) del mes anterior a 'YYYY-MM'. */
function previousMonthRange(month: string): { start: string; end: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return null
  const year = Number(m[1])
  const mon = Number(m[2]) // 1-12
  const start = new Date(Date.UTC(mon === 1 ? year - 1 : year, mon === 1 ? 11 : mon - 2, 1))
  const end = new Date(Date.UTC(year, mon - 1, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function getMonthlyOperatingContext(
  clientId: string,
  month: string
): Promise<MonthlyOperatingContext> {
  const admin = adminClient()

  const { data: pillarRows } = await admin
    .from('content_pillars')
    .select('id, pillar_name, description, themes, examples')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  const pillars: MonthlyPillar[] = (pillarRows || []).map((p) => ({
    id: p.id,
    pillar_name: p.pillar_name,
    description: p.description,
    themes: asStringArray(p.themes),
    examples: asStringArray(p.examples),
  }))

  const pillarsBlock = pillars.length
    ? `REGISTERED CONTENT PILLARS (${pillars.length} — the backbone of the system; keep them, evolve them or mark them dormant, but do not ignore them):\n` +
      pillars
        .map((p) => {
          const parts = [`- ${p.pillar_name}${p.description ? `: ${p.description}` : ''}`]
          if (p.themes.length) parts.push(`  Temas: ${p.themes.join(' · ')}`)
          if (p.examples.length) parts.push(`  Ejemplos previos: ${p.examples.slice(0, 3).join(' · ')}`)
          return parts.join('\n')
        })
        .join('\n')
    : 'REGISTERED CONTENT PILLARS: none yet — propose the initial pillar system (all with status PROPOSED).'

  // Tablero del mes anterior: filas de approval_queue con scheduled_time en
  // ese mes. Filas antiguas sin scheduled_time no puntúan (aceptado en plan).
  const range = previousMonthRange(month)
  let previousBoardBlock = ''
  const previousStats = { approved: 0, rejected: 0, pending: 0 }

  if (range) {
    const { data: rows } = await admin
      .from('approval_queue')
      .select('platform, copy, caption, status, reviewer_notes, scheduled_time')
      .eq('client_id', clientId)
      .gte('scheduled_time', range.start)
      .lt('scheduled_time', range.end)
      .order('scheduled_time', { ascending: true })
      .limit(80)

    const lines: string[] = []
    for (const r of rows || []) {
      const status = String(r.status || '')
      const verdict =
        status === 'approved' ? 'APPROVE' : status === 'rejected' ? 'PASS' : 'PENDIENTE'
      if (status === 'approved') previousStats.approved++
      else if (status === 'rejected') previousStats.rejected++
      else previousStats.pending++
      const pillarTag = /\[Pilar: ([^\]]+)\]/.exec(String(r.copy || ''))?.[1] ?? '—'
      const excerpt = String(r.caption || r.copy || '').replace(/\s+/g, ' ').slice(0, 110)
      const note = r.reviewer_notes ? ` · Nota del cliente: "${String(r.reviewer_notes).slice(0, 90)}"` : ''
      lines.push(`- [${verdict}] (${r.platform} · ${pillarTag}) ${excerpt}${note}`)
    }

    if (lines.length) {
      previousBoardBlock =
        `LAST MONTH'S BOARD (${lines.length} pieces — APPROVE = the client published it, PASS = they discarded it; learn from this):\n` +
        lines.join('\n') +
        `\nBalance: ${previousStats.approved} aprobadas · ${previousStats.rejected} descartadas · ${previousStats.pending} sin revisar.`
    }
  }

  return { pillars, pillarsBlock, previousBoardBlock, previousStats }
}
