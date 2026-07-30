'use client'
import { useState } from 'react'
import { ArrowRight, BarChart3 } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { AnalystResult, AnalystData } from '@/lib/analyst-data'

interface AnalystArchetypeProps {
  agentColor: string
  status?: 'loading' | 'ready' | 'empty' | 'error'
  errorMessage?: string
  data?: AnalystData
}

const isHot = (score: number) => score >= 75
const isWarm = (score: number) => score >= 50 && score < 75

const getScoreBadgeColor = (score: number) => {
  if (isHot(score)) return { bg: '#DC262630', text: '#EF4444', emoji: '🔥' }
  if (isWarm(score)) return { bg: '#F59E0B30', text: '#F59E0B', emoji: '🟡' }
  return { bg: '#3B82F630', text: '#3B82F6', emoji: '🔵' }
}

export default function AnalystArchetype({ agentColor, status = 'ready', errorMessage, data }: AnalystArchetypeProps) {
  const { locale } = useLocaleContext()
  const [selectedResult, setSelectedResult] = useState<AnalystResult | null>(data?.results[0] ?? null)

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

  if (status === 'empty' || !data || data.results.length === 0) {
    return (
      <div className="card p-6 text-center border border-dashed border-line">
        <BarChart3 size={24} className="mx-auto text-ink-tertiary mb-2" />
        <div className="text-sm text-ink font-medium">{t('archetype.analyst.empty-title', locale)}</div>
        <div className="text-xs text-ink-tertiary mt-1">{t('archetype.analyst.empty-desc', locale)}</div>
      </div>
    )
  }

  const { totalCount, hotCount, warmCount, coldCount, results, tierLabels, viewFullReportUrl } = data
  const hotLabel = tierLabels.hot.startsWith('archetype.') ? t(tierLabels.hot, locale) : tierLabels.hot
  const warmLabel = tierLabels.warm.startsWith('archetype.') ? t(tierLabels.warm, locale) : tierLabels.warm

  const handleSelectResult = (result: AnalystResult) => setSelectedResult(result)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="card p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: agentColor }}>
            🎯 {t('archetype.analyst.control-panel', locale)}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface p-3 rounded">
              <div className="text-2xl font-bold text-ink">{totalCount}</div>
              <div className="text-xs text-ink-tertiary mt-1">{t('archetype.analyst.total', locale)}</div>
            </div>
            <div className="bg-surface p-3 rounded">
              <div className="text-2xl font-bold text-ink">{hotCount}</div>
              <div className="text-xs text-ink-tertiary mt-1">{hotLabel} ≥75</div>
            </div>
            <div className="bg-surface p-3 rounded">
              <div className="text-2xl font-bold text-ink">{warmCount}</div>
              <div className="text-xs text-ink-tertiary mt-1">{warmLabel} 50-74</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-ink-secondary">{t('archetype.analyst.distribution', locale)}</div>
            <div className="flex gap-1 h-2 rounded overflow-hidden">
              <div style={{ width: `${(hotCount / totalCount) * 100}%`, backgroundColor: '#EF4444' }} />
              <div style={{ width: `${(warmCount / totalCount) * 100}%`, backgroundColor: '#F59E0B' }} />
              <div className="flex-1" style={{ backgroundColor: '#3B82F6' }} />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: agentColor }}>
            🔍 {t('archetype.analyst.inspect-mode', locale)}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result) => {
              const scoreBadge = getScoreBadgeColor(result.score)
              const isSelected = selectedResult?.id === result.id

              return (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={clsx(
                    'w-full p-4 rounded-lg text-left transition-all border',
                    isSelected ? 'border-line bg-surface-hover' : 'border-transparent hover:bg-surface'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm font-semibold text-ink">
                          {result.rank}. {result.name}
                        </div>
                        <div
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: scoreBadge.bg, color: scoreBadge.text }}
                        >
                          {scoreBadge.emoji} {result.score}
                        </div>
                      </div>
                      {result.subtitle && <div className="text-xs text-ink-tertiary mb-2">{result.subtitle}</div>}
                      <div className="flex flex-wrap gap-1">
                        {result.metrics.map((metric, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-surface text-ink-secondary">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && <ArrowRight size={16} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selectedResult && (
        <div className="md:col-span-1">
          <div className="card p-6 space-y-5 md:sticky md:top-8">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: agentColor }}>
              💡 {t('archetype.analyst.insights', locale)}
            </div>

            <div>
              <div className="text-lg font-semibold text-ink mb-1">{selectedResult.name}</div>
              <div className="text-sm text-ink-tertiary">
                {t('archetype.analyst.score', locale)} {selectedResult.score}/100
              </div>
            </div>

            {selectedResult.triggers && selectedResult.triggers.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-ink uppercase">{t('archetype.analyst.signals', locale)}</div>
                <div className="space-y-1">
                  {selectedResult.triggers.map((trigger, i) => (
                    <div key={i} className="text-xs text-ink-secondary leading-relaxed">
                      <span className="mr-2">✓</span>
                      {trigger}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewFullReportUrl && (
              <a
                href={viewFullReportUrl}
                className="block pt-3 text-center px-3 py-2 text-xs rounded font-medium text-white"
                style={{ backgroundColor: agentColor }}
              >
                {t('archetype.analyst.view-full', locale)}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
