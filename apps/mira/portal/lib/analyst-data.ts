import type { adminClient } from '@/lib/supabase'
import { WorkspaceStatus, workspaceError } from '@/lib/archetype-workspace'

export interface AnalystResult {
  id: string
  rank: number
  score: number
  name: string
  subtitle: string
  metrics: string[]
  triggers?: string[]
}

export interface AnalystData {
  totalCount: number
  hotCount: number
  warmCount: number
  coldCount: number
  results: AnalystResult[]
  // Labels for the 3 tiers -- default hot/warm/cold for leads, overridden
  // for atlas (competitive-analysis has no "temperature", it has priority).
  tierLabels: { hot: string; warm: string; cold: string }
  viewFullReportUrl?: string
}

const LEADS_ROLES = new Set(['icp-scorer', 'reply-qualifier'])

async function fetchLeadsAnalyst(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<AnalystData>> {
  const { data, error } = await admin
    .from('leads')
    .select('id, company_name, geography, industry, hot_score, bant_score, company_news, stage')
    .eq('client_id', clientId)
    .order('hot_score', { ascending: false, nullsFirst: false })
    .limit(30)

  if (error) return workspaceError(error.message)
  if (!data || data.length === 0) return { status: 'empty' }

  const results: AnalystResult[] = data.map((lead, idx) => {
    const score = Math.round(Number(lead.hot_score ?? lead.bant_score ?? 0))
    return {
      id: lead.id as string,
      rank: idx + 1,
      score,
      name: (lead.company_name as string) || 'Sin nombre',
      subtitle: (lead.geography as string) || '',
      metrics: [lead.industry, lead.stage].filter(Boolean) as string[],
      triggers: lead.company_news ? [lead.company_news as string] : undefined,
    }
  })

  const hotCount = results.filter((r) => r.score >= 75).length
  const warmCount = results.filter((r) => r.score >= 50 && r.score < 75).length
  const coldCount = results.filter((r) => r.score < 50).length

  return {
    status: 'ready',
    data: {
      totalCount: results.length,
      hotCount,
      warmCount,
      coldCount,
      results,
      tierLabels: { hot: 'archetype.analyst.hot', warm: 'archetype.analyst.warm', cold: 'archetype.analyst.cold' },
    },
  }
}

async function fetchAtlasAnalyst(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<AnalystData>> {
  const { data, error } = await admin
    .from('generation_queue')
    .select('id, result_data, created_at')
    .eq('client_id', clientId)
    .eq('tool_slug', 'competitive-analysis')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) return workspaceError(error.message)
  const row = data?.[0]
  const takeaways = (row?.result_data as Record<string, unknown> | undefined)?.key_takeaways as
    | Record<string, unknown>
    | undefined
  if (!row || !takeaways) return { status: 'empty' }

  const toResults = (arr: unknown, baseScore: number): AnalystResult[] =>
    Array.isArray(arr)
      ? arr.map((item, idx) => ({
          id: `${row.id}-${baseScore}-${idx}`,
          rank: idx + 1,
          score: baseScore - idx * 3,
          name: typeof item === 'string' ? item.split('(')[0].trim() : String(item),
          subtitle: typeof item === 'string' && item.includes('(') ? item.split('(')[1]?.replace(')', '') ?? '' : '',
          metrics: [],
        }))
      : []

  const competitors = toResults(takeaways.top_3_competitors, 90)
  const opportunities = toResults(takeaways.top_3_opportunities, 60)
  const differentiation = toResults(takeaways.top_3_differentiation, 30)
  const results = [...competitors, ...opportunities, ...differentiation]
  if (results.length === 0) return { status: 'empty' }

  return {
    status: 'ready',
    data: {
      totalCount: results.length,
      hotCount: competitors.length,
      warmCount: opportunities.length,
      coldCount: differentiation.length,
      results,
      tierLabels: { hot: 'Competencia', warm: 'Oportunidades', cold: 'Diferenciación' },
      viewFullReportUrl: `/toolkit/report/${row.id}`,
    },
  }
}

export async function fetchAnalystData(
  admin: ReturnType<typeof adminClient>,
  clientId: string,
  role: string
): Promise<WorkspaceStatus<AnalystData>> {
  if (LEADS_ROLES.has(role)) return fetchLeadsAnalyst(admin, clientId)
  if (role === 'atlas') return fetchAtlasAnalyst(admin, clientId)
  // ads-manager, quant, fiscal: no real "scored companies" data exists for
  // these roles (confirmed with the user) -- honest empty, never invented.
  return { status: 'empty' }
}
