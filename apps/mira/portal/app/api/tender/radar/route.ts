import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { fetchPlacspCandidates } from '@/lib/tender-radar/placsp'
import { scoreTenderFit } from '@/lib/tender-radar/score'
import { CLIENT_CPV } from '@/lib/entitlements'

export const maxDuration = 300

// Radar v0: busca concursos recientes en la PLACSP (open data gratis), filtra por
// CPV del cliente y plazo abierto, y los puntúa contra su Cerebro. On-demand: sin
// cron ni tabla nueva. El coste es solo tokens de scoring (Sonnet, céntimos).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const { candidates, pagesRead, stopReason } = await fetchPlacspCandidates({
      cpvPrefixes: Array.isArray(body.cpvPrefixes) && body.cpvPrefixes.length
        ? body.cpvPrefixes
        : CLIENT_CPV[access.clientId], // por sector; sin entrada → los de logística por defecto
      maxPages: typeof body.maxPages === 'number' ? body.maxPages : undefined,
      maxAgeDays: typeof body.maxAgeDays === 'number' ? body.maxAgeDays : undefined,
      nowIso: new Date().toISOString(),
    })

    // Cap de scoring para acotar coste/latencia (los más urgentes por plazo).
    const CAP = 24
    const toScore = candidates.slice(0, CAP)
    const scores = await scoreTenderFit(access.clientId, toScore)
    const byId = new Map(scores.map((s) => [s.id, s]))

    const results = toScore
      .map((c) => ({ ...c, score: byId.get(c.id) || null }))
      .sort((a, b) => (b.score?.fit ?? 0) - (a.score?.fit ?? 0))

    return NextResponse.json({
      results,
      meta: { total_found: candidates.length, scored: toScore.length, capped: candidates.length > CAP, pagesRead, stopReason },
    })
  } catch (error) {
    console.error('tender/radar error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Radar failed' }, { status: 500 })
  }
}
