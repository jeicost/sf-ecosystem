'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Target } from 'lucide-react'
import { clsx } from 'clsx'

interface AnalystResult {
  id: string
  rank: number
  score: number
  name: string
  subtitle: string
  metrics: string[]
  triggers?: string[]
  details?: {
    signals: string[]
    nextMove: string
  }
}

interface AnalystArchetypeProps {
  agentColor: string
  agentEmoji: string
  agentName: string
  totalCount?: number
  hotCount?: number
  warmCount?: number
  coldCount?: number
  results?: AnalystResult[]
  onSelectResult?: (result: AnalystResult) => void
  isLoading?: boolean
}

const DEFAULT_RESULTS: AnalystResult[] = [
  {
    id: '1',
    rank: 1,
    score: 92,
    name: 'Acme Ventures',
    subtitle: 'Madrid, ES',
    metrics: ['Serie A + AI buying', 'Hiring VP Growth'],
    triggers: [
      '€2.5M levantado en últimos 3 meses',
      'CEO publicó sobre IA esta semana',
      'Contrataron VP Growth hace 1 mes',
    ],
    details: {
      signals: [
        '✓ Blog post: "AI in venture" (3 días)',
        '✓ Contrataron CTO de Microsoft',
        '✓ Publicación en Product Hunt (2 meses)',
      ],
      nextMove: 'Quinn debe qualifyear (BANT check) → Finn icebreaker listo',
    },
  },
  {
    id: '2',
    rank: 2,
    score: 87,
    name: 'Zenbiz',
    subtitle: 'Barcelona, ES',
    metrics: ['Expanding EU', 'Growth stage'],
  },
  {
    id: '3',
    rank: 3,
    score: 84,
    name: 'Flux Co',
    subtitle: 'Berlin, DE',
    metrics: ['Tech stack pivot', 'New hiring'],
  },
]

export default function AnalystArchetype({
  agentColor,
  agentEmoji,
  agentName,
  totalCount = 247,
  hotCount = 64,
  warmCount = 103,
  coldCount = 80,
  results = DEFAULT_RESULTS,
  onSelectResult,
  isLoading = false,
}: AnalystArchetypeProps) {
  const [selectedResult, setSelectedResult] = useState<AnalystResult | null>(results[0] || null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleSelectResult = (result: AnalystResult) => {
    setSelectedResult(result)
    onSelectResult?.(result)
  }

  const isHot = (score: number) => score >= 75
  const isWarm = (score: number) => score >= 50 && score < 75
  const isCold = (score: number) => score < 50

  const getScoreBadgeColor = (score: number) => {
    if (isHot(score)) return { bg: '#DC262630', text: '#EF4444', emoji: '🔥' }
    if (isWarm(score)) return { bg: '#F59E0B30', text: '#F59E0B', emoji: '🟡' }
    return { bg: '#3B82F630', text: '#3B82F6', emoji: '🔵' }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left: Control Panel + Results Table */}
      <div className="col-span-2 space-y-6">
        {/* Control Panel */}
        <div className="card p-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: agentColor }}>
            🎯 Control Panel
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface p-3 rounded">
              <div className="text-2xl font-bold text-ink">{totalCount}</div>
              <div className="text-xs text-ink-tertiary mt-1">Total Leads</div>
            </div>
            <div className="bg-surface p-3 rounded">
              <div className="text-2xl font-bold text-ink">{hotCount}</div>
              <div className="text-xs text-ink-tertiary mt-1">Hot ≥75</div>
            </div>
            <div className="bg-surface p-3 rounded">
              <div className="text-2xl font-bold text-ink">{warmCount}</div>
              <div className="text-xs text-ink-tertiary mt-1">Warm 50-74</div>
            </div>
          </div>

          {/* Distribution Bar */}
          <div className="space-y-2">
            <div className="text-xs text-ink-secondary">Distribution</div>
            <div className="flex gap-1 h-2 rounded overflow-hidden">
              <div
                className="transition-all"
                style={{
                  width: `${(hotCount / totalCount) * 100}%`,
                  backgroundColor: '#EF4444',
                }}
              />
              <div
                className="transition-all"
                style={{
                  width: `${(warmCount / totalCount) * 100}%`,
                  backgroundColor: '#F59E0B',
                }}
              />
              <div
                className="flex-1"
                style={{
                  backgroundColor: '#3B82F6',
                }}
              />
            </div>
            <div className="text-xs text-ink-secondary">
              {Math.round((hotCount / totalCount) * 100)}% hot is GOOD
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="card p-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: agentColor }}>
            🔍 Inspect Mode
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map(result => {
              const scoreBadge = getScoreBadgeColor(result.score)
              const isSelected = selectedResult?.id === result.id

              return (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={clsx(
                    'w-full p-4 rounded-lg text-left transition-all border',
                    isSelected
                      ? 'border-line bg-surface-hover'
                      : 'border-transparent hover:bg-surface'
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
                          style={{
                            backgroundColor: scoreBadge.bg,
                            color: scoreBadge.text,
                          }}
                        >
                          {scoreBadge.emoji} {result.score}
                        </div>
                      </div>
                      <div className="text-xs text-ink-tertiary mb-2">{result.subtitle}</div>
                      <div className="flex flex-wrap gap-1">
                        {result.metrics.map((metric, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-surface text-ink-secondary">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight size={16} style={{ color: agentColor }} className="flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Insights Panel */}
      {selectedResult && (
        <div className="col-span-1">
          <div className="card p-6 space-y-5 sticky top-8">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: agentColor }}>
              💡 Insights
            </div>

            <div>
              <div className="text-lg font-semibold text-ink mb-1">{selectedResult.name}</div>
              <div className="text-sm text-ink-tertiary">Score {selectedResult.score}/100</div>
            </div>

            {selectedResult.triggers && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-ink uppercase">Buying Signals</div>
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

            {selectedResult.details && (
              <div className="space-y-3 border-t border-line pt-4">
                <div className="text-xs font-semibold text-ink uppercase">Recent Signals</div>
                <div className="space-y-1">
                  {selectedResult.details.signals.map((signal, i) => (
                    <div key={i} className="text-xs text-ink-secondary">
                      {signal}
                    </div>
                  ))}
                </div>

                <div className="text-xs font-semibold text-ink uppercase pt-3">Next Move</div>
                <div className="text-xs text-ink-secondary leading-relaxed">
                  {selectedResult.details.nextMove}
                </div>
              </div>
            )}

            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                className="px-3 py-2 text-xs rounded font-medium transition-colors"
                style={{
                  backgroundColor: `${agentColor}20`,
                  color: agentColor,
                  border: `1px solid ${agentColor}40`,
                }}
              >
                Re-score
              </button>
              <button
                className="px-3 py-2 text-xs rounded font-medium text-white"
                style={{ backgroundColor: agentColor }}
              >
                Send to Finn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
