import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson } from '@/lib/generation/extract-json'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getKnowledgeContext } from '@/lib/knowledge'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

// Herramienta de licitaciones (D4 Entrega — el vertical que gana dinero).
// Dos pasos: (1) del PLIEGO extrae los criterios de puntuación reales; (2) con
// esos criterios + el corpus del cliente (esqueleto documental, certificaciones,
// memorias ganadoras — todo indexado) genera la memoria respondiendo criterio a
// criterio para maximizar la nota. Contrato anti-alucinación estricto: en una
// oferta pública un dato inventado descalifica.

export interface TenderCriterion {
  group: 'juicio_valor' | 'automatico_tecnico' | 'precio'
  name: string
  points: number | null
  sub?: Array<{ name: string; points: number | null }>
  requires?: string // qué debe demostrar la memoria para puntuar
}
export interface TenderCriteria {
  object?: string
  expediente?: string
  deadline?: string
  total_points: number | null
  criteria: TenderCriterion[]
  data_gaps: string[]
}

const MODEL = 'claude-opus-4-8'

/** Paso 1 — extrae la estructura de puntuación del pliego. */
export async function extractTenderCriteria(clientId: string, pliegoText: string): Promise<TenderCriteria> {
  const prompt = `You are a Spanish public-procurement analyst. From the tender documents below (pliego: PCAP / PPT / criterios), extract the SCORING STRUCTURE exactly as written — do not invent points or criteria.

Return ONLY a JSON object with this shape:
{
  "object": "objeto del contrato (breve)",
  "expediente": "nº de expediente si aparece",
  "deadline": "fecha límite de presentación si aparece, o null",
  "total_points": number or null,
  "criteria": [
    { "group": "juicio_valor" | "automatico_tecnico" | "precio",
      "name": "nombre del criterio",
      "points": number or null,
      "sub": [{ "name": "subcriterio", "points": number or null }],
      "requires": "qué debe demostrar la oferta para puntuar aquí" }
  ],
  "data_gaps": ["lo que no pudiste determinar del pliego"]
}

Rules: points come ONLY from the text. If a criterion's points aren't stated, use null. Keep 'requires' concrete and actionable.

TENDER DOCUMENTS:
"""
${pliegoText.slice(0, 45000)}
"""

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/extract', {
    model: MODEL, max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  const parsed = extractJson(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('No se pudo extraer la estructura de criterios')
  return parsed as unknown as TenderCriteria
}

/** Paso 2 — genera la memoria respondiendo criterio a criterio. */
export async function generateTenderMemoria(opts: {
  clientId: string
  pliegoText: string
  criteria: TenderCriteria
}): Promise<Record<string, unknown>> {
  const { clientId, pliegoText, criteria } = opts
  const [brain, knowledge] = await Promise.all([
    fetchBrandBrain(clientId),
    // El corpus indexado: esqueleto documental, certificaciones, memorias previas.
    getKnowledgeContext(clientId, { query: 'memoria técnica pliego contingencia calidad RSC certificaciones equipo flota', charBudget: 6000, documentBudget: 14000 }),
  ])
  const brainBlock = brain ? `BRAND CONTEXT (Source of Truth — the client's own facts, voice and document_system):\n${formatBrandBrainForPrompt(brain)}` : ''

  const prompt = `You are the technical-proposal writer for this company (D4 "Entrega"). Write the MEMORIA TÉCNICA that responds to the tender below, section by section, MAXIMISING the score. Use the company's real document_system (skeleton, reusable blocks, tone) from the brand context, and its real certifications/facts from the client knowledge. Personalise to THIS tender (name the contracting body in each section).

SCORING STRUCTURE (respond to every criterion that is 'juicio_valor' or 'automatico_tecnico'; do NOT write the price offer):
${JSON.stringify(criteria.criteria.filter((c) => c.group !== 'precio'), null, 1)}

Return ONLY a JSON object:
{
  "titulo": "título de la memoria",
  "resumen_ejecutivo": "2-3 frases",
  "secciones": [
    { "criterio": "nombre del criterio del pliego que responde",
      "puntos_objetivo": number or null,
      "titulo": "TÍTULO DE SECCIÓN EN MAYÚSCULAS (el enunciado del criterio)",
      "contenido": "texto de la sección, en la voz institucional del cliente, con cifra/plazo/norma cuando aplique",
      "datos_a_confirmar": ["datos concretos que el equipo debe rellenar/verificar antes de entregar"] }
  ],
  "checklist_qa": ["puntos de la checklist anti-alucinación del cliente aplicados"],
  "data_gaps": ["lo que faltaba en el corpus para cubrir algún criterio"]
}

HARD RULES: every factual claim (KPIs, certificaciones, flota, plazos) must come from the client knowledge/brand context or be marked [ASSUMPTION]/[MISSING: real data]. Never invent a certification, a number, or a competitor's name. Reuse the client's document_system blocks. Keep the institutional register (no humour).

${brainBlock}

${knowledge ? `CLIENT KNOWLEDGE (real corpus — certifications, prior memorias, document skeleton):\n${knowledge}` : ''}

TENDER (for reference — respond to its criteria, do not copy it verbatim):
"""
${pliegoText.slice(0, 20000)}
"""

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/generate', {
    model: MODEL, max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  const parsed = extractJson(text)
  if (!parsed || typeof parsed !== 'object') throw new Error('No se pudo generar la memoria')
  return parsed as Record<string, unknown>
}
