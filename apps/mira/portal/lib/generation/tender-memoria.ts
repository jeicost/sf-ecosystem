import { createMessageForClient } from '@/lib/anthropic-client'
import { TENDER_MODEL, ajustesModelo, techoSalida } from '@/lib/ai/models'
import { bloqueDisenadasPrompt, loadDisenadas, normalizarMarcadores, type Disenada } from '@/lib/tenders/disenadas'
import { extractJson } from '@/lib/generation/extract-json'
import { adminClient } from '@/lib/supabase'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '@/lib/brand-brain'
import { getKnowledgeContext } from '@/lib/knowledge'
import { getPlaybook } from '@/lib/generation/tender-oferta'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'
import { loadBaseMemoria, loadTeaching, teachingBlockDetallado, type BaseMemoria, type Teaching } from '@/lib/tenders/teaching'

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

const MODEL = TENDER_MODEL

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
    model: MODEL, max_tokens: techoSalida(MODEL, 4000), ...ajustesModelo(MODEL),
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
 * Cuánto de la memoria de partida elegida por la persona se enseña ENTERA al
 * modelo. 45.000 (antes 30.000): medido con evals/_scratch/prompt-memoria.ts,
 * el prompt completo con base al tope y todos los bloques llenos queda muy por
 * debajo de la ventana del modelo, y una memoria real de Usoa ronda los 40.000.
 */
export const BASE_MEMORIA_CAP = 45_000

/** Lo que se ha leído de la base cuando no cabe entera; null si cabe. */
export interface BaseRecortada { leidos: number; total: number }

/**
 * El recorte de la base como DATO, no solo como marca dentro del prompt: la
 * persona tiene que saber que las secciones finales de su memoria de partida no
 * han servido de modelo.
 */
export function recortarBase(cuerpo: string): { texto: string; recorte: BaseRecortada | null } {
  if (cuerpo.length <= BASE_MEMORIA_CAP) return { texto: cuerpo, recorte: null }
  return {
    texto: `${cuerpo.slice(0, BASE_MEMORIA_CAP)}\n  [… memoria de partida recortada a ${BASE_MEMORIA_CAP.toLocaleString('es-ES')} caracteres]`,
    recorte: { leidos: BASE_MEMORIA_CAP, total: cuerpo.length },
  }
}

export function avisoBaseRecortada(r: BaseRecortada): string {
  return `De la memoria de partida solo se han leído ${r.leidos.toLocaleString('es-ES')} de ${r.total.toLocaleString('es-ES')} caracteres: las secciones finales no han servido de modelo.`
}

export const AVISO_BASE_SIN_ORGANO = 'La memoria de partida no tiene órgano registrado: MIRA no ha podido enmascarar el nombre del órgano anterior; revísalo a mano.'

/**
 * Palabras del título de una memoria/expediente que NO se consideran nombre de
 * órgano: vocabulario de licitación, artículos, preposiciones. Todo en
 * mayúsculas sin tilde para comparar.
 */
const PALABRAS_COMUNES = new Set([
  'MEMORIA', 'TECNICA', 'TECNICO', 'SERVICIO', 'SERVICIOS', 'LOTE', 'LOTES', 'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'E', 'O', 'U', 'A', 'AL',
  'PARA', 'POR', 'CON', 'SIN', 'EN', 'UN', 'UNA', 'UNOS', 'UNAS', 'SU', 'SUS', 'QUE', 'COMO', 'ENTRE', 'SOBRE', 'DESDE', 'HASTA',
  'PROPUESTA', 'OFERTA', 'CONTRATO', 'CONTRATACION', 'LICITACION', 'EXPEDIENTE', 'EXP', 'PLIEGO', 'ANEXO', 'TITULO', 'BORRADOR', 'VERSION',
  'MENSAJERIA', 'PAQUETERIA', 'TRANSPORTE', 'ENTREGA', 'ENTREGAS', 'RECOGIDA', 'RECOGIDAS', 'REPARTO', 'DISTRIBUCION', 'LOGISTICA', 'CORREO', 'POSTAL',
  'GESTION', 'PLAN', 'SUMINISTRO', 'PRESTACION', 'DOCUMENTACION', 'DOCUMENTO', 'PROCEDIMIENTO', 'ABIERTO', 'SIMPLIFICADO', 'NEGOCIADO', 'ACUERDO', 'MARCO',
  'SEDE', 'SEDES', 'CENTRO', 'CENTROS', 'PROVINCIAL', 'NACIONAL', 'INTERNACIONAL', 'URGENTE', 'ORDINARIO', 'MENSUAL', 'ANUAL',
  // Geografía: la sede de la propia empresa aparece en todas sus memorias y no es un órgano.
  'MADRID', 'BARCELONA', 'VALENCIA', 'SEVILLA', 'BILBAO', 'ZARAGOZA', 'MALAGA', 'ESPANA', 'EUROPA', 'PENINSULA', 'BALEARES', 'CANARIAS', 'COMUNIDAD',
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
])
const sinTildes = (w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Nombres propios y siglas de los títulos de las memorias anteriores (tokens con
 * mayúscula inicial o todo en mayúsculas, ≥3 letras, fuera del vocabulario
 * común) que hay que enmascarar en los ejemplos. tenders.organo casi siempre es
 * null (la pantalla no lo guarda; solo el radar lo rellena), y con base = memoria
 * de la UAM para un pliego de Renfe iban 30.000 caracteres con «Universidad
 * Autónoma de Madrid» sin enmascarar. Lo que también aparece en el texto
 * LEGÍTIMO (el pliego actual, la propia marca) no se enmascara: es de esta
 * licitación.
 */
export function palabrasAEnmascarar(titulos: Array<string | null | undefined>, textoLegitimo: string): string[] {
  const legit = textoLegitimo.toLowerCase()
  const vistas = new Set<string>()
  const out: string[] = []
  for (const titulo of titulos) {
    for (const token of String(titulo || '').split(/[^\p{L}\p{N}]+/u)) {
      const letras = token.replace(/\P{L}/gu, '')
      if (letras.length < 3) continue
      const inicialMayus = /^\p{Lu}/u.test(token)
      const todoMayus = letras === letras.toUpperCase()
      if (!inicialMayus && !todoMayus) continue
      const clave = sinTildes(token).toUpperCase()
      if (PALABRAS_COMUNES.has(clave) || vistas.has(clave)) continue
      vistas.add(clave)
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu')
      if (re.test(legit)) continue
      out.push(token)
    }
  }
  return out
}

/** Enmascara palabras sueltas (las derivadas de los títulos), como palabra completa y sin distinguir mayúsculas. */
export function maskPalabras(txt: string, palabras: string[]): string {
  return palabras.reduce((acc, w) => acc.replace(new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu'), '[ÓRGANO ANTERIOR]'), txt)
}

/**
 * Enmascara los nombres de los órganos anteriores en un texto de ejemplo. El
 * nombre del órgano de un ejemplo NO puede acabar en la memoria nueva: se
 * sustituye antes de enseñárselo al modelo. Sin esto, "renfe" aparecía 12
 * veces dentro del texto que se le pedía imitar.
 */
export function maskOrganos(txt: string, organos: string[]): string {
  return organos.reduce((acc, o) => {
    const palabras = o.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 4 && !/^(lote|hospital|ministerio|consejeria|universidad|ayuntamiento|madrid|internacional|nacional)$/i.test(w))
    return palabras.reduce((a, w) => a.replace(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'giu'), '[ÓRGANO ANTERIOR]'), acc)
  }, txt)
}

/**
 * Few-shot de memorias: las que el cliente YA presentó (tenders con memoria y
 * status presentada/ganada/perdida), compactadas a estructura + arranques de
 * sección. Es el "aprender de las que hemos hecho": la siguiente memoria
 * hereda el esqueleto y el criterio de las anteriores, no solo el corpus.
 *
 * Si la persona ELIGE una memoria de partida (Usoa: «cógete la memoria de X»
 * no vale sin más, pero sí como punto de partida que ella decide), esa va
 * PRIMERA y ENTERA (hasta BASE_MEMORIA_CAP), y las demás con menos presupuesto.
 * Una base de otro cliente no llega aquí: loadBaseMemoria la descarta.
 */
export interface MemoriaExamples {
  text: string
  organos: string[]
  base: BaseMemoria | null
  /** La base no cabía entera; null si cabe o no hay base. */
  baseRecortada: BaseRecortada | null
  /** Lo que la persona debe saber de los ejemplos (base sin órgano que enmascarar…). Van a data_gaps/avisos. */
  avisos: string[]
}

export async function loadMemoriaExamples(
  clientId: string,
  excludeTenderId?: string | null,
  baseTenderId?: string | null,
  /** Texto de ESTA licitación (pliego, marca propia): lo que aparezca ahí no es «órgano anterior» y no se enmascara. */
  contexto?: { pliegoActual?: string | null; legitimos?: Array<string | null | undefined> },
): Promise<MemoriaExamples> {
  const db = adminClient()
  const [base, { data }] = await Promise.all([
    loadBaseMemoria(clientId, baseTenderId, excludeTenderId),
    db.from('tenders')
      .select('id,title,organo,status,memoria,updated_at')
      .eq('client_id', clientId)
      .in('status', ['presentada', 'ganada', 'perdida'])
      .not('memoria', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(8),
  ])
  const rows = (data || []).filter((t) => t.id !== excludeTenderId && t.id !== base?.id)
  // Las ganadas primero: si alguien marca cuáles ganaron, el motor imita esas.
  rows.sort((a, b) => (a.status === 'ganada' ? -1 : 0) - (b.status === 'ganada' ? -1 : 0))
  // Con base elegida, el resto se reduce a UNA y más corta: la estructura ya la marca la base.
  const elegidas = rows.slice(0, base ? 1 : 2)
  const porSeccion = base ? 400 : 700
  const organos = [base, ...elegidas].flatMap((t) => (t ? [String(t.organo || '').trim()] : [])).filter((o) => o.length >= 3)
  // Además del órgano registrado, los nombres propios de los TÍTULOS (de la
  // base y de los ejemplos): tenders.organo casi siempre viene vacío.
  const legitimo = [contexto?.pliegoActual || '', ...(contexto?.legitimos || []).map((x) => x || '')].join('\n')
  const titulosBase = base ? [base.title, base.memoria.titulo] : []
  const titulosEjemplos = elegidas.flatMap((t) => [t.title, (t.memoria as { titulo?: string } | null)?.titulo])
  const palabrasBase = palabrasAEnmascarar(titulosBase, legitimo)
  const palabras = palabrasAEnmascarar([...titulosBase, ...titulosEjemplos], legitimo)
  const mask = (txt: string) => maskPalabras(maskOrganos(txt, organos), palabras)
  const avisos: string[] = []
  // Si de la base no hay NADA que enmascarar (ni órgano ni nombre en el título),
  // el modelo va a leer 45.000 caracteres con el órgano anterior a la vista.
  if (base && !String(base.organo || '').trim() && palabrasBase.length === 0) avisos.push(AVISO_BASE_SIN_ORGANO)

  const partes: string[] = []
  let baseRecortada: BaseRecortada | null = null
  if (base) {
    const anio = String(base.updated_at || '').slice(0, 4)
    const bruto = (base.memoria.secciones || [])
      .map((sec) => `  ## ${mask(sec.titulo || '')}\n  ${mask(sec.contenido || '')}`)
      .join('\n')
    const { texto: cuerpo, recorte } = recortarBase(bruto)
    baseRecortada = recorte
    partes.push(`<memoria_de_partida anio="${anio}" resultado="${base.status || ''}">\nMEMORIA DE PARTIDA elegida por la responsable: sigue su estructura y tono; adapta el contenido a ESTE pliego; NO copies datos del órgano anterior.\n${cuerpo}\n</memoria_de_partida>`)
  }
  if (elegidas.length === 0 && !base) return { text: '', organos: [], base: null, baseRecortada: null, avisos: [] }

  for (const t of elegidas) {
    const m = t.memoria as { titulo?: string; secciones?: Array<{ titulo?: string; contenido?: string }> }
    const anio = String(t.updated_at || '').slice(0, 4)
    const secs = (m?.secciones || [])
      .map((sec) => `  ## ${mask(sec.titulo || '')}\n  ${mask((sec.contenido || '').slice(0, porSeccion))}…`)
      .join('\n')
    partes.push(`<memoria_presentada anio="${anio}" resultado="${t.status}">\n${secs}\n</memoria_presentada>`)
  }
  return { text: partes.join('\n'), organos, base, baseRecortada, avisos }
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

/** Lo que el modelo devuelve además de la memoria: qué instrucciones dice haber aplicado y cuáles no. */
export interface InstruccionNoAplicada { instruccion: string; motivo: string }

/**
 * Prompt de la memoria, separado de la llamada para poder construirlo SIN
 * enviarlo (evals/_scratch/prompt-memoria.ts). Recibe todo ya cargado.
 */
export function buildMemoriaPrompt(parts: {
  criteria: TenderCriteria
  pliegoText: string
  teaching: string
  playbook: string | null
  examplesText: string
  brainBlock: string
  knowledge: string | null
  /** Bloque de páginas con diseño propio (bloqueDisenadasPrompt), o vacío. */
  disenadas?: string
}): string {
  const { criteria, pliegoText, teaching, playbook, examplesText, brainBlock, knowledge, disenadas } = parts
  return `You are the technical-proposal writer for this company (D4 "Entrega"). Write the MEMORIA TÉCNICA that responds to the tender below, section by section, MAXIMISING the score. Use the company's real document_system (skeleton, reusable blocks, tone) from the brand context, and its real certifications/facts from the client knowledge. Personalise to THIS tender (name the contracting body in each section).

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
  "data_gaps": ["lo que faltaba en el corpus para cubrir algún criterio"],
  "instrucciones_aplicadas": ["cada instrucción, guía o lección de la responsable que has aplicado, en una frase corta, y dónde"],
  "instrucciones_no_aplicadas": [{ "instruccion": "la que no has podido cumplir", "motivo": "por qué (p. ej. el dato no está en el material de la empresa)" }]
}

HARD RULES: every factual claim (KPIs, certificaciones, flota, plazos, plantilla) must come from the CLIENT KNOWLEDGE or the brand context, or be marked [MISSING: real data]. Never invent a certification, a number, or a competitor's name. Reuse the client's document_system blocks. Keep the institutional register (no humour).
- The PAST SUBMITTED MEMORIAS are a model of STRUCTURE and TONE only. They are NOT a source of facts: their figures belong to other contracts and other years. Never copy a number from them.
- They were written for OTHER contracting bodies. Their names appear masked as [ÓRGANO ANTERIOR]; never write any contracting body's name except the one in THIS tender.
- If two knowledge sources give different figures for the same fact, use the most recent and add it to datos_a_confirmar.
- The person in charge may have left INSTRUCTIONS, a WRITING GUIDE and LESSONS below. They rule over style, focus, structure and emphasis, and you MUST list in instrucciones_aplicadas each one you followed. If one cannot be met without inventing a company fact, do NOT invent: leave [FALTA: …] where the fact goes and list it in instrucciones_no_aplicadas with the reason. If there are none, return both arrays empty.

${teaching ? `${teaching}\n` : ''}
${disenadas ? `${disenadas}\n` : ''}
${playbook ? `CLIENT TENDER PLAYBOOK (doctrina destilada de sus ofertas presentadas — prevalece sobre heurísticas genéricas):\n${playbook.slice(0, 6000)}\n` : ''}
${examplesText ? `PAST SUBMITTED MEMORIAS (STRUCTURE AND TONE ONLY — imita su esqueleto, su registro y el tipo de compromiso que asumen; NUNCA sus cifras ni sus nombres. Si hay una MEMORIA DE PARTIDA, su estructura manda sobre las demás):\n${examplesText}\n` : ''}
${brainBlock}

${knowledge ? `CLIENT KNOWLEDGE (real corpus — certifications, prior memorias, document skeleton):\n${knowledge}` : ''}

TENDER (for reference — respond to its criteria, do not copy it verbatim):
"""
${pliegoText.slice(0, PLIEGO_WINDOW)}
"""

${GROUNDING_CONTRACT}`
}

/**
 * Avisos deterministas sobre las instrucciones: el modelo MARCA qué aplicó y
 * qué no; TypeScript lo convierte en avisos que la pantalla ya enseña como
 * data_gaps. Si había instrucciones y el modelo no dice haber aplicado
 * ninguna, se avisa: una memoria que ignora a la responsable en silencio es
 * peor que una que lo dice.
 */
export function avisosDeInstrucciones(parsed: Record<string, unknown>, hayInstrucciones: boolean): { aplicadas: string[]; noAplicadas: InstruccionNoAplicada[]; avisos: string[] } {
  const aplicadas = (Array.isArray(parsed.instrucciones_aplicadas) ? parsed.instrucciones_aplicadas : [])
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim().slice(0, 300)).slice(0, 60)
  const noAplicadas = (Array.isArray(parsed.instrucciones_no_aplicadas) ? parsed.instrucciones_no_aplicadas : [])
    .map((x) => {
      if (typeof x === 'string') return { instruccion: x.trim().slice(0, 300), motivo: '' }
      if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>
        return { instruccion: String(o.instruccion || '').trim().slice(0, 300), motivo: String(o.motivo || '').trim().slice(0, 300) }
      }
      return null
    })
    .filter((x): x is InstruccionNoAplicada => !!x && x.instruccion.length > 0).slice(0, 30)
  const avisos = noAplicadas.map((n) => `Instrucción no aplicada: «${n.instruccion}»${n.motivo ? ` — ${n.motivo}` : ''}.`)
  if (hayInstrucciones && aplicadas.length === 0) {
    avisos.push('MIRA no ha indicado qué instrucciones aplicó: revisa la memoria contra tus instrucciones.')
  }
  return { aplicadas, noAplicadas, avisos }
}

/** Paso 2 — genera la memoria respondiendo criterio a criterio. */
export async function generateTenderMemoria(opts: {
  clientId: string
  pliegoText: string
  criteria: TenderCriteria
  tenderId?: string | null
  /** Orientación libre de la persona para ESTE expediente (Usoa: «explicar a MIRA todo lo que me pasa por la cabeza»). */
  instructions?: string | null
  /** Memoria pasada de la que partir, elegida por la persona. Si no es del cliente, se ignora. */
  baseTenderId?: string | null
  /** Guía + lecciones ya cargadas por la ruta; si no vienen, se cargan aquí. */
  teaching?: Teaching | null
  /** Páginas con diseño propio de la marca; si no vienen, se cargan aquí. */
  disenadas?: Disenada[]
}): Promise<Record<string, unknown>> {
  const { clientId, pliegoText, criteria } = opts
  // El brain va primero: su brandName es texto LEGÍTIMO para el enmascarado de
  // los ejemplos (la propia marca en el título de una memoria no es un órgano).
  const brain = await fetchBrandBrain(clientId)
  const [knowledge, playbook, examples, teaching, disenadas] = await Promise.all([
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
    loadMemoriaExamples(clientId, opts.tenderId, opts.baseTenderId, { pliegoActual: pliegoText, legitimos: [brain?.brandName] }),
    opts.teaching ? Promise.resolve(opts.teaching) : loadTeaching(clientId),
    opts.disenadas ? Promise.resolve(opts.disenadas) : loadDisenadas(adminClient(), clientId).catch((): Disenada[] => []),
  ])
  const { text: examplesText, organos, base } = examples
  const brainBlock = brain ? `BRAND CONTEXT (Source of Truth — the client's own facts, voice and document_system):\n${formatBrandBrainForPrompt(brain)}` : ''
  const instrucciones = (opts.instructions || '').trim()
  const { text: teachingText, recortes: recortesEnsenanza } = teachingBlockDetallado({ instructions: instrucciones, guide: teaching.guide, lessons: teaching.lessons })
  const hayEnsenanza = teachingText.length > 0

  const prompt = buildMemoriaPrompt({ criteria, pliegoText, teaching: teachingText, playbook, examplesText, brainBlock, knowledge, disenadas: bloqueDisenadasPrompt(disenadas) })

  const msg = await createMessageForClient(clientId, 'tender/generate', {
    // 16.000: una memoria completa (criterios + secciones de servicio) no cabe
    // en 12.000. Por encima de ~21.000 el SDK exige streaming (medido 01-sep).
    model: MODEL, max_tokens: techoSalida(MODEL, 16000), ...ajustesModelo(MODEL),
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
  // Marcas de páginas diseñadas: el modelo marca, TS valida. Una marca inventada no llega al Word.
  const marcasRaras: string[] = []
  for (const sec of secciones) {
    const m = normalizarMarcadores(String(sec.contenido), disenadas)
    sec.contenido = m.texto
    marcasRaras.push(...m.desconocidas)
  }
  if (marcasRaras.length) gaps.push(`El redactor citó páginas diseñadas que no existen (${marcasRaras.slice(0, 3).map((x) => `«${x}»`).join(', ')}): se han quitado.`)
  const recorte = pliegoTruncationGap(pliegoText)
  if (recorte) gaps.push(recorte)
  // Lo que el modelo NO ha visto de la base y de la enseñanza, y lo que no se ha
  // podido enmascarar: la persona tiene que saberlo, no solo el modelo.
  if (examples.baseRecortada) gaps.push(avisoBaseRecortada(examples.baseRecortada))
  gaps.push(...examples.avisos, ...recortesEnsenanza)
  const colados = organosColados(parsed, organos, pliegoText)
  // El marcador de enmascarado nunca debe acabar en el TEXTO de la memoria.
  if (secciones.some((sec) => /ÓRGANO ANTERIOR/.test(`${sec.titulo} ${sec.contenido}`))) {
    gaps.push('Alguna sección contiene el marcador «[ÓRGANO ANTERIOR]», que viene de una memoria de ejemplo: sustitúyelo por el órgano de esta licitación.')
  }
  if (colados.length) {
    gaps.push(`La memoria menciona ${colados.map((o) => `«${o}»`).join(', ')}, que es el órgano de una memoria anterior usada como ejemplo: revísalo antes de presentar.`)
  }
  // Las instrucciones: el modelo marca, TS avisa. Solo cuenta como «había
  // instrucciones» lo que la persona escribió (guía y lecciones también se
  // listan, pero su ausencia en la lista no es un fallo por sí sola).
  const ins = avisosDeInstrucciones(parsed, instrucciones.length > 0)
  if (hayEnsenanza) gaps.push(...ins.avisos)
  // Sin enseñanza alguna no hay nada que «aplicar»: lo que el modelo devuelva
  // ahí es inventado y saldría en el recuadro verde de la pantalla.
  parsed.instrucciones_aplicadas = hayEnsenanza ? ins.aplicadas : []
  parsed.instrucciones_no_aplicadas = hayEnsenanza ? ins.noAplicadas : []
  if (base) parsed.base_tender_id = base.id
  parsed.data_gaps = gaps
  return parsed
}
