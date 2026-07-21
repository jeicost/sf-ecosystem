'use client'

import { useEffect, useState } from 'react'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface UsageSummary {
  month: string
  generations: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  using_own_key: boolean
  images?: {
    generations: number
    cost_usd: number
  }
  total_cost_usd?: number
}

// Consumo de IA del mes del cliente activo — transparencia BYO-key
export default function UsageCard({ clientId }: { clientId: string }) {
  const { locale } = useLocaleContext()
  const [usage, setUsage] = useState<UsageSummary | null>(null)

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/usage/summary?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsage)
      .catch(() => {})
  }, [clientId])

  if (!usage) return null

  const totalTokens = usage.input_tokens + usage.output_tokens
  const totalCostUsd = usage.total_cost_usd ?? usage.cost_usd

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-tertiary">
            {t('integrations.usage.title', locale)} · {usage.month}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">
            {usage.generations}{' '}
            <span className="text-sm font-medium text-ink-secondary">
              {t('integrations.usage.generations', locale)}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-tertiary">
            {(totalTokens / 1000).toFixed(1)}k tokens · ~${usage.cost_usd.toFixed(2)} USD
          </p>
          {usage.images && (
            <p className="mt-1 text-xs text-ink-tertiary">
              {t('integrations.usage.images-row', locale)}: {usage.images.generations} · ~$
              {usage.images.cost_usd.toFixed(2)} USD
            </p>
          )}
          <p className="mt-2 text-xs font-semibold text-ink">
            {t('integrations.usage.total', locale)}: ~${totalCostUsd.toFixed(2)} USD
          </p>
        </div>
        <div className="text-right">
          {usage.using_own_key ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold text-emerald-400">
              {t('integrations.usage.own-key', locale)}
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-semibold text-amber-400">
              {t('integrations.usage.platform-key', locale)}
            </span>
          )}
          {!usage.using_own_key && (
            <p className="mt-2 max-w-[180px] text-[10px] leading-relaxed text-ink-tertiary">
              {t('integrations.usage.connect-key-hint', locale)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
