'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getUnifiedHistory, type UnifiedGeneration } from '@/lib/unified-history'
import { useActiveClient } from '@/lib/client-context'
import { ArrowRight } from 'lucide-react'

interface TrendData {
  months: Array<{ monthYear: string; count: number; label: string }>
  trend: { percentChange: number; confidence: string; message?: string }
}

export default function UnifiedHistory() {
  const { activeClient } = useActiveClient()
  const [generations, setGenerations] = useState<UnifiedGeneration[]>([])
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeClient?.id) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // Fetch unified history
        const historyData = await getUnifiedHistory(activeClient.id, 5)
        setGenerations(historyData)

        // Fetch trends
        const trendsRes = await fetch(`/api/client-portal/trends?clientId=${activeClient.id}`)
        if (trendsRes.ok) {
          const trendsData = await trendsRes.json()
          setTrends(trendsData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeClient?.id])

  if (loading) {
    return (
      <div className="py-4 text-center text-ink-tertiary">
        <p className="text-xs">Loading...</p>
      </div>
    )
  }

  if (generations.length === 0 && !trends?.months?.length) {
    return (
      <div className="py-8 text-center text-ink-tertiary">
        <p className="text-sm">No generations yet. Start creating!</p>
      </div>
    )
  }

  // Calculate max count for graph scaling
  const maxCount = trends?.months?.length
    ? Math.max(...trends.months.map(m => m.count), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* Recent Generations List */}
      {generations.length > 0 && (
        <div>
          <div className="space-y-2 mb-4">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="card px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-ink">{gen.name}</span>
                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full"
                      style={{
                        background: gen.type === 'toolkit' ? 'rgba(139,92,246,0.1)' : 'rgba(99,102,241,0.1)',
                        color: gen.type === 'toolkit' ? '#a78bfa' : '#818cf8',
                      }}
                    >
                      {gen.type === 'toolkit' ? '📊 Business Report' : '⚡ Quick Action'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-ink-tertiary">
                    {gen.department && <span>{gen.department}</span>}
                    <span>•</span>
                    <span>{new Date(gen.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span>•</span>
                    <span
                      className={`font-medium ${
                        gen.status === 'completed'
                          ? 'text-green-400'
                          : gen.status === 'failed'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                      }`}
                    >
                      {gen.status === 'completed' ? '✓' : gen.status === 'failed' ? '✗' : '⏱'} {gen.status}
                    </span>
                  </div>
                </div>
                {gen.resultUrl && (
                  <Link
                    href={gen.resultUrl}
                    className="ml-4 text-[11px] font-medium px-2 py-1 rounded transition-all hover:bg-surface-hover"
                    style={{ color: '#a78bfa' }}
                  >
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Link to full list */}
          <Link
            href="/client-portal/entregas"
            className="inline-flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-lg transition-all hover:bg-surface-hover"
            style={{ color: '#a78bfa' }}
          >
            View all
            <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Trends Graph */}
      {trends?.months && trends.months.length > 0 && (
        <div className="card px-6 py-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-ink mb-1">Monthly Trend</p>
            <p className="text-[11px] text-ink-tertiary">
              {trends.trend?.message || `Trend: ${trends.trend?.percentChange > 0 ? '↗' : '↘'} ${Math.abs(trends.trend?.percentChange ?? 0)}%`}
            </p>
          </div>

          <div className="flex items-end justify-between h-24 gap-2">
            {trends.months.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-full flex items-end justify-center">
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer group relative"
                    style={{
                      height: `${(month.count / maxCount) * 100}%`,
                      background: 'linear-gradient(180deg, #8B5CF6 0%, rgba(139,92,246,0.3) 100%)',
                      minHeight: month.count > 0 ? '4px' : '0px',
                    }}
                  >
                    {month.count > 0 && (
                      <div
                        className="absolute bottom-full mb-2 px-2 py-1 rounded text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                        style={{ background: 'rgba(0,0,0,0.8)', color: '#a78bfa' }}
                      >
                        {month.count}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[9px] text-ink-tertiary text-center leading-tight">{month.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
