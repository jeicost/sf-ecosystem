'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Clock, Check, Edit3, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { clsx } from 'clsx'
import type { ApprovalItem } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

// Única bandeja de revisión de Marketing: cola de aprobación (pendientes +
// historial). La pestaña Alertas se retiró en B2 (2026-07-28): su única
// fuente era un webhook externo jamás conectado, así que siempre estaba
// vacía — la tabla y el webhook quedan dormidos por si algún día hay fuente.

type FilterTab = 'pending' | 'approved' | 'rejected'

// label holds an i18n key, resolved with t() at render time
const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'pending',  label: 'approvals.tab-pending' },
  { id: 'approved', label: 'approvals.tab-approved' },
  { id: 'rejected', label: 'approvals.tab-rejected' },
]

function timeAgo(ts: string, locale: Locale) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return t('approvals.time-now', locale)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h`
}

export default function ApprovalsPage() {
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id

  const [items, setItems] = useState<ApprovalItem[]>([])
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Edición antes de aprobar: el botón existía sin handler (auditoría 08-10).
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    if (!clientId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const db = createClient()

    db.from('approval_queue')
      .select('*')
      .eq('client_id', clientId)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as ApprovalItem[])
        setLoading(false)
      })

    const channel = db
      .channel(`approvals-realtime-${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'approval_queue', filter: `client_id=eq.${clientId}` },
        (payload) => setItems(prev => [payload.new as ApprovalItem, ...prev])
      )
      .subscribe()

    return () => { db.removeChannel(channel) }
  }, [clientId])

  // El raíl (fase 0): la decisión va por /api/approvals/decide (server-side),
  // que además PROPAGA el estado a post_history — antes se actualizaba solo
  // approval_queue desde el navegador y el historial quedaba en 'draft'.
  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch('/api/approvals/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: id, decision: status }),
    })
    if (!res.ok) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  // Guarda el copy editado y aprueba en el mismo gesto (approved_with_edits).
  const saveEditAndApprove = async (id: string) => {
    const copy = editText.trim()
    if (!copy) return
    const res = await fetch('/api/approvals/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: id, decision: 'approved_with_edits', copy }),
    })
    if (!res.ok) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, copy, status: 'approved_with_edits' } : i))
    setEditingId(null)
  }

  // Cierra el raíl: marca la pieza como publicada/usada de verdad → post_history
  // pasa a 'published' + posted_at. Es el dato de "qué se usó" (B2) que no existía.
  const markPublished = async (id: string) => {
    const res = await fetch('/api/approvals/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId: id, mark: 'published' }),
    })
    if (!res.ok) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'published' } : i))
  }

  // 'published' es un estado posterior a 'approved' — cae en la pestaña Approved.
  const isApprovedState = (s: string) => s === 'approved' || s === 'approved_with_edits' || s === 'published'
  const filtered = items.filter(i => {
    if (filter === 'pending') return i.status === 'pending_review'
    if (filter === 'approved') return isApprovedState(i.status)
    if (filter === 'rejected') return i.status === 'rejected'
    return false
  })

  const pending  = items.filter(i => i.status === 'pending_review').length
  const approved = items.filter(i => isApprovedState(i.status)).length
  const rejected = items.filter(i => i.status === 'rejected').length

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-ink-muted animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('approvals.title', locale)}</h1>
          <p className="text-ink-tertiary mt-1 text-sm">{t('approvals.subtitle', locale)}</p>
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-surface text-ink-secondary hover:text-ink transition-colors"
        >
          📅 {t('approvals.view-calendar', locale)}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: t('approvals.stat-waiting', locale),  value: pending,  icon: Clock, color: 'text-amber-400',   bg: 'bg-amber-500/10' },
          { label: t('approvals.stat-approved', locale), value: approved, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: t('approvals.tab-rejected', locale),  value: rejected, icon: X,     color: 'text-red-400',     bg: 'bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{value}</p>
              <p className="text-[11px] text-ink-tertiary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6">
        {FILTER_TABS.map(tab => {
          const count = tab.id === 'pending' ? pending
            : tab.id === 'approved' ? approved
            : rejected
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all',
                filter === tab.id ? 'bg-surface-hover text-ink font-medium' : 'text-ink-tertiary hover:text-ink'
              )}
            >
              {t(tab.label, locale)}
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full',
                filter === tab.id ? 'bg-surface-hover text-ink' : 'bg-surface text-ink-tertiary'
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Approval items */}
      <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card py-14 text-center">
              <CheckSquare size={24} className="text-ink-muted mx-auto mb-3" />
              <p className="text-sm text-ink-tertiary">
                {filter === 'pending' ? t('approvals.empty-pending', locale) : t('approvals.empty-category', locale)}
              </p>
            </div>
          )}
          {filtered.map(item => {
            const isPending  = item.status === 'pending_review'
            const isPublished = item.status === 'published'
            const isApproved = item.status === 'approved' || item.status === 'approved_with_edits' || isPublished
            const isExpanded = expanded === item.id

            return (
              <div key={item.id} className={clsx('card transition-all', {
                'border-amber-500/20': isPending && item.tone_warning,
                'border-emerald-500/20': isApproved,
                'opacity-50': item.status === 'rejected',
              })}>
                <button
                  className="w-full p-5 flex items-center gap-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-sm shrink-0">
                    {item.platform === 'Instagram' ? '📸' : item.platform === 'LinkedIn' ? '💼' : item.platform === 'TikTok' ? '🎵' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm text-ink font-medium">{item.platform ?? item.tipo}</p>
                      <span className="text-[10px] text-ink-tertiary">· {item.tipo}</span>
                    </div>
                    <p className="text-xs text-ink-muted truncate">{item.copy ?? item.caption ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.tone_warning && isPending && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">⚠ {t('approvals.review-tone', locale)}</span>
                    )}
                    {isApproved && !isPublished && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">✓ {t('approvals.approved-badge', locale)}</span>
                    )}
                    {isPublished && (
                      <span className="text-[10px] bg-emerald-500/25 text-emerald-300 px-2 py-0.5 rounded-full">🚀 {t('approvals.published-badge', locale)}</span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">{t('approvals.rejected-badge', locale)}</span>
                    )}
                    <span className="text-[11px] text-ink-muted">{timeAgo(item.submitted_at, locale)}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5">
                    <div className="bg-card rounded-lg p-4 border border-line mb-4">
                      {item.asset_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.asset_url}
                          alt=""
                          className="max-h-64 rounded-lg mb-3 border border-line object-contain"
                        />
                      )}
                      {item.copy && <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">{item.copy}</p>}
                      {item.caption && item.caption !== item.copy && (
                        <p className="text-xs text-ink-tertiary mt-2 leading-relaxed">{item.caption}</p>
                      )}
                      {item.hashtags && item.hashtags.length > 0 && (
                        <p className="text-xs text-ink-tertiary mt-2">{item.hashtags.join(' ')}</p>
                      )}

                      {/* Notas de producción: van APARTE del copy a propósito —
                          antes se colaban dentro y el cliente las publicaba. */}
                      {item.production_notes && (
                        <details className="mt-3 rounded-lg border border-line-subtle bg-page p-2.5">
                          <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-ink-muted">
                            Production notes
                          </summary>
                          <p className="mt-2 whitespace-pre-line text-xs text-ink-tertiary">
                            {item.production_notes}
                          </p>
                        </details>
                      )}

                      {/* Avisos del validador de las reglas de la propia marca. */}
                      {item.qa_flags && item.qa_flags.length > 0 && (
                        <div className="mt-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5">
                          <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-500/90">Brand rule check</p>
                          <ul className="space-y-0.5">
                            {item.qa_flags.map((f, i) => (
                              <li key={i} className="text-xs text-ink-secondary">
                                {f.severity === 'bloqueante' ? '🔴' : '🟠'} {f.detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {isPending && editingId === item.id && (
                      <div className="mb-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={6}
                          autoFocus
                          className="w-full text-sm bg-card border border-line rounded-lg p-3 text-ink leading-relaxed focus:outline-none focus:ring-1 focus:ring-ink-muted resize-y"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEditAndApprove(item.id)}
                            disabled={!editText.trim()}
                            className="flex-1 py-2.5 text-xs rounded-lg bg-ink text-page hover:opacity-90 transition-colors font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Check size={13} /> {t('approvals.edit-save', locale)}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2.5 text-xs rounded-lg bg-surface text-ink-secondary hover:text-ink transition-colors"
                          >
                            {t('approvals.edit-cancel', locale)}
                          </button>
                        </div>
                      </div>
                    )}
                    {isPending && editingId !== item.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(item.id, 'approved')}
                          className="flex-1 py-2.5 text-xs rounded-lg bg-ink text-page hover:opacity-90 transition-colors font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Check size={13} /> {t('approvals.approve-schedule', locale)}
                        </button>
                        <button
                          onClick={() => { setEditingId(item.id); setEditText(item.copy ?? '') }}
                          className="flex-1 py-2.5 text-xs rounded-lg bg-surface text-ink-secondary hover:text-ink transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit3 size={13} /> {t('approvals.edit', locale)}
                        </button>
                        <button
                          onClick={() => updateStatus(item.id, 'rejected')}
                          className="px-4 py-2.5 text-xs rounded-lg bg-surface text-ink-tertiary hover:text-red-400 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                    {isApproved && !isPublished && (
                      <div className="flex items-center justify-between gap-2 py-1">
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <Check size={12} /> {t('approvals.approved-in-queue', locale)}
                        </p>
                        {/* Cierra el raíl: registra el uso real de la pieza. */}
                        <button
                          onClick={() => markPublished(item.id)}
                          className="text-xs rounded-lg px-3 py-1.5 bg-surface text-ink-secondary hover:text-ink transition-colors flex items-center gap-1.5"
                        >
                          🚀 {t('approvals.mark-published', locale)}
                        </button>
                      </div>
                    )}
                    {isPublished && (
                      <p className="text-xs text-emerald-300 flex items-center gap-1.5 py-1">
                        🚀 {t('approvals.published-in-queue', locale)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
    </div>
  )
}
