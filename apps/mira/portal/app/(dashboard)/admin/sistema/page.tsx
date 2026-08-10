'use client'

import AgentWorkspace from '@/components/agent-workspace'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import Card from '@/components/ui/Card'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { useEffect, useState } from 'react'
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

// El roster REAL desde los metadatos — antes había 11 agentes con estados
// working/idle/waiting inventados (auditoría 08-10). Sin telemetría en vivo,
// no se pinta estado: solo el equipo desplegado.
const ALL_AGENTS = [
  ...MARKETING_DEPT_AGENTS,
  ...COMERCIAL_DEPT_AGENTS,
  ...STRATEGY_DEPT_AGENTS,
  ...OPERACIONES_DEPT_AGENTS,
  ...FINANZAS_DEPT_AGENTS,
]

export default function Page() {
  const { locale } = useLocaleContext()
  // Clientes REALES desde el overview de agencia — la clave stats.clients no
  // existía en department-stats y el tile decía 0; el uptime 99.2% era un
  // literal inventado (auditoría 08-10).
  const [clientCount, setClientCount] = useState<number | null>(null)
  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setClientCount(typeof d?.clients === 'number' ? d.clients : null))
      .catch(() => setClientCount(null))
  }, [])

  const SYSTEM_METRICS = [
    { label: 'admin.system.total-agents', value: String(TOTAL_AGENTS), delta: 'Across all depts' },
    { label: 'admin.system.total-depts', value: String(TOTAL_DEPARTMENTS), delta: 'Active teams' },
    { label: 'admin.system.clients-connected', value: clientCount === null ? '—' : String(clientCount), delta: 'Using MIRA' },
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
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-4 text-ink-muted">
          {t('admin.system.agent-status', locale)}
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_AGENTS.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-line"
            >
              <span className="text-sm leading-none">{a.emoji}</span>
              <span className="text-[11px] text-ink">{a.name}</span>
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
