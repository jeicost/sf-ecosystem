'use client'

import AgentWorkspace from '@/components/agent-workspace'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import Card from '@/components/ui/Card'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useDepartmentStats } from '@/lib/use-department-stats'
import {
  MARKETING_DEPT_AGENTS,
  COMERCIAL_DEPT_AGENTS,
  STRATEGY_DEPT_AGENTS,
  OPERACIONES_DEPT_AGENTS,
  FINANZAS_DEPT_AGENTS,
} from '@/lib/agent-meta'

const TOTAL_AGENTS =
  MARKETING_DEPT_AGENTS.length +
  COMERCIAL_DEPT_AGENTS.length +
  STRATEGY_DEPT_AGENTS.length +
  OPERACIONES_DEPT_AGENTS.length +
  FINANZAS_DEPT_AGENTS.length

const TOTAL_DEPARTMENTS = 5

const AGENT_STATUS = [
  { emoji: '🎬', name: 'Marco', status: 'idle' },
  { emoji: '🔍', name: 'Luna', status: 'working' },
  { emoji: '✍️', name: 'Alex', status: 'idle' },
  { emoji: '🎨', name: 'Zoe', status: 'idle' },
  { emoji: '🎞️', name: 'Kai', status: 'idle' },
  { emoji: '📅', name: 'Noa', status: 'waiting' },
  { emoji: '📣', name: 'Riva', status: 'working' },
  { emoji: '💬', name: 'Sam', status: 'idle' },
  { emoji: '🔍', name: 'Rex', status: 'working' },
  { emoji: '🎯', name: 'Vera', status: 'idle' },
  { emoji: '✍️', name: 'Finn', status: 'idle' },
]

const STATUS_COLORS: Record<string, string> = {
  idle: 'rgba(255,255,255,0.2)',
  working: '#22C55E',
  waiting: '#F59E0B',
}

export default function Page() {
  const { locale } = useLocaleContext()
  const { stats } = useDepartmentStats('operations')

  const SYSTEM_METRICS = [
    { label: 'admin.system.total-agents', value: String(TOTAL_AGENTS), delta: 'Across all depts' },
    { label: 'admin.system.total-depts', value: String(TOTAL_DEPARTMENTS), delta: 'Active teams' },
    { label: 'admin.system.clients-connected', value: String(stats.clients ?? 0), delta: 'Using MIRA' },
    { label: 'admin.system.uptime', value: '99.2%', delta: 'Last 30 days' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Pulse"
        title={t('admin.system.title', locale)}
        subtitle={t('admin.system.subtitle', locale)}
        eyebrowColor="#F59E0B"
      />

      {/* System metrics */}
      <StatRow
        items={SYSTEM_METRICS.map((m) => ({
          label: t(m.label, locale),
          value: m.value,
          hint: m.delta,
        }))}
      />

      {/* Agent status grid */}
      <Card radius="hero" padding="lg">
        <p
          className="text-[10px] uppercase tracking-widest font-semibold mb-4"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {t('admin.system.agent-status', locale)}
        </p>
        <div className="flex flex-wrap gap-2">
          {AGENT_STATUS.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-sm leading-none">{a.emoji}</span>
              <span className="text-[11px] text-white">{a.name}</span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${a.status === 'working' ? 'animate-pulse' : ''}`}
                style={{ background: STATUS_COLORS[a.status] }}
              />
            </div>
          ))}
        </div>
      </Card>

      <AgentWorkspace
        role="pulse"
        agentName="Pulse"
        agentEmoji="💓"
        color="#F59E0B"
        gradient="from-amber-400 to-orange-600"
        title="Monitor system health"
        description="Ask Pulse about uptime, token costs, error logs or workflow status. Real-time visibility."
        placeholder="E.g.: Check the current system health. Are all workflows operational? Any latency spikes or cost anomalies this week?"
        quickPrompts={[
          { label: '💓 Full health check', prompt: 'Do a complete system health check. Status of all agents, workflows, API latency and error rate. Give me a traffic light summary.' },
          { label: '💰 Token costs this week', prompt: 'What are the total AI token costs this week? Break down by agent and identify if any is above budget.' },
          { label: '🚨 Active alerts', prompt: 'Are there any active alerts or anomalies I should know about right now? List them by severity.' },
          { label: '📊 Weekly system report', prompt: 'Generate the weekly system report: uptime, errors caught, cost summary and any recommendations for next week.' },
        ]}
      />
    </div>
  )
}
