import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
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
}

export async function getClientMemoryContext(clientId: string): Promise<string> {
  const db = getAdminClient()

  const { data, error } = await db
    .from('project_memory')
    .select('id, title, category, summary, source_department, is_pinned, created_at')
    .eq('client_id', clientId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data || data.length === 0) {
    return ''
  }

  const entries = data as MemoryEntry[]
  const formatted = entries
    .map((e) => `- [${e.category}] ${e.title} (${e.source_department}): ${e.summary}${e.is_pinned ? ' ⭐' : ''}`)
    .join('\n')

  return `
## MEMORIA DE CLIENTE — Interacciones Pasadas

${formatted}
`.trim()
}
