import { createServiceRoleClient } from '@sf/supabase'

function getAdminClient() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface MemoryEntry {
  id: string
  title: string
  category: string
  summary: string
  source_department: string
  is_pinned: boolean
  created_at: string
  project_id?: string | null
}

/**
 * Contexto de memoria para prompts. Con `projectId`, prioriza la memoria de
 * ESE proyecto (más las entradas globales del cliente sin proyecto) — antes
 * la memoria era ciega a proyectos y las generaciones de un proyecto se
 * contaminaban con las memorias de todos los demás.
 */
export async function getClientMemoryContext(
  clientId: string,
  projectId?: string | null
): Promise<string> {
  const db = getAdminClient()

  let query = db
    .from('project_memory')
    .select('id, title, category, summary, source_department, is_pinned, created_at, project_id')
    .eq('client_id', clientId)
    // Sin este filtro, archivar una memoria desde /project-memory la quitaba
    // del visor (que sí filtra, app/api/project-memory/route.ts:24) pero la
    // seguía inyectando en el prompt de TODOS los agentes: el usuario creía
    // haberla retirado y seguía influyendo en cada generación.
    .eq('is_archived', false)

  if (projectId) {
    // Memoria del proyecto + memoria global del cliente (sin proyecto)
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data, error } = await query
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) {
    return ''
  }

  let entries = data as MemoryEntry[]
  // Con proyecto: dentro del límite, las entradas del proyecto van primero
  if (projectId) {
    entries = [...entries].sort((a, b) => {
      if (Number(b.is_pinned) !== Number(a.is_pinned)) return Number(b.is_pinned) - Number(a.is_pinned)
      const aP = a.project_id === projectId ? 1 : 0
      const bP = b.project_id === projectId ? 1 : 0
      if (bP !== aP) return bP - aP
      return b.created_at.localeCompare(a.created_at)
    })
  }

  const formatted = entries
    .map((e) => `- [${e.category}] ${e.title} (${e.source_department}): ${e.summary}${e.is_pinned ? ' ⭐' : ''}`)
    .join('\n')

  return `
## CLIENT MEMORY — past interactions

${formatted}
`.trim()
}
