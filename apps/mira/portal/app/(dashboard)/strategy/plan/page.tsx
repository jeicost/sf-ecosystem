'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AgentWorkspace from '@/components/agent-workspace'
import ToolRunnerPage from '@/components/ToolRunnerPage'
import { createClient } from '@/lib/supabase'
import { getStoredProjectId } from '@/lib/project-context'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t, Locale } from '@/lib/i18n'
import { getActionPlanConfig } from '../../toolkit/action-plan/tool-config'
import { ActionPlanResult } from '../../toolkit/action-plan/action-plan-result'
import { getCompetitiveConfig } from '../../toolkit/competitive-analysis/tool-config'
import { CompetitiveAnalysisResult } from '../../toolkit/competitive-analysis/competitive-analysis-result'

// Plan & Competitive (2026-07-28): el hub de Strategy absorbe los dos reports
// de estrategia — el runner completo de cada uno + su histórico — y mantiene
// el chat con Strategos debajo. Sustituye al antiguo chat-solo "90-Day Plan".

type Tab = 'plan' | 'competencia'
const TAB_SLUG: Record<Tab, string> = {
  plan: 'action-plan',
  competencia: 'competitive-analysis',
}

interface HistoryRow {
  id: string
  created_at: string
}

function useToolHistory(clientId: string | undefined, toolSlug: string) {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const fetchRows = useCallback(() => {
    if (!clientId) return
    createClient()
      .from('generation_queue')
      .select('id, created_at')
      .eq('client_id', clientId)
      .eq('tool_slug', toolSlug)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setRows((data as HistoryRow[]) || []))
  }, [clientId, toolSlug])
  useEffect(() => {
    fetchRows()
  }, [fetchRows])
  return rows
}

function HistoryList({ rows, emptyLabel, locale }: { rows: HistoryRow[]; emptyLabel: string; locale: Locale }) {
  if (rows.length === 0) {
    return <p className="text-xs text-ink-tertiary">{emptyLabel}</p>
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={r.id}>
          <Link
            href={`/toolkit/report/${r.id}`}
            className="flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-2.5 text-sm text-ink transition-colors hover:bg-surface-hover"
          >
            <span>{i === 0 ? t('strategy.plan.history-latest', locale) : t('strategy.plan.history-previous', locale)}</span>
            <span className="font-mono text-[11px] text-ink-tertiary">
              {new Date(r.created_at).toLocaleDateString()}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function StrategyPlanPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const [tab, setTab] = useState<Tab>('plan')

  // Deep-link: /strategy/plan?tab=competencia
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t === 'competencia' || t === 'plan') setTab(t)
  }, [])

  const history = useToolHistory(activeClient?.id, TAB_SLUG[tab])

  const makeGenerate = (toolSlug: string) =>
    async (formData: Record<string, any>, attachments?: any[]) => {
      const res = await fetch('/api/toolkit/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_slug: toolSlug,
          input_data: formData,
          attachments,
          project_id: getStoredProjectId(),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || t('strategy.plan.generate-error-fallback', locale))
      }
      return await res.json()
    }

  return (
    <div className="pb-10">
      <div className="px-8 pt-8 max-w-4xl mx-auto">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(99,102,241,0.7)' }}>
          {t('strategy.plan.eyebrow', locale)}
        </p>
        <div className="flex gap-2">
          {([
            ['plan', t('strategy.plan.tab-plan', locale)],
            ['competencia', t('strategy.plan.tab-competencia', locale)],
          ] as Array<[Tab, string]>).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-ink text-page'
                  : 'bg-surface text-ink-secondary hover:bg-surface-hover hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'plan' ? (
        <ToolRunnerPage
          config={getActionPlanConfig(locale)}
          onGenerate={makeGenerate('action-plan')}
          resultComponent={ActionPlanResult}
        />
      ) : (
        <ToolRunnerPage
          config={getCompetitiveConfig(locale)}
          onGenerate={makeGenerate('competitive-analysis')}
          resultComponent={CompetitiveAnalysisResult}
        />
      )}

      <div className="px-8 max-w-4xl mx-auto mt-2">
        <h2 className="text-sm font-semibold text-ink mb-3">{t('strategy.plan.history-title', locale)}</h2>
        <HistoryList
          rows={history}
          locale={locale}
          emptyLabel={
            tab === 'plan'
              ? t('strategy.plan.history-empty-plan', locale)
              : t('strategy.plan.history-empty-competencia', locale)
          }
        />
      </div>

      <div className="px-8 max-w-4xl mx-auto mt-12 border-t border-line pt-10">
        <h2 className="text-sm font-semibold text-ink mb-1">{t('strategy.plan.chat-title', locale)}</h2>
        <p className="text-xs text-ink-tertiary mb-4">
          {t('strategy.plan.chat-subtitle', locale)}
        </p>
        <AgentWorkspace
          role="strategos"
          agentName="Strategos"
          agentEmoji="🔭"
          color="#6366F1"
          gradient="from-indigo-500 to-violet-700"
          title={t('strategy.plan.agent-title', locale)}
          description={t('strategy.plan.agent-description', locale)}
          placeholder={t('strategy.plan.agent-placeholder', locale)}
          quickPrompts={[
            { label: t('strategy.plan.quick-prompt-1-label', locale), prompt: t('strategy.plan.quick-prompt-1-text', locale) },
            { label: t('strategy.plan.quick-prompt-2-label', locale), prompt: t('strategy.plan.quick-prompt-2-text', locale) },
            { label: t('strategy.plan.quick-prompt-3-label', locale), prompt: t('strategy.plan.quick-prompt-3-text', locale) },
            { label: t('strategy.plan.quick-prompt-4-label', locale), prompt: t('strategy.plan.quick-prompt-4-text', locale) },
          ]}
        />
      </div>
    </div>
  )
}
