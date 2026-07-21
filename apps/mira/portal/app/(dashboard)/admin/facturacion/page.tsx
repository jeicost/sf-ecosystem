'use client'

import { AlertTriangle } from 'lucide-react'
import AgentWorkspace from '@/components/agent-workspace'
import PageHeader from '@/components/ui/PageHeader'
import StatRow from '@/components/ui/StatRow'
import Card from '@/components/ui/Card'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

const PNL = [
  { label: 'admin.billing.mrr', value: '$4,800', delta: '+$1,200', color: '#22C55E' },
  { label: 'admin.billing.ai-costs', value: '$190', delta: 'APIs + tools', color: '#F59E0B' },
  { label: 'admin.billing.net-margin', value: '75%', delta: 'After all costs', color: '#6366F1' },
  { label: 'admin.billing.overdue', value: '1', delta: 'Day 7 — follow up', color: '#EF4444' },
]

const CLIENTS = [
  { name: 'Salsa Burgers', mrr: '$1,200', status: 'paid', daysAgo: 3 },
  { name: 'Discoolver', mrr: '$1,800', status: 'paid', daysAgo: 5 },
  { name: 'NC Global', mrr: '$900', status: 'overdue', daysAgo: 7 },
  { name: 'Jacoste', mrr: '$900', status: 'pending', daysAgo: 0 },
]

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  paid: { label: 'admin.billing.status-paid', bg: '#10B98120', text: '#10B981cc' },
  overdue: { label: 'admin.billing.status-overdue', bg: '#EF444420', text: '#EF4444cc' },
  pending: { label: 'admin.billing.status-pending', bg: '#F59E0B20', text: '#F59E0Bcc' },
}

export default function Page() {
  const { locale } = useLocaleContext()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin · Ledger"
        title={t('admin.billing.title', locale)}
        subtitle={t('admin.billing.subtitle', locale)}
        eyebrowColor="#6366F1"
      />

      {/* WARNING BANNER: Sample data only */}
      <Card radius="hero" padding="md">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#F59E0B' }} />
          <div>
            <p className="font-semibold text-white mb-1">{t('admin.billing.sample-warning', locale)}</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {t('admin.billing.sample-desc', locale)}
            </p>
          </div>
        </div>
      </Card>

      {/* P&L summary — using StatRow */}
      <StatRow
        items={PNL.map((item) => ({
          label: t(item.label, locale),
          value: item.value,
          hint: item.delta,
        }))}
      />

      {/* Client billing table */}
      <Card radius="hero" padding="lg">
        <div
          className="px-1 py-3 flex items-center justify-between mb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span
            className="text-[10px] uppercase tracking-widest font-semibold"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {t('admin.billing.client-billing', locale)}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {t('admin.billing.current-month', locale)}
          </span>
        </div>
        {CLIENTS.map((client, i) => {
          const s = STATUS_CONFIG[client.status as keyof typeof STATUS_CONFIG]
          return (
            <div
              key={client.name}
              className="px-1 py-4 flex items-center justify-between"
              style={{
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: i < CLIENTS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <div>
                <p className="text-sm font-medium text-white">{client.name}</p>
                {client.status === 'overdue' && (
                  <p className="text-[10px]" style={{ color: '#EF4444' }}>
                    Day {client.daysAgo} overdue — follow up
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-white">{client.mrr}</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: s.bg, color: s.text }}>
                  {t(s.label, locale)}
                </span>
              </div>
            </div>
          )
        })}
      </Card>

      <AgentWorkspace
        role="fiscal"
        agentName="Ledger"
        agentEmoji="💳"
        color="#6366F1"
        gradient="from-indigo-500 to-violet-700"
        title="Billing & financial management"
        description="Ask Ledger about invoices, payments, P&L or financial health of any client."
        placeholder="E.g.: This month I billed $15k, collected $11k. 2 clients have invoices overdue 30+ days. How do I manage collections and what's my real P&L?"
        quickPrompts={[
          { label: '📊 Monthly agency P&L', prompt: 'Help me calculate the monthly P&L of my agency. Revenue is X, AI API costs are Y, tools Z. What\'s my real margin?' },
          { label: '🚨 Overdue payment protocol', prompt: 'What\'s the right strategy to manage overdue payments without damaging the client relationship? Give me the protocol for day 3, 15 and 30.' },
          { label: '💰 Cost control per client', prompt: 'Explain how to create a cost control system per client for an AI agency. I want to know exactly how much it costs to serve each client.' },
          { label: '📈 Improve my margins', prompt: 'How can I improve my agency margins from 60% to 75%? Give me the 3 highest-impact levers to pull this quarter.' },
        ]}
      />
    </div>
  )
}
