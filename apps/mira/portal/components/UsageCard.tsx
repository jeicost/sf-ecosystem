'use client'

import { useEffect, useState } from 'react'

interface UsageSummary {
  month: string
  generations: number
  input_tokens: number
  output_tokens: number
  cost_usd: number
  using_own_key: boolean
}

// Consumo de IA del mes del cliente activo — transparencia BYO-key
export default function UsageCard({ clientId }: { clientId: string }) {
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

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
            Uso de IA · {usage.month}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {usage.generations} <span className="text-sm font-medium text-gray-400">generaciones</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {(totalTokens / 1000).toFixed(1)}k tokens · ~${usage.cost_usd.toFixed(2)} USD
          </p>
        </div>
        <div className="text-right">
          {usage.using_own_key ? (
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold text-emerald-400">
              ✓ Usando tu API key
            </span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-semibold text-amber-400">
              Key de plataforma
            </span>
          )}
          {!usage.using_own_key && (
            <p className="mt-2 max-w-[180px] text-[10px] leading-relaxed text-gray-500">
              Conecta tu API key de Claude (Anthropic) abajo para usar tus propios créditos.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
