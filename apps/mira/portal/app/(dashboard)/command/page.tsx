'use client'
import { useEffect, useState } from 'react'
import { Bell, CheckSquare, Activity, AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Alert, ApprovalItem } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'

const AGENT_META: Record<string, { emoji: string; color: string }> = {
  'content-strategist':  { emoji: '🔍', color: '#06B6D4' },
  copywriter:            { emoji: '✍️', color: '#F59E0B' },
  orchestrator:          { emoji: '🎬', color: '#8B5CF6' },
  'social-media-manager':{ emoji: '📅', color: '#3B82F6' },
  'ads-manager':         { emoji: '📣', color: '#EF4444' },
  'community-manager':   { emoji: '💬', color: '#F97316' },
  designer:              { emoji: '🎨', color: '#EC4899' },
  'video-editor':        { emoji: '🎞️', color: '#10B981' },
}

const AGENT_NAMES: Record<string, string> = {
  'content-strategist': 'Luna', copywriter: 'Alex', orchestrator: 'Marco',
  'social-media-manager': 'Noa', 'ads-manager': 'Riva',
  'community-manager': 'Sam', designer: 'Zoe', 'video-editor': 'Kai',
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h`
}

export default function CommandPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [approvals, setApprovals] = useState<ApprovalItem[]>([])
  const [published, setPublished] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const db = createClient()

    Promise.all([
      db.from('alerts').select('*').eq('client_id', clientId).eq('status', 'open').order('created_at', { ascending: false }),
      db.from('approval_queue').select('*').eq('client_id', clientId).eq('status', 'pending_review').order('submitted_at', { ascending: false }),
    ]).then(([a, q]) => {
      if (a.data) setAlerts(a.data as Alert[])
      if (q.data) setApprovals(q.data as ApprovalItem[])
      setLoading(false)
    })

    const channel = db
      .channel(`command-realtime-${clientId}`)
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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'approval_queue', filter: `client_id=eq.${clientId}` },
        (payload) => {
          if ((payload.new as ApprovalItem).status === 'pending_review') {
            setApprovals(prev => [payload.new as ApprovalItem, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'approval_queue', filter: `client_id=eq.${clientId}` },
        (payload) => {
          if ((payload.new as ApprovalItem).status !== 'pending_review') {
            setApprovals(prev => prev.filter(a => a.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => { db.removeChannel(channel) }
  }, [clientId])

  const resolveAlert = async (id: string) => {
    const db = createClient()
    await db.from('alerts').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const approveItem = async (id: string) => {
    const db = createClient()
    await db.from('approval_queue').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id)
    setApprovals(prev => prev.filter(a => a.id !== id))
    setPublished(p => p + 1)
  }

  const rejectItem = async (id: string) => {
    const db = createClient()
    await db.from('approval_queue').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id)
    setApprovals(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-ink-muted animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Command Center</h1>
        <p className="text-ink-tertiary mt-1 text-sm">Everything that needs your attention right now.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Waiting for approval', value: approvals.length, icon: CheckSquare, color: 'text-amber-400' },
          { label: 'Open alerts',     value: alerts.length,    icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Published today',       value: published,        icon: Activity, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <Icon size={20} className={color} />
            <div>
              <p className="text-2xl font-semibold text-ink">{value}</p>
              <p className="text-[11px] text-ink-tertiary">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={14} className="text-red-400" />
            <h2 className="text-sm font-medium text-ink">Urgent alerts</h2>
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{alerts.length}</span>
          </div>
          {alerts.map(alert => (
            <div key={alert.id} className="card border-red-500/20 p-5 mb-3">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    {alert.canal} · {alert.tipo.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-ink-muted">{timeAgo(alert.created_at)}</span>
                </div>
                <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full capitalize">
                  {alert.prioridad} prioridad
                </span>
              </div>
              <div className="space-y-3">
                <div className="bg-card rounded-lg p-3 border border-line">
                  <p className="text-[11px] text-ink-tertiary mb-1">Reseña recibida:</p>
                  <p className="text-sm text-ink-secondary leading-relaxed">&ldquo;{alert.contenido}&rdquo;</p>
                </div>
                {alert.propuesta_respuesta && (
                  <div className="bg-card rounded-lg p-3 border border-emerald-500/20">
                    <p className="text-[11px] text-emerald-400/70 mb-1">Respuesta propuesta por Sam:</p>
                    <p className="text-sm text-ink-secondary leading-relaxed">{alert.propuesta_respuesta}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="flex-1 py-2 text-xs rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors font-medium"
                >
                  Approve & send
                </button>
                <button className="flex-1 py-2 text-xs rounded-lg bg-surface text-ink-secondary hover:text-ink transition-colors">
                  Edit reply
                </button>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="px-4 py-2 text-xs rounded-lg bg-surface text-ink-tertiary hover:text-ink transition-colors"
                >
                  Escalate
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Approval queue */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare size={14} className="text-amber-400" />
          <h2 className="text-sm font-medium text-ink">Approval queue</h2>
          <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">{approvals.length}</span>
        </div>

        <div className="space-y-3">
          {approvals.length === 0 && (
            <div className="card py-12 text-center">
              <CheckSquare size={24} className="text-ink-muted mx-auto mb-3" />
              <p className="text-sm text-ink-tertiary">All caught up. No content waiting for approval.</p>
            </div>
          )}
          {approvals.map(item => {
            const role = item.tipo === 'community_response' ? 'community-manager'
              : item.tipo === 'ads_alert' ? 'ads-manager'
              : 'copywriter'
            const meta = AGENT_META[role] ?? { emoji: '🤖', color: '#666' }
            const name = AGENT_NAMES[role] ?? 'Agente'
            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: `${meta.color}20` }}>
                      {meta.emoji}
                    </div>
                    <div>
                      <p className="text-sm text-ink font-medium">{name}</p>
                      <p className="text-[11px] text-ink-tertiary">{item.platform} · {item.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.tone_warning && (
                      <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">⚠ Revisar tono</span>
                    )}
                    <span className="text-[11px] text-ink-muted">{timeAgo(item.submitted_at)}</span>
                  </div>
                </div>
                <div className="bg-card rounded-lg p-4 border border-line mb-4">
                  <p className="text-sm text-ink-secondary leading-relaxed">{item.copy ?? item.caption}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveItem(item.id)}
                    className="flex-1 py-2.5 text-xs rounded-lg bg-ink text-page hover:opacity-90 transition-colors font-semibold"
                  >
                    Approve & schedule
                  </button>
                  <button className="flex-1 py-2.5 text-xs rounded-lg bg-surface text-ink-secondary hover:text-ink transition-colors">
                    Editar
                  </button>
                  <button
                    onClick={() => rejectItem(item.id)}
                    className="px-4 py-2.5 text-xs rounded-lg bg-surface text-ink-tertiary hover:text-red-400 transition-colors"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
