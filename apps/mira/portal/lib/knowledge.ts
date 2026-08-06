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
  /** Máx. de filas a considerar antes del ranking. */
  fetchLimit?: number
}

/**
 * Tres tipos de conocimiento con presupuestos MUY distintos.
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
 * - `image`: descripción por visión, 4-6 frases (~600 chars). 420 la cortaba
 *   justo antes del estilo visual, que suele ser lo más útil.
 * - `prose`: PDF, docs, notas. El comportamiento de siempre.
 */
type KnowledgeKind = 'tabular' | 'image' | 'prose'

// 8.000 caracteres para una tabla ≈ 2.000 tokens. Es lo que hace falta para que
// quepa ENTERO un menú real: el de Salsa son 58 filas / ~6.800 caracteres, y con
// 3.000 solo llegaban 26 precios de 58 — media tabla sigue siendo una respuesta
// incompleta, y encima sin avisar de que falta la otra mitad. Una fila ya es
// información comprimida (un hecho por línea), así que el coste por carácter
// aquí es mucho más rentable que en prosa. El cupo total (`structuredBudget`)
// acota el caso de varias hojas a la vez; si una tabla no cabe ni así, se corta
// y el modelo ve el aviso de "Rows: N" de la cabecera.
const PER_ITEM: Record<KnowledgeKind, number> = { tabular: 8000, image: 700, prose: 420 }

function kindOf(item: KnowledgeItem): KnowledgeKind {
  const body = item.content?.trimStart() ?? ''
  // Marcadores que emite el extractor de hojas (lib/drive-sync.ts) y el
  // describidor de imágenes (lib/vision.ts).
  if (body.startsWith('## Sheet:') || body.startsWith('Columns:')) return 'tabular'
  if (body.startsWith('[IMAGE]')) return 'image'
  return 'prose'
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
  // En una tabla, el valor ESTÁ en el contenido: el resumen de IA describe la
  // hoja pero se come justo los datos (precios, cantidades). Se invierte la
  // preferencia y no se colapsan los saltos de línea, que son las filas.
  if (kind === 'tabular') {
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

    // Dos pasadas con cupos independientes: las hojas de cálculo primero (son
    // pocas y muy densas), y después la prosa con su presupuesto intacto. Si
    // compartieran cupo, un menú largo dejaría fuera al brand book.
    const lines: string[] = []
    const render = (kinds: KnowledgeKind[], budget: number) => {
      let used = 0
      for (const item of items) {
        const kind = kindOf(item)
        if (!kinds.includes(kind)) continue
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
    render(['tabular'], structuredBudget)
    render(['image', 'prose'], charBudget)
    if (!lines.length) return ''

    return `CLIENT KNOWLEDGE (documents, Drive and references — real sources, cite them when you use them):\n${lines.join('\n')}`
  } catch {
    return null
  }
}
