'use client'
import { useEffect, useState } from 'react'
import { CheckSquare, Clock, AlertTriangle, Check, Edit3, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { clsx } from 'clsx'
import type { ApprovalItem } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected'
type LocalStatus = 'pending_review' | 'approved' | 'rejected'

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'pending',  label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h`
}

export default function ApprovalsPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id

  const [items, setItems] = useState<ApprovalItem[]>([])
  const [filter, setFilter] = useState<FilterTab>('pending')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [clientId])

  const updateStatus = async (id: string, status: LocalStatus) => {
    const db = createClient()
    await db.from('approval_queue')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const filtered = items.filter(i => {
    if (filter === 'all') return true
    if (filter === 'pending') return i.status === 'pending_review'
    if (filter === 'approved') return i.status === 'approved' || i.status === 'approved_with_edits'
    if (filter === 'rejected') return i.status === 'rejected'
    return true
  })

  const pending  = items.filter(i => i.status === 'pending_review').length
  const approved = items.filter(i => i.status === 'approved' || i.status === 'approved_with_edits').length
  const warned   = items.filter(i => i.tone_warning && i.status === 'pending_review').length

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-[#444] animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Approval Queue</h1>
        <p className="text-[#555] mt-1 text-sm">Review and approve content before it goes live.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Waiting for your ok',   value: pending,  icon: Clock,        color: 'text-amber-400',  bg: 'bg-amber-500/10' },
          { label: 'Approved today',     value: approved, icon: Check,        color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'With warning',   value: warned,   icon: AlertTriangle, color: 'text-red-400',   bg: 'bg-red-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card px-5 py-4 flex items-center gap-4">
            <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">{value}</p>
              <p className="text-[11px] text-[#555]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6">
        {FILTER_TABS.map(tab => {
          const count = tab.id === 'all' ? items.length
            : tab.id === 'pending' ? pending
            : tab.id === 'approved' ? approved
            : items.filter(i => i.status === 'rejected').length
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all',
                filter === tab.id ? 'bg-white/10 text-white font-medium' : 'text-[#555] hover:text-white'
              )}
            >
              {tab.label}
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-full',
                filter === tab.id ? 'bg-white/15 text-white' : 'bg-[#1A1A1A] text-[#555]'
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card py-14 text-center">
            <CheckSquare size={24} className="text-[#333] mx-auto mb-3" />
            <p className="text-sm text-[#555]">
              {filter === 'pending' ? 'Nothing pending. All up to date.' : 'No items in this category.'}
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
                <div className="w-8 h-8 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-sm shrink-0">
                  {item.platform === 'Instagram' ? '📸' : item.platform === 'LinkedIn' ? '💼' : item.platform === 'TikTok' ? '🎵' : '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm text-white font-medium">{item.platform ?? item.tipo}</p>
                    <span className="text-[10px] text-[#555]">· {item.tipo}</span>
                  </div>
                  <p className="text-xs text-[#444] truncate">{item.copy ?? item.caption ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.tone_warning && isPending && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">⚠ Review tone</span>
                  )}
                  {isApproved && (
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">✓ Approved</span>
                  )}
                  {item.status === 'rejected' && (
                    <span className="text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">Rejected</span>
                  )}
                  <span className="text-[11px] text-[#444]">{timeAgo(item.submitted_at)}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5">
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-[#1A1A1A] mb-4">
                    {item.copy && <p className="text-sm text-[#ddd] leading-relaxed whitespace-pre-line">{item.copy}</p>}
                    {item.caption && item.caption !== item.copy && (
                      <p className="text-xs text-[#666] mt-2 leading-relaxed">{item.caption}</p>
                    )}
                    {item.hashtags && item.hashtags.length > 0 && (
                      <p className="text-xs text-[#555] mt-2">{item.hashtags.join(' ')}</p>
                    )}
                  </div>
                  {isPending && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(item.id, 'approved')}
                        className="flex-1 py-2.5 text-xs rounded-lg bg-white text-black hover:bg-white/90 transition-colors font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Check size={13} /> Approve Aprobar y agendar schedule
                      </button>
                      <button className="flex-1 py-2.5 text-xs rounded-lg bg-[#1A1A1A] text-[#888] hover:text-white transition-colors flex items-center justify-center gap-1.5">
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, 'rejected')}
                        className="px-4 py-2.5 text-xs rounded-lg bg-[#1A1A1A] text-[#666] hover:text-red-400 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  {isApproved && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 py-1">
                      <Check size={12} /> Approved — in publishing queue
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
