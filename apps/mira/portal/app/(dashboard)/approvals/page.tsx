'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Clock, AlertTriangle, Check, Edit3, X, Loader2, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { clsx } from 'clsx'
import type { Alert, ApprovalItem } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

// Única bandeja de revisión de Marketing: cola de aprobación (pendientes +
// historial) y alertas de reputación. Antes esto vivía repartido entre esta
// página y /command, que duplicaba la cola con los mismos botones — Command
// se retiró (redirige aquí) y su sección de alertas se absorbió como pestaña.

type FilterTab = 'pending' | 'approved' | 'rejected' | 'alerts'

// label holds an i18n key, resolved with t() at render time
const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'pending',  label: 'approvals.tab-pending' },
  { id: 'approved', label: 'approvals.tab-approved' },
  { id: 'rejected', label: 'approvals.tab-rejected' },
  { id: 'alerts',   label: 'approvals.tab-alerts' },
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
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const db = createClient()

    Promise.all([
      db.from('approval_queue').select('*').eq('client_id', clientId).order('submitted_at', { ascending: false }),
      db.from('alerts').select('*').eq('client_id', clientId).eq('status', 'open').order('created_at', { ascending: false }),
    ]).then(([q, a]) => {
      if (q.data) setItems(q.data as ApprovalItem[])
      if (a.data) setAlerts(a.data as Alert[])
      setLoading(false)
    })

    const channel = db
      .channel(`approvals-realtime-${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'approval_queue', filter: `client_id=eq.${clientId}` },
        (payload) => setItems(prev => [payload.new as ApprovalItem, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts', filter: `client_id=eq.${clientId}` },
        (payload) => setAlerts(prev => [payload.new as Alert, ...prev])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts', filter: `client_id=eq.${clientId}` },
        (payload) => {
          if ((payload.new as Alert).status !== 'open') {
            setAlerts(prev => prev.filter(a => a.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => { db.removeChannel(channel) }
  }, [clientId])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const db = createClient()
    await db.from('approval_queue')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const resolveAlert = async (id: string) => {
    const db = createClient()
    await db.from('alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const filtered = items.filter(i => {
    if (filter === 'pending') return i.status === 'pending_review'
    if (filter === 'approved') return i.status === 'approved' || i.status === 'approved_with_edits'
    if (filter === 'rejected') return i.status === 'rejected'
    return false
  })

  const pending  = items.filter(i => i.status === 'pending_review').length
  const approved = items.filter(i => i.status === 'approved' || i.status === 'approved_with_edits').length
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
          { label: t('approvals.stat-waiting', locale),     value: pending,       icon: Clock,         color: 'text-amber-400',   bg: 'bg-amber-500/10' },
          { label: t('approvals.stat-approved', locale),    value: approved,      icon: Check,         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: t('approvals.stat-open-alerts', locale), value: alerts.length, icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10' },
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
            : tab.id === 'rejected' ? rejected
            : alerts.length
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all',
                filter === tab.id ? 'bg-surface-hover text-ink font-medium' : 'text-ink-tertiary hover:text-ink'
              )}
            >
              {tab.id === 'alerts' && <Bell size={11} className={alerts.length > 0 ? 'text-red-400' : undefined} />}
              {t(tab.label, locale)}
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full',
                filter === tab.id ? 'bg-surface-hover text-ink' : 'bg-surface text-ink-tertiary'
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Alerts tab */}
      {filter === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 && (
            <div className="card py-14 text-center">
              <Bell size={24} className="text-ink-muted mx-auto mb-3" />
              <p className="text-sm text-ink-tertiary">{t('approvals.no-open-alerts', locale)}</p>
            </div>
          )}
          {alerts.map(alert => (
            <div key={alert.id} className="card border-red-500/20 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {alert.canal} · {alert.tipo.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-ink-muted">{timeAgo(alert.created_at, locale)}</span>
                </div>
                <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full capitalize">
                  {alert.prioridad} {t('approvals.priority', locale)}
                </span>
              </div>
              <div className="space-y-3">
                <div className="bg-card rounded-lg p-3 border border-line">
                  <p className="text-[11px] text-ink-tertiary mb-1">{t('approvals.review-received', locale)}</p>
                  <p className="text-sm text-ink-secondary leading-relaxed">&ldquo;{alert.contenido}&rdquo;</p>
                </div>
                {alert.propuesta_respuesta && (
                  <div className="bg-card rounded-lg p-3 border border-emerald-500/20">
                    <p className="text-[11px] text-emerald-400/70 mb-1">{t('approvals.sam-proposed-reply', locale)}</p>
                    <p className="text-sm text-ink-secondary leading-relaxed">{alert.propuesta_respuesta}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="flex-1 py-2 text-xs rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors font-medium"
                >
                  {t('approvals.approve-send', locale)}
                </button>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="px-4 py-2 text-xs rounded-lg bg-surface text-ink-tertiary hover:text-ink transition-colors"
                >
                  {t('approvals.resolve', locale)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval items */}
      {filter !== 'alerts' && (
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
            const isApproved = item.status === 'approved' || item.status === 'approved_with_edits'
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
                    {isApproved && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">✓ {t('approvals.approved-badge', locale)}</span>
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
                      {item.copy && <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">{item.copy}</p>}
                      {item.caption && item.caption !== item.copy && (
                        <p className="text-xs text-ink-tertiary mt-2 leading-relaxed">{item.caption}</p>
                      )}
                      {item.hashtags && item.hashtags.length > 0 && (
                        <p className="text-xs text-ink-tertiary mt-2">{item.hashtags.join(' ')}</p>
                      )}
                    </div>
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(item.id, 'approved')}
                          className="flex-1 py-2.5 text-xs rounded-lg bg-ink text-page hover:opacity-90 transition-colors font-semibold flex items-center justify-center gap-1.5"
                        >
                          <Check size={13} /> {t('approvals.approve-schedule', locale)}
                        </button>
                        <button className="flex-1 py-2.5 text-xs rounded-lg bg-surface text-ink-secondary hover:text-ink transition-colors flex items-center justify-center gap-1.5">
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
                    {isApproved && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5 py-1">
                        <Check size={12} /> {t('approvals.approved-in-queue', locale)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
