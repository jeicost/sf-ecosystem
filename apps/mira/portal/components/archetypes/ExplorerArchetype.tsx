'use client'
import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, ArrowRight, Compass } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { ExplorerResult, ExplorerData } from '@/lib/explorer-data'

interface ExplorerArchetypeProps {
  agentColor: string
  status?: 'loading' | 'ready' | 'empty' | 'error'
  errorMessage?: string
  data?: ExplorerData
}

const getTierColor = (tier: 'HOT' | 'WARM' | 'COLD') => {
  switch (tier) {
    case 'HOT':
      return { bg: '#DC262630', text: '#EF4444', emoji: '🔥', labelKey: 'archetype.analyst.hot' }
    case 'WARM':
      return { bg: '#F59E0B30', text: '#F59E0B', emoji: '🟡', labelKey: 'archetype.analyst.warm' }
    case 'COLD':
      return { bg: '#3B82F630', text: '#3B82F6', emoji: '🔵', labelKey: 'archetype.analyst.cold' }
  }
}

export default function ExplorerArchetype({ agentColor, status = 'ready', errorMessage, data }: ExplorerArchetypeProps) {
  const { locale } = useLocaleContext()
  const [selectedResult, setSelectedResult] = useState<ExplorerResult | null>(null)
  const [expandedTier, setExpandedTier] = useState<'HOT' | 'WARM' | 'COLD' | null>('HOT')
  const [keyword, setKeyword] = useState('')

  const filterFn = (r: ExplorerResult) => {
    if (!keyword.trim()) return true
    const q = keyword.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      (r.industry || '').toLowerCase().includes(q) ||
      (r.jurisdiction || '').toLowerCase().includes(q)
    )
  }

  const hot = useMemo(() => (data?.hot ?? []).filter(filterFn), [data, keyword])
  const warm = useMemo(() => (data?.warm ?? []).filter(filterFn), [data, keyword])
  const cold = useMemo(() => (data?.cold ?? []).filter(filterFn), [data, keyword])

  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        <div className="md:col-span-2 h-64 rounded-lg bg-surface" />
        <div className="h-64 rounded-lg bg-surface" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <div className="text-sm text-ink font-medium">{t('agent.workspace.error-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{errorMessage || t('agent.workspace.error-desc', locale)}</div>
      </div>
    )
  }

  if (status === 'empty' || !data || hot.length + warm.length + cold.length === 0) {
    const isFiltered = keyword.trim().length > 0 && data && data.hot.length + data.warm.length + data.cold.length > 0
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <Compass size={24} className="mx-auto text-ink-tertiary mb-2" />
        <div className="text-sm text-ink font-medium">
          {isFiltered ? 'No results for that filter' : t('archetype.explorer.empty-title', locale)}
        </div>
        {!isFiltered && <div className="text-xs text-ink-tertiary mt-1">{t('archetype.explorer.empty-desc', locale)}</div>}
      </div>
    )
  }

  const renderTierSection = (tier: 'HOT' | 'WARM' | 'COLD', results: ExplorerResult[]) => {
    const tierColor = getTierColor(tier)
    const isExpanded = expandedTier === tier
    if (results.length === 0) return null

    return (
      <div key={tier} className="border border-line rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedTier(isExpanded ? null : tier)}
          className="w-full px-4 py-3 bg-surface hover:bg-surface-hover transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{tierColor.emoji}</span>
            <div className="text-left">
              <div className="text-sm font-semibold text-ink">{t(tierColor.labelKey, locale)}</div>
              <div className="text-xs text-ink-tertiary">
                {results.length} {results.length === 1 ? t('archetype.explorer.result', locale) : t('archetype.explorer.results', locale)}
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-ink-tertiary" /> : <ChevronDown size={16} className="text-ink-tertiary" />}
        </button>

        {isExpanded && (
          <div className="space-y-2 p-3 bg-surface">
            {results.map((result) => {
              const isSelected = selectedResult?.id === result.id
              return (
                <button
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  className={clsx(
                    'w-full p-3 rounded-lg text-left transition-all border text-sm',
                    isSelected ? 'border-line bg-surface-hover' : 'border-transparent hover:bg-surface-hover'
                  )}
                >
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-ink text-sm mb-1">{result.name}</div>
                      {result.signal && <div className="text-xs text-ink-secondary leading-relaxed">{result.signal}</div>}
                      {result.jurisdiction && <div className="text-xs text-ink-tertiary mt-1">📍 {result.jurisdiction}</div>}
                    </div>
                    {isSelected && <ArrowRight size={16} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="card p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: agentColor }}>
            🎯 {t('archetype.explorer.hunter-mode', locale)}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Name, industry or location..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded bg-surface border border-line text-sm text-ink focus:border-ink-muted focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-line">
            <div className="text-center p-2 bg-surface rounded">
              <div className="text-lg font-bold" style={{ color: '#EF4444' }}>{data.hot.length}</div>
              <div className="text-xs text-ink-tertiary mt-1">{t('archetype.analyst.hot', locale)}</div>
            </div>
            <div className="text-center p-2 bg-surface rounded">
              <div className="text-lg font-bold" style={{ color: '#F59E0B' }}>{data.warm.length}</div>
              <div className="text-xs text-ink-tertiary mt-1">{t('archetype.analyst.warm', locale)}</div>
            </div>
            <div className="text-center p-2 bg-surface rounded">
              <div className="text-lg font-bold" style={{ color: '#3B82F6' }}>{data.cold.length}</div>
              <div className="text-xs text-ink-tertiary mt-1">{t('archetype.analyst.cold', locale)}</div>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: agentColor }}>
            🌾 {t('archetype.explorer.harvest', locale)}
          </div>

          <div className="space-y-3">
            {renderTierSection('HOT', hot)}
            {renderTierSection('WARM', warm)}
            {renderTierSection('COLD', cold)}
          </div>
        </div>
      </div>

      {selectedResult && (
        <div className="md:col-span-1">
          <div className="card p-6 space-y-5 md:sticky md:top-8">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: agentColor }}>
              🔎 {t('archetype.explorer.deep-dive', locale)}
            </div>

            <div>
              <div className="text-lg font-semibold text-ink mb-2">{selectedResult.name}</div>
              <div
                className="inline-block px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: getTierColor(selectedResult.tier).bg,
                  color: getTierColor(selectedResult.tier).text,
                }}
              >
                {getTierColor(selectedResult.tier).emoji} {t(getTierColor(selectedResult.tier).labelKey, locale)}
              </div>
            </div>

            {selectedResult.industry && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-ink uppercase">{t('archetype.explorer.industry', locale)}</div>
                <div className="text-sm text-ink-secondary">{selectedResult.industry}</div>
              </div>
            )}

            {selectedResult.signal && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-ink uppercase">{t('archetype.explorer.key-signal', locale)}</div>
                <div className="text-sm text-ink-secondary">{selectedResult.signal}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
