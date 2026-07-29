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
  /** Presupuesto de caracteres del bloque final (coste de tokens acotado). */
  charBudget?: number
  /** Máx. de filas a considerar antes del ranking. */
  fetchLimit?: number
}

const SOURCE_LABEL: Record<KnowledgeItem['source'], string> = {
  drive: 'Drive',
  upload_chat: 'Subido en chat',
  upload: 'Documentación',
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

function excerpt(item: KnowledgeItem, max: number): string {
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
  const { projectId = null, agentRole = null, charBudget = 4000, fetchLimit = 40 } = opts

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

    const lines: string[] = []
    let used = 0
    for (const item of items) {
      const perItem = Math.min(420, charBudget - used)
      if (perItem < 120) break
      const tag = item.project_id && item.project_id === projectId ? ' · de ESTE proyecto' : ''
      const line = `- [${SOURCE_LABEL[item.source]}${tag}] ${item.title || 'Sin título'}: ${excerpt(item, perItem - (item.title?.length ?? 0) - 20)}`
      lines.push(line)
      used += line.length
      if (used >= charBudget) break
    }
    if (!lines.length) return ''

    return `CONOCIMIENTO DEL CLIENTE (documentos, Drive y referencias — fuente real, cítala cuando la uses):\n${lines.join('\n')}`
  } catch {
    return null
  }
}
