'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, Loader2, X, Check, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'

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

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const STATUS_STYLE: Record<ItemStatus, { dot: string; chip: string; label: string }> = {
  pending_review: { dot: 'bg-amber-400', chip: 'bg-amber-500/15 text-amber-400', label: 'Pendiente' },
  approved: { dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-400', label: 'Aprobado' },
  rejected: { dot: 'bg-red-400', chip: 'bg-red-500/15 text-red-400', label: 'Rechazado' },
  draft: { dot: 'bg-[#555]', chip: 'bg-white/10 text-[#888]', label: 'Borrador' },
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

    const label = first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return { cells: list, monthLabel: label.charAt(0).toUpperCase() + label.slice(1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth, items])

  const changeMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const monthCount = cells.reduce((acc, c) => acc + c.items.length, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="text-[#444] animate-spin" />
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Calendario editorial</h1>
          <p className="text-[#555] mt-1 text-sm">
            Contenido de {activeClient?.name ?? 'tu marca'} por fecha · {monthCount} items este mes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/approvals"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-[#1A1A1A] text-[#888] hover:text-white transition-colors"
          >
            <CheckSquare size={13} /> Cola de Aprobación
          </Link>
          <div className="flex items-center gap-1 bg-[#1A1A1A] rounded-lg p-1">
            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-white/10 transition-colors" aria-label="Mes anterior">
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs text-white font-medium px-2 min-w-[130px] text-center">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-md text-[#888] hover:text-white hover:bg-white/10 transition-colors" aria-label="Mes siguiente">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Leyenda ────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-4">
        {(Object.keys(STATUS_STYLE) as ItemStatus[]).map(s => (
          <span key={s} className="inline-flex items-center gap-1.5 text-[10px] text-[#666]">
            <span className={clsx('w-2 h-2 rounded-full', STATUS_STYLE[s].dot)} />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>

      {/* ── Grid mensual ───────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[#1A1A1A]">
          {WEEKDAYS.map(d => (
            <div key={d} className="px-2 py-2 text-center text-[10px] font-mono uppercase tracking-wider text-[#555]">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={clsx(
                'min-h-[96px] border-b border-r border-[#141414] p-1.5',
                (idx + 1) % 7 === 0 && 'border-r-0',
                idx >= cells.length - 7 && 'border-b-0',
                cell.day === null && 'bg-[#0A0A0A]/60'
              )}
            >
              {cell.day !== null && (
                <>
                  <div className="flex justify-end mb-1">
                    <span
                      className={clsx(
                        'text-[10px] w-5 h-5 flex items-center justify-center rounded-full',
                        cell.isToday ? 'text-black font-semibold' : 'text-[#555]'
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
                        className="w-full text-left px-1.5 text-[9px] text-[#555] hover:text-white transition-colors"
                      >
                        +{cell.items.length - 3} más
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel lateral de detalle ───────────────────────── */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0D0D0D] border-l border-[#1A1A1A] z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <span className="text-lg">{platformIcon(selected.platform)}</span>
                <div>
                  <p className="text-sm text-white font-medium">{selected.platform ?? 'Post'}</p>
                  <p className="text-[10px] text-[#555]">
                    {selected.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' · '}
                    {selected.source === 'queue' ? 'Cola de aprobación' : 'Historial'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg text-[#666] hover:text-white hover:bg-white/10 transition-colors" aria-label="Cerrar">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <span className={clsx('inline-block text-[10px] px-2 py-0.5 rounded-full mb-4', STATUS_STYLE[selected.status].chip)}>
                {STATUS_STYLE[selected.status].label}
              </span>
              {selected.copy && (
                <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#1A1A1A] mb-4">
                  <p className="text-sm text-[#ddd] leading-relaxed whitespace-pre-line">{selected.copy}</p>
                </div>
              )}
              {selected.caption && selected.caption !== selected.copy && (
                <div className="mb-4">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-1.5">Caption</p>
                  <p className="text-xs text-[#999] leading-relaxed whitespace-pre-line">{selected.caption}</p>
                </div>
              )}
              {selected.hashtags && selected.hashtags.length > 0 && (
                <p className="text-xs text-[#555]">{selected.hashtags.join(' ')}</p>
              )}
            </div>

            {selected.source === 'queue' && selected.status === 'pending_review' && (
              <div className="px-6 py-4 border-t border-[#1A1A1A] flex gap-2">
                <button
                  onClick={() => updateStatus(selected, 'approved')}
                  disabled={updating}
                  className="flex-1 py-2.5 text-xs rounded-lg bg-white text-black hover:bg-white/90 transition-colors font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check size={13} /> Aprobar
                </button>
                <button
                  onClick={() => updateStatus(selected, 'rejected')}
                  disabled={updating}
                  className="px-5 py-2.5 text-xs rounded-lg bg-[#1A1A1A] text-[#666] hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <X size={13} /> Rechazar
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  )
}
