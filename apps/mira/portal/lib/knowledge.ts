// Índice unificado de conocimiento del cliente (P2 Fase 2, 2026-07-29).
// Lee la VIEW knowledge_items (migración 0052) que junta los 3 silos:
//   drive/upload_chat (agent_documents) · upload (client_documentation) ·
//   reference (brand_references)
// y devuelve UN bloque de contexto para prompts, con prioridad al proyecto
// activo. Sustituye (vía P2-S2) a getAgentDocumentContext — que solo veía
// documentos del rol — y complementa a retrieveAgentContext.
//
// Kill-switch: KNOWLEDGE_UNIFIED=0 hace que devuelva null y los consumidores
// caigan a su camino legacy. Resiliente pre-migración: si la vista no existe
// aún, devuelve null sin romper (patrón 0049/0050).

import { adminClient } from '@/lib/supabase'

export interface KnowledgeItem {
  id: string
  client_id: string
  project_id: string | null
  source: 'drive' | 'upload_chat' | 'upload' | 'reference'
  agent_role: string | null
  title: string | null
  summary: string | null
  content: string | null
  url: string | null
  created_at: string
}

export interface KnowledgeContextOptions {
  projectId?: string | null
  /** Rol del agente que consulta — sus documentos puntúan más alto. */
  agentRole?: string | null
  /** Presupuesto de caracteres para documentos de PROSA (coste acotado). */
  charBudget?: number
  /**
   * Presupuesto SEPARADO para contenido estructurado (hojas de cálculo).
   * Ver la nota de `kindOf` sobre por qué no comparten cupo.
   */
  structuredBudget?: number
  /**
   * Presupuesto SEPARADO para documentos largos (memorias, brand books).
   * Mismo motivo que el estructurado: si compartiera cupo con la prosa, un
   * solo documento se llevaría el bloque entero.
   */
  documentBudget?: number
  /**
   * Texto de la petición en curso (el mensaje del usuario en los chats).
   * Solo gobierna a los documentos largos: entran los que hablan de lo que se
   * está pidiendo, y NINGUNO si nada casa — así una petición de contenido no
   * paga el peaje de arrastrar secciones de una memoria técnica que no vienen
   * a cuento. Sin query, los documentos entran por recencia (comportamiento
   * para llamadores que no la pasan). Tablas, imágenes y prosa no cambian.
   */
  query?: string | null
  /** Máx. de filas a considerar antes del ranking. */
  fetchLimit?: number
}

/**
 * Cuatro tipos de conocimiento con presupuestos MUY distintos.
 *
 * El tope era 420 caracteres por documento para todo, y `excerpt()` prefiere el
 * resumen de IA sobre el contenido real. Para un menú en Excel eso significaba
 * que el agente leía "un menú con 58 recetas y precios" y **nunca un precio**:
 * justo el dato por el que se añadió el soporte de hojas de cálculo. Un CSV de
 * 87.000 caracteres entraba al prompt como 420.
 *
 * - `tabular`: datos densos y ya comprimidos (una fila = un hecho). Merecen
 *   mucho más espacio Y su propio cupo, para que un menú largo no eche fuera
 *   al brand book.
 * - `document`: el mismo problema que la tabla, con otra cara. Una memoria
 *   técnica de licitación de 55.000 caracteres entraba como 420: el agente
 *   sabía que existía y de qué iba, pero no podía reutilizar **ni un párrafo**
 *   del plan de contingencia ya escrito, que es justo el valor de tenerla. Con
 *   cupo propio, un brand book largo tampoco echa fuera al resto de la prosa.
 * - `image`: descripción por visión, 4-6 frases (~600 chars). 420 la cortaba
 *   justo antes del estilo visual, que suele ser lo más útil.
 * - `prose`: notas, extractos cortos, referencias. El comportamiento de siempre.
 */
type KnowledgeKind = 'tabular' | 'document' | 'image' | 'prose'

/**
 * A partir de aquí un texto deja de ser una nota y es un documento del que se
 * quiere citar literal. Por debajo, el resumen ya describe bien la pieza y no
 * compensa gastar cupo; por encima, el resumen se come justo lo reutilizable.
 *
 * El umbral es bajo a propósito: la unidad útil no es el documento entero sino
 * la SECCIÓN. Un recorte se lleva los primeros N caracteres, y en una memoria
 * técnica de 55.000 eso es portada e índice — más presupuesto solo compraba más
 * índice. Troceada por apartados, cada pieza ronda los 1.000-4.000 y entra
 * completa, que es lo que permite reutilizar el texto literal.
 */
const DOCUMENT_MIN_CHARS = 1200

/**
 * Por encima de esto, el texto vuelve a tratarse como prosa (resumen de 420).
 * Doble motivo, los dos medidos el 2026-08-10:
 * 1. El recorte coge los primeros N caracteres, y en un documento gigante eso
 *    es portada e índice: 4.000 caracteres de la memoria de La Paz (55k) no
 *    alcanzaban ni una sección real.
 * 2. Con selección por query, el documento entero contiene TODAS las palabras
 *    y le ganaría siempre a sus propias secciones — que son las piezas que sí
 *    entran completas. El gigante debe apartarse y dejar paso a sus trozos.
 */
const DOCUMENT_MAX_CHARS = 15000

// 8.000 caracteres para una tabla ≈ 2.000 tokens. Es lo que hace falta para que
// quepa ENTERO un menú real: el de Salsa son 58 filas / ~6.800 caracteres, y con
// 3.000 solo llegaban 26 precios de 58 — media tabla sigue siendo una respuesta
// incompleta, y encima sin avisar de que falta la otra mitad. Una fila ya es
// información comprimida (un hecho por línea), así que el coste por carácter
// aquí es mucho más rentable que en prosa. El cupo total (`structuredBudget`)
// acota el caso de varias hojas a la vez; si una tabla no cabe ni así, se corta
// y el modelo ve el aviso de "Rows: N" de la cabecera.
const PER_ITEM: Record<KnowledgeKind, number> = { tabular: 8000, document: 4000, image: 700, prose: 420 }

function kindOf(item: KnowledgeItem): KnowledgeKind {
  const body = item.content?.trimStart() ?? ''
  // Marcadores que emite el extractor de hojas (lib/drive-sync.ts) y el
  // describidor de imágenes (lib/vision.ts).
  if (body.startsWith('## Sheet:') || body.startsWith('Columns:')) return 'tabular'
  if (body.startsWith('[IMAGE]')) return 'image'
  if (body.length >= DOCUMENT_MIN_CHARS && body.length <= DOCUMENT_MAX_CHARS) return 'document'
  return 'prose'
}

// ── Selección de documentos por lo que se está pidiendo ──────────────────────

// Palabras que no señalan tema: artículos, preposiciones y los verbos con los
// que se pide ("hazme", "redacta"...). Sin acentos, porque normalize() los quita.
const QUERY_STOPWORDS = new Set([
  'para', 'como', 'este', 'esta', 'estos', 'estas', 'sobre', 'entre', 'hasta',
  'desde', 'donde', 'cuando', 'todo', 'toda', 'todos', 'todas', 'otro', 'otra',
  'pero', 'porque', 'aunque', 'tambien', 'ademas', 'algo', 'alguna', 'algunos',
  'nuestro', 'nuestra', 'nuestros', 'nuestras', 'tiene', 'tienen', 'tenga',
  'hacer', 'hace', 'favor', 'porfa', 'nuevo', 'nueva', 'cliente', 'clientes',
  'hazme', 'dame', 'crea', 'genera', 'escribe', 'redacta', 'redactame',
  'prepara', 'preparame', 'necesito', 'quiero', 'quiere', 'puedes', 'podrias',
  'ayuda', 'ayudame', 'texto', 'documento', 'with', 'that', 'this', 'about',
  'write', 'make', 'need', 'want', 'please', 'draft', 'create',
])

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Puente ES↔EN de términos frecuentes del dominio (C8 del plan 08-11). El
// portal está en inglés y los documentos del cliente en castellano: sin esto,
// "contingency plan" NO encuentra "plan de contingencia" — mismatch de idioma,
// no de léxico. Se expande cada término con su equivalente en el otro idioma
// antes de puntuar. Bidireccional: cada par se registra en los dos sentidos.
const BILINGUAL_PAIRS: Array<[string, string]> = [
  ['contingencia', 'contingency'], ['licitacion', 'tender'], ['pliego', 'tender'],
  ['memoria', 'proposal'], ['propuesta', 'proposal'], ['presupuesto', 'budget'],
  ['tarifa', 'pricing'], ['precio', 'price'], ['entrega', 'delivery'],
  ['recogida', 'pickup'], ['transporte', 'transport'], ['mensajeria', 'courier'],
  ['muestra', 'sample'], ['muestras', 'samples'], ['flota', 'fleet'],
  ['conductor', 'driver'], ['calidad', 'quality'], ['certificacion', 'certification'],
  ['seguridad', 'safety'], ['incidencia', 'incident'], ['trazabilidad', 'tracking'],
  ['cliente', 'client'], ['audiencia', 'audience'], ['competencia', 'competitor'],
  ['competidor', 'competitor'], ['marca', 'brand'], ['contenido', 'content'],
  ['publicacion', 'post'], ['campana', 'campaign'], ['estrategia', 'strategy'],
  ['plan', 'plan'], ['valores', 'values'], ['mision', 'mission'],
  ['vision', 'vision'], ['servicio', 'service'], ['producto', 'product'],
  ['equipo', 'team'], ['personal', 'staff'], ['almacen', 'warehouse'],
  ['logistica', 'logistics'], ['reparto', 'distribution'], ['factura', 'invoice'],
  ['facturacion', 'billing'], ['informe', 'report'], ['auditoria', 'audit'],
  ['puesta', 'launch'], ['marcha', 'launch'], ['compromiso', 'commitment'],
  ['referencia', 'reference'], ['hospital', 'hospital'], ['internacional', 'international'],
  ['nacional', 'national'],
]
const BILINGUAL: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {}
  const add = (k: string, v: string) => { (m[k] ??= []).push(v) }
  for (const [es, en] of BILINGUAL_PAIRS) { add(es, en); add(en, es) }
  return m
})()

/** Palabras con carga temática de la petición: ≥4 letras y fuera de la lista. */
function queryTerms(query?: string | null): string[] {
  if (!query?.trim()) return []
  const base = fold(query)
    .split(/[^a-zñ0-9]+/)
    .filter((w) => w.length >= 4 && !QUERY_STOPWORDS.has(w))
  const expanded = base.flatMap((w) => [w, ...(BILINGUAL[w] ?? [])])
  return [...new Set(expanded)]
}

/**
 * Ordena los documentos largos por cuántos términos de la petición contienen y
 * DESCARTA los que no contienen ninguno. Dos reglas medidas el 2026-08-10:
 *
 * 1. Un término que aparece en más de la mitad de los documentos no distingue
 *    nada y se ignora — sin esto, "mensajeros" (el nombre de la marca) hacía
 *    que un post de Instagram arrastrara las 51 secciones de memoria técnica.
 * 2. CON query, el gate es estricto: si ningún término útil casa, no entra
 *    ningún documento (una petición de contenido no paga peaje). SIN query
 *    (llamadores que no la pasan), recencia: el comportamiento de siempre.
 *
 * Es coincidencia literal de palabras, no semántica: "plan de contingencia"
 * encuentra la sección; "qué hago si enferma un conductor" no la encontraría.
 */
const wordsOf = (s: string) => new Set(fold(s).split(/[^a-zñ0-9]+/).filter(Boolean))

/**
 * Palabra completa, o prefijo si ambas partes tienen ≥5 letras (cubre plurales
 * y derivados: pliego/pliegos, salsa/salsas). Nunca subcadena suelta — "post"
 * casaba con "postales" y colaba un CV en un post de Instagram.
 */
function termMatches(term: string, words: Set<string>): boolean {
  if (words.has(term)) return true
  if (term.length < 5) return false
  for (const w of words) {
    if (w.length >= 5 && (w.startsWith(term) || term.startsWith(w))) return true
  }
  return false
}

function rankDocumentsByQuery(docs: KnowledgeItem[], query?: string | null): KnowledgeItem[] {
  if (!query?.trim()) return docs
  const terms = queryTerms(query)
  if (!terms.length) return []
  const bodies = docs.map((item) => wordsOf(`${item.title ?? ''}\n${item.content ?? ''}`))
  const titles = docs.map((item) => wordsOf(item.title ?? ''))
  const useful = terms.filter((t) => {
    const df = bodies.filter((w) => termMatches(t, w)).length
    return df > 0 && df <= Math.max(1, docs.length / 2)
  })
  if (!useful.length) return []
  return docs
    .map((item, i) => ({
      item,
      // El término en el TÍTULO de la sección vale doble: es su tema, no una mención.
      score: useful.reduce((s, t) => s + (termMatches(t, bodies[i]) ? 1 : 0) + (termMatches(t, titles[i]) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item)
}

const SOURCE_LABEL: Record<KnowledgeItem['source'], string> = {
  drive: 'Drive',
  upload_chat: 'Subido en chat',
  upload: 'Documentation',
  reference: 'Referencia',
}

export function isKnowledgeUnified(): boolean {
  return process.env.KNOWLEDGE_UNIFIED !== '0'
}

function rank(item: KnowledgeItem, projectId?: string | null, agentRole?: string | null): number {
  let score = 0
  if (projectId && item.project_id === projectId) score += 100
  if (agentRole && item.agent_role && (item.agent_role === agentRole || item.agent_role === 'general')) score += 10
  return score
}

function excerpt(item: KnowledgeItem, max: number, kind: KnowledgeKind): string {
  // En una tabla y en un documento largo, el valor ESTÁ en el contenido: el
  // resumen de IA describe la pieza pero se come justo lo que se quería (los
  // precios de una hoja, el párrafo reutilizable de una memoria). Se invierte
  // la preferencia y no se colapsan los saltos de línea, que aquí son las filas
  // de la tabla y la estructura de secciones del documento.
  if (kind === 'tabular' || kind === 'document') {
    const body = (item.content?.trim() || item.summary?.trim() || '')
    return body.slice(0, max)
  }
  const body = (item.summary?.trim() || item.content?.trim() || '').replace(/\s+/g, ' ')
  return body.slice(0, max)
}

/**
 * Bloque de contexto de conocimiento listo para prompt, o null si el sistema
 * unificado está apagado o la vista aún no existe (pre-0052).
 */
export async function getKnowledgeContext(
  clientId: string,
  opts: KnowledgeContextOptions = {}
): Promise<string | null> {
  if (!isKnowledgeUnified()) return null
  const {
    projectId = null,
    agentRole = null,
    charBudget = 4000,
    structuredBudget = 10000,
    documentBudget = 12000,
    query = null,
    fetchLimit = 40,
  } = opts

  try {
    const admin = adminClient()
    const { data, error } = await admin
      .from('knowledge_items')
      .select('id, client_id, project_id, source, agent_role, title, summary, content, url, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    if (error || !data?.length) return error ? null : ''

    const items = (data as KnowledgeItem[])
      .filter((i) => (i.title?.trim() || i.summary?.trim() || i.content?.trim()))
      .sort((a, b) => rank(b, projectId, agentRole) - rank(a, projectId, agentRole))

    // Tres pasadas con cupos independientes: primero las hojas de cálculo (son
    // pocas y muy densas), después los documentos largos —elegidos por lo que
    // se está pidiendo, no por fecha— y al final la prosa corta con su
    // presupuesto intacto. Si compartieran cupo, un menú largo o una memoria
    // técnica dejarían fuera al brand book.
    const lines: string[] = []
    const render = (list: KnowledgeItem[], budget: number) => {
      let used = 0
      for (const item of list) {
        const kind = kindOf(item)
        const perItem = Math.min(PER_ITEM[kind], budget - used)
        if (perItem < 120) break
        const tag = item.project_id && item.project_id === projectId ? ' · from THIS project' : ''
        const head = `- [${SOURCE_LABEL[item.source]}${tag}] ${item.title || 'Untitled'}: `
        const line = head + excerpt(item, perItem - head.length, kind)
        lines.push(line)
        used += line.length
        if (used >= budget) break
      }
    }
    const ofKind = (kinds: KnowledgeKind[]) => items.filter((i) => kinds.includes(kindOf(i)))
    render(ofKind(['tabular']), structuredBudget)
    render(rankDocumentsByQuery(ofKind(['document']), query), documentBudget)
    render(ofKind(['image', 'prose']), charBudget)
    if (!lines.length) return ''

    return `CLIENT KNOWLEDGE (documents, Drive and references — real sources, cite them when you use them):\n${lines.join('\n')}`
  } catch {
    return null
  }
}
