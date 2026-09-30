import { createMessageForClient } from '@/lib/anthropic-client'
import { extractJson } from '@/lib/generation/extract-json'
import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getKnowledgeContext } from '@/lib/knowledge'
import { getPlaybook } from '@/lib/generation/tender-oferta'
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

/**
 * Cuánto pliego lee el modelo. Antes eran 45.000 caracteres para extraer
 * criterios y 20.000 para escribir la memoria, sin decirlo en ninguna parte: un
 * PCAP real con el anexo de criterios en las páginas 44-65 se quedaba fuera y
 * los criterios volvían como si estuvieran completos. 150.000 es lo que ya usa
 * la oferta económica sobre el mismo documento y el mismo modelo.
 */
export const PLIEGO_WINDOW = 150_000

/**
 * El aviso de recorte lo computa TypeScript, no el modelo: el modelo no puede
 * declarar que le falta lo que nunca vio.
 */
export function pliegoTruncationGap(pliegoText: string): string | null {
  if (pliegoText.length <= PLIEGO_WINDOW) return null
  return `Solo se han leído ${PLIEGO_WINDOW.toLocaleString('es-ES')} de ${pliegoText.length.toLocaleString('es-ES')} caracteres del pliego: revisa a mano los criterios que puedan estar en el resto.`
}

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
${pliegoText.slice(0, PLIEGO_WINDOW)}
"""

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/extract', {
    model: MODEL, max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  if (msg.stop_reason === 'max_tokens') throw new Error('La extracción de criterios se ha cortado a medias: vuelve a intentarlo')
  const parsed = extractJson(text) as unknown as TenderCriteria | null
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.criteria)) {
    throw new Error('No se pudo extraer la estructura de criterios')
  }
  const gap = pliegoTruncationGap(pliegoText)
  if (gap) parsed.data_gaps = [...(parsed.data_gaps || []), gap]
  return parsed
}

/**
 * Few-shot de memorias: las que el cliente YA presentó (tenders con memoria y
 * status presentada/ganada/perdida), compactadas a estructura + arranques de
 * sección. Es el "aprender de las que hemos hecho": la siguiente memoria
 * hereda el esqueleto y el criterio de las anteriores, no solo el corpus.
 */
export async function loadMemoriaExamples(clientId: string, excludeTenderId?: string | null): Promise<{ text: string; organos: string[] }> {
  const db = adminClient()
  const { data } = await db
    .from('tenders')
    .select('id,title,organo,status,memoria,updated_at')
    .eq('client_id', clientId)
    .in('status', ['presentada', 'ganada', 'perdida'])
    .not('memoria', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(8)
  const rows = (data || []).filter((t) => t.id !== excludeTenderId)
  if (rows.length === 0) return { text: '', organos: [] }
  // Las ganadas primero: si alguien marca cuáles ganaron, el motor imita esas.
  rows.sort((a, b) => (a.status === 'ganada' ? -1 : 0) - (b.status === 'ganada' ? -1 : 0))
  const elegidas = rows.slice(0, 2)
  const organos = elegidas.map((t) => String(t.organo || '').trim()).filter((o) => o.length >= 3)

  const text = elegidas.map((t) => {
    const m = t.memoria as { titulo?: string; secciones?: Array<{ titulo?: string; contenido?: string }> }
    const anio = String(t.updated_at || '').slice(0, 4)
    // El nombre del órgano de un ejemplo NO puede acabar en la memoria nueva:
    // se sustituye antes de enseñárselo al modelo. Sin esto, "renfe" aparecía
    // 12 veces dentro del texto que se le pedía imitar.
    const mask = (txt: string) => organos.reduce((acc, o) => {
      const palabras = o.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4 && !/^(lote|hospital|ministerio|consejeria|universidad|ayuntamiento|madrid|internacional|nacional)$/i.test(w))
      return palabras.reduce((a, w) => a.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'giu'), '[ÓRGANO ANTERIOR]'), acc)
    }, txt)
    const secs = (m?.secciones || [])
      .map((sec) => `  ## ${sec.titulo}\n  ${mask((sec.contenido || '').slice(0, 700))}…`)
      .join('\n')
    return `<memoria_presentada anio="${anio}" resultado="${t.status}">\n${secs}\n</memoria_presentada>`
  }).join('\n')
  return { text, organos }
}

/**
 * Nombres de órganos de los ejemplos que se han colado en la memoria nueva. El
 * modelo recibe la orden de no usarlos; TypeScript COMPRUEBA que la cumplió.
 */
export function organosColados(memoria: unknown, organos: string[], pliegoText: string): string[] {
  const texto = JSON.stringify(memoria || '').toLowerCase()
  const pliego = pliegoText.toLowerCase()
  return organos.filter((o) => {
    const clave = o.toLowerCase().replace(/\b(20\d\d|lote\s*\d+)\b/g, '').trim()
    // Si el pliego de AHORA también es de ese órgano (otra licitación de RENFE),
    // nombrarlo es lo correcto y no se avisa.
    return clave.length >= 4 && texto.includes(clave) && !pliego.includes(clave)
  })
}

/** Paso 2 — genera la memoria respondiendo criterio a criterio. */
export async function generateTenderMemoria(opts: {
  clientId: string
  pliegoText: string
  criteria: TenderCriteria
  tenderId?: string | null
}): Promise<Record<string, unknown>> {
  const { clientId, pliegoText, criteria } = opts
  const [brain, knowledge, playbook, examples] = await Promise.all([
    fetchBrandBrain(clientId),
    // El corpus indexado: esqueleto documental, certificaciones, memorias previas.
    // La consulta sale de los criterios de ESTE pliego, no de una lista fija, y
    // mira todo el corpus: con el límite por defecto (40 más recientes) el
    // generador ignoraba casi todo lo que la empresa había subido.
    getKnowledgeContext(clientId, {
      query: [criteria.object, ...criteria.criteria.filter((c) => c.group !== 'precio').map((c) => `${c.name} ${c.requires || ''}`),
        'certificaciones flota equipo calidad incidencias trazabilidad contingencia'].join(' ').slice(0, 1500),
      charBudget: 6000,
      documentBudget: 24000,
      fetchLimit: 2000,
    }),
    getPlaybook(clientId),
    loadMemoriaExamples(clientId, opts.tenderId),
  ])
  const { text: examplesText, organos } = examples
  const brainBlock = brain ? `BRAND CONTEXT (Source of Truth — the client's own facts, voice and document_system):\n${formatBrandBrainForPrompt(brain)}` : ''

  const prompt = `You are the technical-proposal writer for this company (D4 "Entrega"). Write the MEMORIA TÉCNICA that responds to the tender below, section by section, MAXIMISING the score. Use the company's real document_system (skeleton, reusable blocks, tone) from the brand context, and its real certifications/facts from the client knowledge. Personalise to THIS tender (name the contracting body in each section).

SCORING STRUCTURE (do NOT write the price offer):
${JSON.stringify(criteria.criteria.filter((c) => c.group !== 'precio'), null, 1)}

WHAT THE MEMORIA MUST CONTAIN — two kinds of sections:
1. One section per scoring criterion above ('juicio_valor' or 'automatico_tecnico'), titled with the criterion, puntos_objetivo = its points. These are written to MAXIMISE the score.
2. The sections the tender's technical specifications (PPT) require the bidder to describe even when they do not score. A technical proposal is still judged on whether it proves the service can be delivered: typically the service description and operating procedure, human and material resources assigned, start-up plan, quality and incident management, and contingency plan. Write them with the company's own skeleton (see the past memorias), personalised to this contract. puntos_objetivo = null for these.
Order the sections as the PCAP/PPT asks for them; if it doesn't say, follow the company's usual skeleton. A memoria that only answers the scoring criteria is incomplete.

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

HARD RULES: every factual claim (KPIs, certificaciones, flota, plazos, plantilla) must come from the CLIENT KNOWLEDGE or the brand context, or be marked [MISSING: real data]. Never invent a certification, a number, or a competitor's name. Reuse the client's document_system blocks. Keep the institutional register (no humour).
- The PAST SUBMITTED MEMORIAS are a model of STRUCTURE and TONE only. They are NOT a source of facts: their figures belong to other contracts and other years. Never copy a number from them.
- They were written for OTHER contracting bodies. Their names appear masked as [ÓRGANO ANTERIOR]; never write any contracting body's name except the one in THIS tender.
- If two knowledge sources give different figures for the same fact, use the most recent and add it to datos_a_confirmar.

${playbook ? `CLIENT TENDER PLAYBOOK (doctrina destilada de sus ofertas presentadas — prevalece sobre heurísticas genéricas):\n${playbook.slice(0, 6000)}\n` : ''}
${examplesText ? `PAST SUBMITTED MEMORIAS (STRUCTURE AND TONE ONLY — imita su esqueleto, su registro y el tipo de compromiso que asumen; NUNCA sus cifras ni sus nombres):\n${examplesText}\n` : ''}
${brainBlock}

${knowledge ? `CLIENT KNOWLEDGE (real corpus — certifications, prior memorias, document skeleton):\n${knowledge}` : ''}

TENDER (for reference — respond to its criteria, do not copy it verbatim):
"""
${pliegoText.slice(0, PLIEGO_WINDOW)}
"""

${GROUNDING_CONTRACT}`

  const msg = await createMessageForClient(clientId, 'tender/generate', {
    // 16.000: una memoria completa (criterios + secciones de servicio) no cabe
    // en 12.000. Por encima de ~21.000 el SDK exige streaming (medido 01-sep).
    model: MODEL, max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('')
  // Una memoria cortada a medias parece una memoria corta: se rechaza.
  if (msg.stop_reason === 'max_tokens') throw new Error('La memoria se ha cortado a medias por su longitud: vuelve a generarla')
  const parsed = extractJson(text) as Record<string, unknown> | null
  const secciones = parsed && Array.isArray(parsed.secciones) ? parsed.secciones as Array<Record<string, unknown>> : null
  if (!parsed || !secciones?.length || !secciones.every((s) => typeof s.titulo === 'string' && typeof s.contenido === 'string')) {
    throw new Error('La memoria generada no tiene una estructura válida: vuelve a generarla')
  }
  const gaps: string[] = Array.isArray(parsed.data_gaps) ? (parsed.data_gaps as string[]) : []
  const recorte = pliegoTruncationGap(pliegoText)
  if (recorte) gaps.push(recorte)
  const colados = organosColados(parsed, organos, pliegoText)
  // El marcador de enmascarado nunca debe acabar en el TEXTO de la memoria.
  if (secciones.some((sec) => /ÓRGANO ANTERIOR/.test(`${sec.titulo} ${sec.contenido}`))) {
    gaps.push('Alguna sección contiene el marcador «[ÓRGANO ANTERIOR]», que viene de una memoria de ejemplo: sustitúyelo por el órgano de esta licitación.')
  }
  if (colados.length) {
    gaps.push(`La memoria menciona ${colados.map((o) => `«${o}»`).join(', ')}, que es el órgano de una memoria anterior usada como ejemplo: revísalo antes de presentar.`)
  }
  parsed.data_gaps = gaps
  return parsed
}
