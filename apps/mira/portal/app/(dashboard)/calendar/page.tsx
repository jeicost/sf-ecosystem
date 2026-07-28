'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Loader2, X, Check, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

type ItemStatus = 'pending_review' | 'approved' | 'rejected' | 'draft'

interface CalendarItem {
  key: string
  source: 'queue' | 'history'
  id: string
  platform: string | null
  status: ItemStatus
  date: Date
  copy: string | null
  caption: string | null
  hashtags: string[] | null
}

const STATUS_STYLE: Record<ItemStatus, { dot: string; chip: string; labelKey: string }> = {
  pending_review: { dot: 'bg-amber-400', chip: 'bg-amber-500/15 text-amber-400', labelKey: 'calendar.status.pending' },
  approved: { dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-400', labelKey: 'calendar.status.approved' },
  rejected: { dot: 'bg-red-400', chip: 'bg-red-500/15 text-red-400', labelKey: 'calendar.status.rejected' },
  draft: { dot: 'bg-ink-tertiary', chip: 'bg-surface-hover text-ink-secondary', labelKey: 'calendar.status.draft' },
}

function platformIcon(platform: string | null): string {
  const p = (platform ?? '').toLowerCase()
  if (p.includes('instagram')) return '📸'
  if (p.includes('linkedin')) return '💼'
  if (p.includes('tiktok')) return '🎵'
  return '📝'
}

function normalizeQueueStatus(status: string): ItemStatus {
  if (status === 'approved' || status === 'approved_with_edits') return 'approved'
  if (status === 'rejected') return 'rejected'
  return 'pending_review'
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function CalendarPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US'
  const clientId = activeClient?.id
  const brandColor = activeClient?.primaryColor || '#8B5CF6'

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CalendarItem | null>(null)
  const [updating, setUpdating] = useState(false)

  // ── Fetch approval_queue + post_history ────────────────────
  useEffect(() => {
    if (!clientId) return
    setLoading(true)
    const db = createClient()

    Promise.all([
      db.from('approval_queue')
        .select('id, platform, status, copy, caption, hashtags, scheduled_time, submitted_at')
        .eq('client_id', clientId),
      db.from('post_history')
        .select('id, platform, status, content, posted_at, created_at')
        .eq('client_id', clientId),
    ]).then(([queueRes, historyRes]) => {
      const merged: CalendarItem[] = []

      for (const row of (queueRes.data as any[]) ?? []) {
        const raw = row.scheduled_time ?? row.submitted_at
        if (!raw) continue
        merged.push({
          key: `q-${row.id}`,
          source: 'queue',
          id: row.id,
          platform: row.platform,
          status: normalizeQueueStatus(row.status),
          date: new Date(raw),
          copy: row.copy,
          caption: row.caption,
          hashtags: row.hashtags,
        })
      }

      for (const row of (historyRes.data as any[]) ?? []) {
        if (row.status !== 'draft') continue // los publicados/aprobados ya viven en la cola
        const raw = row.posted_at ?? row.created_at
        if (!raw) continue
        merged.push({
          key: `h-${row.id}`,
          source: 'history',
          id: row.id,
          platform: row.platform,
          status: 'draft',
          date: new Date(raw),
          copy: row.content,
          caption: null,
          hashtags: null,
        })
      }

      setItems(merged)
      setLoading(false)
    })
  }, [clientId])

  // ── Aprobar / rechazar (mismo update que approvals) ────────
  const updateStatus = async (item: CalendarItem, status: 'approved' | 'rejected') => {
    if (item.source !== 'queue' || updating) return
    setUpdating(true)
    const db = createClient()
    await db.from('approval_queue')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', item.id)
    setItems(prev => prev.map(i => (i.key === item.key ? { ...i, status } : i)))
    setSelected(prev => (prev?.key === item.key ? { ...prev, status } : prev))
    setUpdating(false)
  }

  // ── Grid del mes ───────────────────────────────────────────
  const { cells, monthLabel } = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const leading = (first.getDay() + 6) % 7 // lunes = 0

    const byDay = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const k = dayKey(item.date)
      const arr = byDay.get(k) ?? []
      arr.push(item)
      byDay.set(k, arr)
    }

    const list: Array<{ day: number | null; items: CalendarItem[]; isToday: boolean }> = []
    for (let i = 0; i < leading; i++) list.push({ day: null, items: [], isToday: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      list.push({
        day: d,
        items: (byDay.get(dayKey(date)) ?? []).sort((a, b) => a.date.getTime() - b.date.getTime()),
        isToday: dayKey(date) === dayKey(today),
      })
    }
    while (list.length % 7 !== 0) list.push({ day: null, items: [], isToday: false })

    const label = first.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })
    return { cells: list, monthLabel: label.charAt(0).toUpperCase() + label.slice(1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, items, dateLocale])

  const changeMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const monthCount = cells.reduce((acc, c) => acc + c.items.length, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="text-ink-muted animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('calendar.title', locale)}</h1>
          <p className="text-ink-tertiary mt-1 text-sm">
            {t('calendar.subtitle', locale)
              .replace('{name}', activeClient?.name ?? t('calendar.your-brand', locale))
              .replace('{count}', String(monthCount))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-surface text-ink-secondary hover:text-ink transition-colors"
          >
            <CheckSquare size={13} /> {t('calendar.approval-queue', locale)}
          </Link>
          <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors" aria-label={t('calendar.prev-month', locale)}>
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs text-ink font-medium px-2 min-w-[130px] text-center">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors" aria-label={t('calendar.next-month', locale)}>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Leyenda ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-4">
        {(Object.keys(STATUS_STYLE) as ItemStatus[]).map(s => (
          <span key={s} className="inline-flex items-center gap-1.5 text-[10px] text-ink-tertiary">
            <span className={clsx('w-2 h-2 rounded-full', STATUS_STYLE[s].dot)} />
            {t(STATUS_STYLE[s].labelKey, locale)}
          </span>
        ))}
      </div>

      {/* ── Grid mensual ───────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[700px]">
        <div className="grid grid-cols-7 border-b border-line">
          {t('calendar.weekdays', locale).split(',').map((d, i) => (
            <div key={i} className="px-2 py-2 text-center text-[10px] font-mono uppercase tracking-wider text-ink-tertiary">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={clsx(
                'min-h-[96px] border-b border-r border-line-subtle p-1.5',
                (idx + 1) % 7 === 0 && 'border-r-0',
                idx >= cells.length - 7 && 'border-b-0',
                cell.day === null && 'bg-surface'
              )}
            >
              {cell.day !== null && (
                <>
                  <div className="flex justify-end mb-1">
                    <span
                      className={clsx(
                        'text-[10px] w-5 h-5 flex items-center justify-center rounded-full',
                        cell.isToday ? 'text-black font-semibold' : 'text-ink-tertiary'
                      )}
                      style={cell.isToday ? { background: brandColor } : undefined}
                    >
                      {cell.day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {cell.items.slice(0, 3).map(item => (
                      <button
                        key={item.key}
                        onClick={() => setSelected(item)}
                        className={clsx(
                          'w-full flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] transition-all hover:brightness-125 text-left',
                          STATUS_STYLE[item.status].chip
                        )}
                        title={item.caption ?? item.copy ?? ''}
                      >
                        <span className="shrink-0">{platformIcon(item.platform)}</span>
                        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', STATUS_STYLE[item.status].dot)} />
                        <span className="truncate">{(item.copy ?? item.caption ?? '—').replace(/^\[Pilar:/, '[')}</span>
                      </button>
                    ))}
                    {cell.items.length > 3 && (
                      <button
                        onClick={() => setSelected(cell.items[3])}
                        className="w-full text-left px-1.5 text-[9px] text-ink-tertiary hover:text-ink transition-colors"
                      >
                        +{cell.items.length - 3} {t('calendar.more', locale)}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>

      {/* ── Panel lateral de detalle ───────────────────────── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-page border-l border-line z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <div className="flex items-center gap-3">
                <span className="text-lg">{platformIcon(selected.platform)}</span>
                <div>
                  <p className="text-sm text-ink font-medium">{selected.platform ?? t('calendar.post-fallback', locale)}</p>
                  <p className="text-[10px] text-ink-tertiary">
                    {selected.date.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' · '}
                    {selected.source === 'queue' ? t('calendar.source-queue', locale) : t('calendar.source-history', locale)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-hover transition-colors" aria-label={t('common.close', locale)}>
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <span className={clsx('inline-block text-[10px] px-2 py-0.5 rounded-full mb-4', STATUS_STYLE[selected.status].chip)}>
                {t(STATUS_STYLE[selected.status].labelKey, locale)}
              </span>
              {selected.copy && (
                <div className="bg-card rounded-lg p-4 border border-line mb-4">
                  <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">{selected.copy}</p>
                </div>
              )}
              {selected.caption && selected.caption !== selected.copy && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-ink-tertiary mb-1.5">{t('calendar.caption-label', locale)}</p>
                  <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-line">{selected.caption}</p>
                </div>
              )}
              {selected.hashtags && selected.hashtags.length > 0 && (
                <p className="text-xs text-ink-tertiary">{selected.hashtags.join(' ')}</p>
              )}
            </div>

            {selected.source === 'queue' && selected.status === 'pending_review' && (
              <div className="px-6 py-4 border-t border-line flex gap-2">
                <button
                  onClick={() => updateStatus(selected, 'approved')}
                  disabled={updating}
                  className="flex-1 py-2.5 text-xs rounded-lg bg-ink text-page hover:opacity-90 transition-colors font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={13} /> {t('calendar.approve', locale)}
                </button>
                <button
                  onClick={() => updateStatus(selected, 'rejected')}
                  disabled={updating}
                  className="px-5 py-2.5 text-xs rounded-lg bg-surface text-ink-tertiary hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <X size={13} /> {t('calendar.reject', locale)}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  )
}
