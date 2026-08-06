'use client'

import { useState } from 'react'
import Link from 'next/link'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

export interface DeliverableGeneration {
  id: string
  tool_slug: string
  status: string
  created_at: string
  completed_at?: string
  result_data?: Record<string, any>
}

interface DeliverableCardProps {
  category: string
  icon: string
  title: string
  description: string
  brandColor: string
  latest: DeliverableGeneration
  history: DeliverableGeneration[]
  titleFontClass?: string
}

function formatDateTime(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function extractScore(gen: DeliverableGeneration): number | null {
  const rd = gen.result_data
  if (!rd) return null
  const raw = rd.overall_score ?? rd.innovation_score
  const n = typeof raw === 'string' ? parseFloat(raw) : raw
  return typeof n === 'number' && !isNaN(n) ? Math.round(n) : null
}

export default function DeliverableCard({
  category,
  icon,
  title,
  description,
  brandColor,
  latest,
  history,
  titleFontClass = '',
}: DeliverableCardProps) {
  const { locale } = useLocaleContext()
  const [showHistory, setShowHistory] = useState(false)
  const score = extractScore(latest)

  return (
    <div
      className="card group relative flex flex-col overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
      style={{ ['--card-color' as any]: brandColor }}
    >
      {/* Top color bar */}
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: brandColor }} />

      <p
        className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] opacity-80"
        style={{ color: brandColor }}
      >
        {category}
      </p>

      <p className="mb-3 text-[26px] leading-none">{icon}</p>

      <h3 className={`mb-2 text-[17px] font-bold text-ink ${titleFontClass}`}>{title}</h3>

      <p className="flex-1 text-[13px] leading-relaxed text-ink-secondary line-clamp-3">{description}</p>

      {/* Version history toggle */}
      {history.length > 0 && (
        <button
          onClick={() => setShowHistory((v) => !v)}
          className="mt-3 self-start font-mono text-[10px] text-ink-tertiary underline decoration-dotted underline-offset-4 transition-colors hover:text-ink-secondary"
        >
          {showHistory
            ? t('toolkit.card.hide-history', locale)
            : `+ ${history.length} ${history.length === 1 ? t('toolkit.card.previous-version', locale) : t('toolkit.card.previous-versions', locale)}`}
        </button>
      )}

      {showHistory && history.length > 0 && (
        <div className="mt-2 space-y-1 rounded-lg border border-line-subtle bg-surface p-2">
          {history.map((gen) => (
            <Link
              key={gen.id}
              href={`/toolkit/report/${gen.id}`}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <span className="font-mono">{formatDateTime(gen.completed_at || gen.created_at)}</span>
              <span style={{ color: brandColor }}>open →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Footer: score or date + CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-line-subtle pt-4">
        {score !== null ? (
          <div>
            <p className="mb-0.5 text-[10px] text-ink-tertiary">{t('toolkit.card.score-label', locale)}</p>
            <p className="leading-none">
              <span className={`text-[22px] font-bold ${titleFontClass}`} style={{ color: brandColor }}>
                {score}
              </span>
              <span className="ml-0.5 text-[11px] text-ink-tertiary">{t('toolkit.card.score-suffix', locale)}</span>
            </p>
          </div>
        ) : (
          <p className="font-mono text-[10px] text-ink-tertiary">
            {formatDateTime(latest.completed_at || latest.created_at)}
          </p>
        )}

        <Link
          href={`/toolkit/report/${latest.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2.5"
          style={{ color: brandColor }}
        >
          {t('toolkit.card.view-report', locale)}
        </Link>
      </div>
    </div>
  )
}
