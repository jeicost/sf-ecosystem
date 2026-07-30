import type { adminClient } from '@/lib/supabase'
import { WorkspaceStatus, workspaceError } from '@/lib/archetype-workspace'

export interface ExplorerResult {
  id: string
  name: string
  tier: 'HOT' | 'WARM' | 'COLD'
  score: number
  signal: string
  jurisdiction?: string
  industry?: string
}

export interface ExplorerData {
  hot: ExplorerResult[]
  warm: ExplorerResult[]
  cold: ExplorerResult[]
}

// Explorer archetype: lead-scout (Rex) only. Real prospecting leads,
// hot/warm/cold buckets from the same `leads` table Analyst uses.
export async function fetchExplorerData(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<ExplorerData>> {
  const { data, error } = await admin
    .from('leads')
    .select('id, company_name, geography, industry, hot_score, bant_score, company_news, source')
    .eq('client_id', clientId)
    .order('hot_score', { ascending: false, nullsFirst: false })
    .limit(30)

  if (error) return workspaceError(error.message)
  if (!data || data.length === 0) return { status: 'empty' }

  const toResult = (lead: (typeof data)[number]): ExplorerResult => {
    const score = Math.round(Number(lead.hot_score ?? lead.bant_score ?? 0))
    return {
      id: lead.id as string,
      name: (lead.company_name as string) || 'Sin nombre',
      tier: score >= 75 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD',
      score,
      signal: (lead.company_news as string) || (lead.source as string) || '',
      jurisdiction: (lead.geography as string) || undefined,
      industry: (lead.industry as string) || undefined,
    }
  }

  const results = data.map(toResult)
  return {
    status: 'ready',
    data: {
      hot: results.filter((r) => r.tier === 'HOT'),
      warm: results.filter((r) => r.tier === 'WARM'),
      cold: results.filter((r) => r.tier === 'COLD'),
    },
  }
}
