import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson } from '@/lib/generation/extract-json'
import { adminClient } from '@/lib/supabase'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

// Oferta económica de licitaciones (D4 Entrega). El agente APRENDE de las
// ofertas que el cliente ya presentó (tenders con `oferta` y status
// presentada/ganada/perdida = few-shot con sus % de baja reales) y de su
// playbook de precios (tender_settings, destilado y editable). Propone un
// precio por línea CONTRA la fórmula de puntuación del pliego, y lo entrega
// para revisar y editar — nunca para presentar sin pasar por una persona.
//
// División de trabajo medida en el resto de MIRA: el modelo clasifica y
// propone; TypeScript CALCULA (bajas, sumas ponderadas, precio>máximo). Un
// número inventado en una oferta pública descalifica: toda línea sin base va
// marcada a_confirmar, y validateOferta añade avisos deterministas.

export interface OfertaLinea {
  seccion: string
  servicio: string
  tramo: string | null
  max_sin_iva: number | null
  /** Factor de ponderación por frecuencia del pliego; null = la línea puntúa aparte (p. ej. % de baja). */
  factor: number | null
  precio_ofertado: number | null
  /** % de baja sobre el máximo, calculado en TS (no por el modelo). */
  baja_pct: number | null
  motivo: string
  a_confirmar: boolean
}

export interface OfertaCriterioAuto {
  nombre: string
  opciones: string | null
  respuesta: string
  puntos: number | null
  motivo: string
}

export interface TenderOferta {
  lote: string | null
  formula_precio: string | null
  estrategia: string
  lineas: OfertaLinea[]
  criterios_automaticos: OfertaCriterioAuto[]
  a_confirmar_global: string[]
  /** Avisos deterministas de validateOferta (precio>máximo, líneas sin precio…). */
  avisos: string[]
  /** Suma de precio×factor de las líneas con factor — el importe que compite en la fórmula. */
  suma_ponderada: number | null
}

const MODEL = 'claude-opus-4-8'

/** Ejemplos: ofertas ya presentadas por el cliente, compactadas a lo que enseña (familia → % baja). */
async function loadExamples(clientId: string, excludeTenderId?: string | null): Promise<string> {
  const db = adminClient()
  const { data } = await db
    .from('tenders')
    .select('id,title,organo,status,oferta')
    .eq('client_id', clientId)
    .in('status', ['presentada', 'ganada', 'perdida'])
    .not('oferta', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(5)
  const rows = (data || []).filter((t) => t.id !== excludeTenderId)
  if (rows.length === 0) return ''
  // Ganadas primero: son la doctrina confirmada.
  rows.sort((a, b) => (a.status === 'ganada' ? -1 : 0) - (b.status === 'ganada' ? -1 : 0))
  const parts = rows.slice(0, 3).map((t) => {
    const o = t.oferta as TenderOferta
    const lineas = (o?.lineas || [])
      .filter((l) => l.precio_ofertado != null)
      .map((l) => `  - ${l.seccion} | ${l.servicio}${l.tramo ? ` ${l.tramo}` : ''} | max ${l.max_sin_iva ?? '—'} | factor ${l.factor ?? '—'} | ofertado ${l.precio_ofertado}${l.baja_pct != null ? ` (baja ${l.baja_pct}%)` : ''}`)
      .join('\n')
    const autos = (o?.criterios_automaticos || []).map((c) => `  - ${c.nombre}: ${c.respuesta}`).join('\n')
    return `<oferta_presentada titulo="${(t.title || '').slice(0, 120)}" organo="${(t.organo || '').slice(0, 80)}" resultado="${t.status}">\n${lineas}\n${autos}\n</oferta_presentada>`
  })
  return parts.join('\n')
}

export async function getPlaybook(clientId: string): Promise<string | null> {
  const { data } = await adminClient().from('tender_settings').select('playbook').eq('client_id', clientId).maybeSingle()
  return (data?.playbook as string) || null
}

export async function savePlaybook(clientId: string, playbook: string): Promise<void> {
  const { error } = await adminClient()
    .from('tender_settings')
    .upsert({ client_id: clientId, playbook, updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
  if (error) throw error
}

/** Extrae la estructura de precios del pliego Y propone la oferta línea a línea. */
export async function generateTenderOferta(opts: {
  clientId: string
  pliegoText: string
  tenderId?: string | null
}): Promise<TenderOferta> {
  const { clientId, pliegoText, tenderId } = opts
  const [playbook, examples] = await Promise.all([getPlaybook(clientId), loadExamples(clientId, tenderId)])

  const prompt = `You are the pricing strategist preparing the ECONOMIC OFFER (Anexo de oferta económica) for a Spanish public tender. Work in Spanish.

STEP 1 — From the tender documents, extract the COMPLETE price structure: every line the offer form asks to price (sección/tabla, servicio, tramo de peso, precio unitario máximo SIN IVA, factor de ponderación por frecuencia si existe), and the exact scoring formula for price (how the points are computed: suma ponderada, % de baja, proporcional…). Also extract every automatically-scored criterion (checkboxes/thresholds like plataforma web, tiempo de resolución de incidencias) with its points.

STEP 2 — Propose the offered unit price (sin IVA) for EVERY line, optimising the score under the extracted formula, applying the client's pricing playbook and imitating the % de baja patterns of their past submitted offers (below). Rules of the craft:
- Lines scored by % de baja (fuera de la suma ponderada, p. ej. "kg adicional"): deep cuts are cheap points — follow the playbook's band.
- Lines inside a weighted sum: cut where factor × price moves the total most, IF past offers show the client can go there. Where past offers stayed at or near máximo (cost floor), do the same and say so in motivo.
- NEVER exceed the máximo. NEVER invent a price for a service family with no basis in playbook/examples: propose the closest analogue, set a_confirmar=true and say why in motivo.
- motivo: one short sentence per line (the strategy, not a restatement of the number).
- If the tender has lots, price the lot the client is bidding for (or the one the documents' offer form covers); name it in "lote".

Return ONLY a JSON object:
{
  "lote": "lote que se oferta o null",
  "formula_precio": "cómo puntúa el precio según el pliego, en 2-3 frases",
  "estrategia": "resumen en 3-5 frases del enfoque de precios aplicado",
  "lineas": [
    { "seccion": "nombre de la tabla del pliego", "servicio": "línea", "tramo": "0-2 kg" | null,
      "max_sin_iva": number | null, "factor": number | null,
      "precio_ofertado": number | null, "motivo": "por qué este precio", "a_confirmar": boolean }
  ],
  "criterios_automaticos": [
    { "nombre": "criterio", "opciones": "las opciones y puntos del pliego" | null,
      "respuesta": "lo que se declara", "puntos": number | null,
      "motivo": "base real para declararlo (o marca [A CONFIRMAR] si no consta que el cliente pueda)" }
  ],
  "a_confirmar_global": ["decisiones que el equipo debe validar antes de presentar"]
}

${playbook ? `CLIENT PRICING PLAYBOOK (doctrina destilada de sus ofertas — prevalece sobre heurísticas genéricas):\n${playbook.slice(0, 6000)}\n` : ''}
${examples ? `PAST SUBMITTED OFFERS (imita sus % de baja por familia de servicio):\n${examples}\n` : ''}
TENDER DOCUMENTS:
"""
${pliegoText.slice(0, 150000)}
"""

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/oferta', {
    model: MODEL, max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  const parsed = extractJson(text) as Partial<TenderOferta> | null
  if (!parsed || !Array.isArray(parsed.lineas)) throw new Error('No se pudo generar la oferta económica')
  return validateOferta(parsed)
}

/** Validación determinista: TS calcula, el modelo no suma. */
export function validateOferta(raw: Partial<TenderOferta>): TenderOferta {
  const avisos: string[] = []
  const lineas: OfertaLinea[] = (raw.lineas || []).map((l) => {
    const max = typeof l.max_sin_iva === 'number' ? l.max_sin_iva : null
    let precio = typeof l.precio_ofertado === 'number' ? Math.round(l.precio_ofertado * 100) / 100 : null
    let confirmar = !!l.a_confirmar
    if (precio != null && precio < 0) { precio = null; confirmar = true }
    if (precio != null && max != null && precio > max) {
      avisos.push(`"${l.servicio}${l.tramo ? ` ${l.tramo}` : ''}": ofertado ${precio} € SUPERA el máximo ${max} € — corregir antes de presentar`)
      confirmar = true
    }
    if (precio == null) {
      avisos.push(`"${l.servicio}${l.tramo ? ` ${l.tramo}` : ''}": sin precio propuesto`)
      confirmar = true
    }
    const baja = precio != null && max != null && max > 0 ? Math.round(((max - precio) / max) * 1000) / 10 : null
    return {
      seccion: String(l.seccion || '').slice(0, 120),
      servicio: String(l.servicio || '').slice(0, 200),
      tramo: l.tramo ? String(l.tramo).slice(0, 40) : null,
      max_sin_iva: max,
      factor: typeof l.factor === 'number' ? l.factor : null,
      precio_ofertado: precio,
      baja_pct: baja,
      motivo: String(l.motivo || '').slice(0, 300),
      a_confirmar: confirmar,
    }
  })
  const ponderadas = lineas.filter((l) => l.factor != null && l.precio_ofertado != null)
  const suma = ponderadas.length
    ? Math.round(ponderadas.reduce((acc, l) => acc + (l.precio_ofertado as number) * (l.factor as number), 0) * 100) / 100
    : null
  return {
    lote: raw.lote ? String(raw.lote).slice(0, 120) : null,
    formula_precio: raw.formula_precio ? String(raw.formula_precio).slice(0, 800) : null,
    estrategia: String(raw.estrategia || '').slice(0, 1500),
    lineas,
    criterios_automaticos: (raw.criterios_automaticos || []).map((c) => ({
      nombre: String(c.nombre || '').slice(0, 200),
      opciones: c.opciones ? String(c.opciones).slice(0, 300) : null,
      respuesta: String(c.respuesta || '').slice(0, 200),
      puntos: typeof c.puntos === 'number' ? c.puntos : null,
      motivo: String(c.motivo || '').slice(0, 300),
    })),
    a_confirmar_global: (raw.a_confirmar_global || []).map((s) => String(s).slice(0, 300)).slice(0, 12),
    avisos,
    suma_ponderada: suma,
  }
}
