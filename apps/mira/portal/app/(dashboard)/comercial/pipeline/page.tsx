'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { Loader2, X, ExternalLink, Mail, LinkedinIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'
import { CLIENT_ID, HOT_SCORE_THRESHOLD } from '@/lib/constants'
import type { Lead, LeadStage } from '@/lib/types'
import LeadCard from '@/components/lead-card'
import { scoreLabel } from '@/lib/score-utils'

const TERMINAL_STAGES: LeadStage[] = ['won', 'lost']

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'prospected',  label: 'Prospectados', color: '#555' },
  { key: 'contacted',   label: 'Contactados',  color: '#3B82F6' },
  { key: 'replied',     label: 'Respondieron', color: '#8B5CF6' },
  { key: 'qualified',   label: 'Calificados',  color: '#F59E0B' },
  { key: 'proposal',    label: 'Propuesta',    color: '#F97316' },
  { key: 'negotiation', label: 'Negociación',  color: '#EF4444' },
  { key: 'won',         label: 'Ganados',      color: '#22C55E' },
  { key: 'lost',        label: 'Perdidos',     color: '#444' },
]

const PIPELINE_COLS = 'id,stage,hot_score,company_name,first_name,last_name,title,industry,geography,trigger_event,icebreaker_used,email,linkedin_url,company_website,notes,bant_score,source,created_at'

export default function PipelinePage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id ?? CLIENT_ID

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    setLoading(true)
    const db = createClient()

    db.from('leads')
      .select(PIPELINE_COLS)
      .eq('client_id', clientId)
      .order('hot_score', { ascending: false })
      .then(({ data }) => {
        if (data) setLeads(data as Lead[])
        setLoading(false)
      })

    const channel = db
      .channel(`leads-realtime-${clientId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `client_id=eq.${clientId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [...prev, payload.new as Lead].sort((a, b) => (b.hot_score ?? 0) - (a.hot_score ?? 0)))
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? { ...l, ...payload.new as Lead } : l))
            setSelectedLead(prev => prev?.id === payload.new.id ? { ...prev, ...payload.new as Lead } : prev)
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== (payload.old as Lead).id))
          }
        }
      ).subscribe()

    return () => { db.removeChannel(channel) }
  }, [clientId])

  const handleStageChange = useCallback((id: string, stage: LeadStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
    setSelectedLead(prev => prev?.id === id ? { ...prev, stage } : prev)
  }, [])

  const stageGroups = useMemo(() => {
    const groups = new Map<LeadStage, Lead[]>(STAGES.map(s => [s.key, []]))
    for (const lead of leads) groups.get(lead.stage)?.push(lead)
    return groups
  }, [leads])

  const hotCount    = leads.filter(l => (l.hot_score ?? 0) >= HOT_SCORE_THRESHOLD).length
  const avgScore    = leads.length ? Math.round(leads.reduce((s, l) => s + (l.hot_score ?? 0), 0) / leads.length) : 0
  const activeCount = leads.filter(l => !TERMINAL_STAGES.includes(l.stage)).length

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="text-[#444] animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Pipeline Comercial</h1>
        <p className="text-[#555] mt-1 text-sm">Leads activos y su estado en el ciclo de ventas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total leads',    value: leads.length },
          { label: 'Hot (≥75)',      value: hotCount },
          { label: 'Score promedio', value: avgScore },
          { label: 'En pipeline',    value: activeCount },
        ].map(({ label, value }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(({ key, label, color }) => {
          const cols = stageGroups.get(key) ?? []
          return (
            <div key={key} className="flex-shrink-0 w-52">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-medium text-[#888]">{label}</span>
                <span
                  className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: `${color}20`, color }}
                >{cols.length}</span>
              </div>
              <div className="space-y-2">
                {cols.length === 0 ? (
                  <div className="border border-dashed border-[#1A1A1A] rounded-lg h-16 flex items-center justify-center">
                    <span className="text-[10px] text-[#333]">Vacío</span>
                  </div>
                ) : cols.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onStageChange={handleStageChange}
                    onClick={setSelectedLead}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lead detail modal */}
      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} onStageChange={handleStageChange} />
      )}
    </div>
  )
}

function LeadModal({ lead, onClose, onStageChange }: {
  lead: Lead
  onClose: () => void
  onStageChange: (id: string, stage: LeadStage) => void
}) {
  const score = scoreLabel(lead.hot_score)
  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sin nombre'
  const stageInfo = STAGES.find(s => s.key === lead.stage)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-[420px] h-full bg-[#0c0c0c] border-l border-[#1a1a1a] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#141414] flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-white leading-tight">{lead.company_name ?? '—'}</p>
            <p className="text-[12px] text-[#555] mt-0.5">{displayName} · {lead.title ?? '—'}</p>
          </div>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Score + Stage */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-[#141414]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold"
            style={{ background: `${score.color}15`, border: `1px solid ${score.color}30`, color: score.color }}>
            {score.emoji} {lead.hot_score ?? '—'}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: `${stageInfo?.color ?? '#555'}15`, border: `1px solid ${stageInfo?.color ?? '#555'}30`, color: stageInfo?.color ?? '#888' }}>
            {stageInfo?.label ?? lead.stage}
          </div>
          {lead.bant_score !== null && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-[#666] bg-[#111] border border-[#1a1a1a]">
              BANT {lead.bant_score}/4
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-6 py-4 space-y-4 flex-1">
          <InfoRow label="Industria" value={lead.industry} />
          <InfoRow label="Geografía" value={lead.geography} />
          <InfoRow label="Tamaño" value={lead.company_size} />
          <InfoRow label="Fuente" value={lead.source} />

          {lead.trigger_event && (
            <div>
              <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">Trigger event</p>
              <p className="text-[12px] text-[#888] italic">{lead.trigger_event}</p>
            </div>
          )}

          {lead.icebreaker_used && (
            <div>
              <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">Icebreaker</p>
              <p className="text-[12px] text-[#777] leading-relaxed bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-3">
                {lead.icebreaker_used}
              </p>
            </div>
          )}

          {lead.notes && (
            <div>
              <p className="text-[10px] text-[#444] uppercase tracking-wider mb-1">Notas</p>
              <p className="text-[12px] text-[#777]">{lead.notes}</p>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="px-6 py-4 border-t border-[#141414] flex gap-2 flex-wrap">
          {lead.email && (
            <a href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#666] bg-[#111] border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a] transition-all">
              <Mail size={11} /> {lead.email}
            </a>
          )}
          {lead.linkedin_url && (
            <a href={lead.linkedin_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#666] bg-[#111] border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a] transition-all">
              <LinkedinIcon size={11} /> LinkedIn
            </a>
          )}
          {lead.company_website && (
            <a href={lead.company_website} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-[#666] bg-[#111] border border-[#1a1a1a] hover:text-white hover:border-[#2a2a2a] transition-all">
              <ExternalLink size={11} /> Web
            </a>
          )}
        </div>

        {/* Stage actions */}
        <div className="px-6 py-4 border-t border-[#141414]">
          <p className="text-[10px] text-[#444] uppercase tracking-wider mb-2">Cambiar etapa</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.filter(s => s.key !== lead.stage).map(s => (
              <button
                key={s.key}
                onClick={async () => {
                  await fetch(`/api/comercial/leads/${lead.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stage: s.key }),
                  })
                  onStageChange(lead.id, s.key)
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] transition-all hover:text-white"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}25`, color: s.color + '99' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between">
      <p className="text-[10px] text-[#444] uppercase tracking-wider">{label}</p>
      <p className="text-[12px] text-[#777]">{value}</p>
    </div>
  )
}
