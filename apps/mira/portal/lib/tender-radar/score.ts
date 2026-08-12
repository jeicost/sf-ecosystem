import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson } from '@/lib/generation/extract-json'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import type { RadarCandidate } from './placsp'

// Scorer del radar: lo que hace a MIRA distinto de las alertas gratis de la PLACSP.
// Puntúa cada concurso contra las capacidades REALES del cliente (certificaciones,
// flota, geografía, tamaño, líneas de negocio) que viven en su Cerebro, y devuelve
// un veredicto go / revisar / no-go con una razón de una línea. No inventa: si el
// Cerebro no dice si tienen una capacidad, lo trata como incógnita, no como sí.

const MODEL = 'claude-sonnet-4-6' // scoring en lote, barato; el motor de memoria sí usa Opus

export interface TenderScore {
  id: string
  fit: number // 0-100
  verdict: 'go' | 'revisar' | 'no-go'
  reason: string
}

export async function scoreTenderFit(clientId: string, candidates: RadarCandidate[]): Promise<TenderScore[]> {
  if (!candidates.length) return []
  const brain = await fetchBrandBrain(clientId)
  const brainBlock = brain
    ? formatBrandBrainForPrompt(brain)
    : '(sin Cerebro cargado — puntúa solo por el objeto del contrato y márcalo como "revisar")'

  const list = candidates.map((c, i) => ({
    i,
    id: c.id,
    objeto: c.title,
    organo: c.org,
    cpv: c.cpv,
    importe: c.amount,
    plazo: c.deadline,
  }))

  const prompt = `Eres analista de licitaciones de esta empresa. Para cada concurso de la lista, decide el ENCAJE con las capacidades REALES de la empresa según su Cerebro (líneas de negocio, certificaciones, flota, geografía, tamaño, cliente objetivo). No inventes capacidades: si el Cerebro no confirma algo que el pliego exige, es una incógnita → baja el fit y usa "revisar".

Devuelve SOLO un JSON: { "scores": [ { "i": <índice>, "fit": <0-100>, "verdict": "go" | "revisar" | "no-go", "reason": "<una línea: por qué encaja o no>" } ] }

Criterio:
- "go" (fit ≥ 70): claramente dentro de su actividad y capacidades conocidas.
- "revisar" (fit 40-69): plausible pero depende de algo no confirmado en el Cerebro (certificación, zona, capacidad).
- "no-go" (fit < 40): fuera de su actividad o exige algo que no tienen.

CEREBRO DE LA EMPRESA (fuente de verdad de sus capacidades):
${brainBlock}

CONCURSOS:
${JSON.stringify(list, null, 1)}`

  const msg = await createMessageForClient(clientId, 'tender/radar-score', {
    model: MODEL, max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  const parsed = extractJson(text) as { scores?: Array<{ i: number; fit: number; verdict: string; reason: string }> } | null
  const scores = parsed?.scores || []

  return candidates.map((c, i) => {
    const s = scores.find((x) => x.i === i)
    const verdict = s?.verdict === 'go' || s?.verdict === 'no-go' ? s.verdict : 'revisar'
    return {
      id: c.id,
      fit: typeof s?.fit === 'number' ? Math.max(0, Math.min(100, s.fit)) : 50,
      verdict: verdict as TenderScore['verdict'],
      reason: s?.reason || 'Sin valoración — revisar a mano.',
    }
  })
}
