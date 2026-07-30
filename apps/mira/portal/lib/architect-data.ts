import type { adminClient } from '@/lib/supabase'
import { WorkspaceStatus, workspaceError } from '@/lib/archetype-workspace'

export interface ArchitectStep {
  id: string
  number: number
  title: string
  description: string
  isCompleted: boolean
}

export interface ArchitectTemplate {
  id: string
  name: string
  emoji: string
  description: string
  createdAt: string
  reportUrl?: string
  steps: ArchitectStep[]
}

export interface ArchitectData {
  templates: ArchitectTemplate[]
}

type RowLike = Record<string, unknown>

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

// content-strategist, social-media-manager: real Monthly Content System
// output (pillars + weekly board), one template per past generation.
async function fetchMonthlyArchitect(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<ArchitectData>> {
  const { data, error } = await admin
    .from('generation_queue')
    .select('id, result_data, created_at')
    .eq('client_id', clientId)
    .eq('tool_slug', 'monthly-content-system')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) return workspaceError(error.message)
  if (!data || data.length === 0) return { status: 'empty' }

  const templates: ArchitectTemplate[] = data
    .map((row): ArchitectTemplate | null => {
      const result = row.result_data as RowLike | null
      const board = asArray(result?.weekly_board) as RowLike[]
      if (board.length === 0) return null
      const steps: ArchitectStep[] = board.map((week, idx) => {
        const rows = asArray(week.rows) as RowLike[]
        const summary = rows.map((r) => r.working_title).filter(Boolean).join(' · ')
        return {
          id: `${row.id}-w${idx}`,
          number: idx + 1,
          title: (week.theme as string) || `Semana ${(week.week as number) ?? idx + 1}`,
          description: summary || '',
          isCompleted: false,
        }
      })
      return {
        id: row.id as string,
        name: `Mes ${result?.month ?? ''}`.trim(),
        emoji: '📆',
        description: (result?.dormant_note as string) || '',
        createdAt: row.created_at as string,
        reportUrl: `/toolkit/report/${row.id}`,
        steps,
      }
    })
    .filter((t): t is ArchitectTemplate => t !== null)

  if (templates.length === 0) return { status: 'empty' }
  return { status: 'ready', data: { templates } }
}

// strategos, blueprint: real action-plan (30/60/90) output. Phase keys are
// scanned generically (e.g. "60_day_push") since the exact set of phases can
// vary between generations.
async function fetchActionPlanArchitect(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<ArchitectData>> {
  const { data, error } = await admin
    .from('generation_queue')
    .select('id, result_data, created_at')
    .eq('client_id', clientId)
    .eq('tool_slug', 'action-plan')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) return workspaceError(error.message)
  if (!data || data.length === 0) return { status: 'empty' }

  const templates: ArchitectTemplate[] = data
    .map((row): ArchitectTemplate | null => {
      const result = row.result_data as RowLike | null
      if (!result) return null
      const phaseKeys = Object.keys(result)
        .filter((k) => /_day_push$|_push$/.test(k))
        .sort()
      if (phaseKeys.length === 0) return null

      const steps: ArchitectStep[] = phaseKeys.map((key, idx) => {
        const phase = result[key] as RowLike
        const actions = asArray(phase?.actions) as RowLike[]
        const actionSummary = actions.map((a) => a.title).filter(Boolean).join(' · ')
        return {
          id: `${row.id}-${key}`,
          number: idx + 1,
          title: key.replace(/_/g, ' '),
          description: (phase?.focus as string) || actionSummary || '',
          isCompleted: false,
        }
      })

      return {
        id: row.id as string,
        name: 'Plan de Acción 30/60/90',
        emoji: '🎯',
        description: asArray(result.kpis).length > 0 ? `${asArray(result.kpis).length} KPIs definidos` : '',
        createdAt: row.created_at as string,
        reportUrl: `/toolkit/report/${row.id}`,
        steps,
      }
    })
    .filter((t): t is ArchitectTemplate => t !== null)

  if (templates.length === 0) return { status: 'empty' }
  return { status: 'ready', data: { templates } }
}

// proposal-writer / Nova: historical crear_propuesta results. The button to
// create NEW ones was removed 2026-07-27 (orphaned quick action), but past
// results are real and stay in quick_actions_results.
async function fetchProposalArchitect(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<ArchitectData>> {
  const { data, error } = await admin
    .from('quick_actions_results')
    .select('id, output_data, created_at')
    .eq('client_id', clientId)
    .eq('action_type', 'crear_propuesta')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return workspaceError(error.message)
  if (!data || data.length === 0) return { status: 'empty' }

  const templates: ArchitectTemplate[] = data
    .map((row): ArchitectTemplate | null => {
      const out = row.output_data as RowLike | null
      const summary = out?.executive_summary as string | undefined
      if (!summary) return null // rows with empty output_data (early test runs) are skipped
      const nextSteps = asArray(out?.next_steps) as string[]
      const steps: ArchitectStep[] = nextSteps.map((s, idx) => ({
        id: `${row.id}-step${idx}`,
        number: idx + 1,
        title: s,
        description: '',
        isCompleted: false,
      }))
      return {
        id: row.id as string,
        name: summary.slice(0, 60) + (summary.length > 60 ? '…' : ''),
        emoji: '📄',
        description: summary,
        createdAt: row.created_at as string,
        steps,
      }
    })
    .filter((t): t is ArchitectTemplate => t !== null)

  if (templates.length === 0) return { status: 'empty' }
  return { status: 'ready', data: { templates } }
}

// midas: real proyeccion_financiera results, monthly breakdown mapped to steps.
async function fetchFinancialArchitect(
  admin: ReturnType<typeof adminClient>,
  clientId: string
): Promise<WorkspaceStatus<ArchitectData>> {
  const { data, error } = await admin
    .from('quick_actions_results')
    .select('id, output_data, created_at')
    .eq('client_id', clientId)
    .eq('action_type', 'proyeccion_financiera')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) return workspaceError(error.message)
  if (!data || data.length === 0) return { status: 'empty' }

  const templates: ArchitectTemplate[] = data
    .map((row): ArchitectTemplate | null => {
      const out = row.output_data as RowLike | null
      const months = asArray(out?.months ?? out?.projections ?? out?.monthly_breakdown) as RowLike[]
      if (months.length === 0) return null
      const steps: ArchitectStep[] = months.map((m, idx) => ({
        id: `${row.id}-m${idx}`,
        number: idx + 1,
        title: (m.month as string) || `Mes ${idx + 1}`,
        description: (m.revenue as string) || (m.summary as string) || '',
        isCompleted: false,
      }))
      return {
        id: row.id as string,
        name: 'Proyección Financiera',
        emoji: '📈',
        description: '',
        createdAt: row.created_at as string,
        steps,
      }
    })
    .filter((t): t is ArchitectTemplate => t !== null)

  if (templates.length === 0) return { status: 'empty' }
  return { status: 'ready', data: { templates } }
}

export async function fetchArchitectData(
  admin: ReturnType<typeof adminClient>,
  clientId: string,
  role: string
): Promise<WorkspaceStatus<ArchitectData>> {
  if (role === 'content-strategist' || role === 'social-media-manager') {
    return fetchMonthlyArchitect(admin, clientId)
  }
  if (role === 'strategos' || role === 'blueprint') {
    return fetchActionPlanArchitect(admin, clientId)
  }
  if (role === 'proposal-writer') {
    return fetchProposalArchitect(admin, clientId)
  }
  if (role === 'midas') {
    return fetchFinancialArchitect(admin, clientId)
  }
  // orchestrator, onboard: no clean per-client "plan + steps" mapping found
  // (orchestrator coordinates across departments -- no single real table for
  // that; onboard's real progress is the admin-wide onboarding wizard, not a
  // per-client-workspace concept) -- honest empty, confirmed with the user.
  return { status: 'empty' }
}
