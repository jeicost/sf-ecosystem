'use client'
import { useEffect, useState } from 'react'
import { type Lead, getClassification } from '@/lib/supabase'
import { ExternalLink, Mail, Link2, Search } from 'lucide-react'

const CLASSIFICATIONS = ['all', 'hot', 'warm', 'cold', 'disqualify'] as const
type Filter = typeof CLASSIFICATIONS[number]

function ScoreBar({ score }: { score: number | null }) {
  const s = score ?? 0
  const color = s >= 75 ? 'var(--red)' : s >= 50 ? 'var(--yellow)' : s >= 20 ? 'var(--blue)' : 'var(--text-dim)'
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar flex-1" style={{ position: 'relative' }}>
        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)' }}>
          <div style={{ width: `${s}%`, height: '100%', borderRadius: '2px', background: color, transition: 'width 0.3s' }} />
        </div>
      </div>
      <span className="text-xs font-mono font-semibold w-7 text-right" style={{ color }}>{s}</span>
    </div>
  )
}

function Badge({ cls }: { cls: string }) {
  const labels: Record<string, string> = { hot: '🔥 Hot', warm: '🟡 Warm', cold: '🔵 Cold', disqualify: '❌ Out' }
  return <span className={`badge-${cls}`}>{labels[cls] ?? cls}</span>
}

const STAGE_COLORS: Record<string, string> = {
  prospected: 'var(--text-dim)', contacted: 'var(--blue)',
  replied: '#A78BFA', qualified: 'var(--yellow)',
  proposal: '#FB923C', won: 'var(--green)', lost: 'var(--red)',
}
const STAGE_LABELS: Record<string, string> = {
  prospected: 'Prospectado', contacted: 'Contactado', replied: 'Respondió',
  qualified: 'Calificado', proposal: 'Propuesta', won: 'Cerrado', lost: 'Perdido',
}
const STAGES = ['prospected','contacted','replied','qualified','proposal','won','lost']

function StageSelect({ leadId, stage, onUpdate }: {
  leadId: string, stage: string, onUpdate: (id: string, stage: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [notionOk, setNotionOk] = useState<boolean | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStage = e.target.value
    setSaving(true)
    setNotionOk(null)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })
      const data = await res.json()
      if (data.success) {
        onUpdate(leadId, newStage)
        setNotionOk(data.notion_updated)
      }
    } finally {
      setSaving(false)
      setTimeout(() => setNotionOk(null), 2000)
    }
  }

  const color = STAGE_COLORS[stage] ?? 'var(--text-dim)'
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <select value={stage} onChange={handleChange} disabled={saving}
        className="text-xs bg-transparent border-none outline-none cursor-pointer"
        style={{ color, fontFamily: 'inherit' }}>
        {STAGES.map(s => (
          <option key={s} value={s} style={{ background: '#111118', color: STAGE_COLORS[s] ?? '#666' }}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      {saving && <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>...</span>}
      {notionOk === true  && <span className="text-[10px]" style={{ color: 'var(--green)' }}>✓ Notion</span>}
      {notionOk === false && <span className="text-[10px]" style={{ color: 'var(--yellow)' }}>⚠ Notion</span>}
    </div>
  )
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/leads')
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  function handleStageUpdate(id: string, stage: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
  }

  const filtered = leads.filter(l => {
    const cls = getClassification(l.hot_score)
    const matchCls = filter === 'all' || cls === filter
    const matchSearch = !search ||
      (l.company_name?.toLowerCase().includes(search.toLowerCase()) ||
       l.industry?.toLowerCase().includes(search.toLowerCase()) ||
       l.geography?.toLowerCase().includes(search.toLowerCase()))
    return matchCls && matchSearch
  })

  const stats = {
    total: leads.length,
    hot:        leads.filter(l => (l.hot_score ?? 0) >= 75).length,
    warm:       leads.filter(l => { const s = l.hot_score ?? 0; return s >= 50 && s < 75 }).length,
    cold:       leads.filter(l => { const s = l.hot_score ?? 0; return s >= 20 && s < 50 }).length,
    disqualify: leads.filter(l => (l.hot_score ?? 0) < 20).length,
  }

  return (
    <div className="px-8 py-7">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Pipeline</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {leads.length} leads · Venture Builders España · SF interno
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',      value: stats.total,      color: 'var(--text)' },
          { label: '🔥 Hot',    value: stats.hot,        color: 'var(--red)' },
          { label: '🟡 Warm',   value: stats.warm,       color: 'var(--yellow)' },
          { label: '🔵 Cold',   value: stats.cold,       color: 'var(--blue)' },
          { label: '❌ Fuera',  value: stats.disqualify, color: 'var(--text-dim)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-dim)' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-dim)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa, sector..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Classification filter */}
        <div className="flex gap-1">
          {CLASSIFICATIONS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs rounded-lg transition-all"
              style={{
                background: filter === f ? 'rgba(99,102,241,0.15)' : 'var(--surface)',
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                color: filter === f ? 'white' : 'var(--text-dim)',
                fontWeight: filter === f ? 600 : 400,
              }}>
              {f === 'all' ? 'Todos' : f === 'hot' ? '🔥 Hot' : f === 'warm' ? '🟡 Warm' : f === 'cold' ? '🔵 Cold' : '❌ Fuera'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Empresa', 'Sector', 'Geografía', 'Score', 'Clasificación', 'Stage', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Cargando...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-dim)' }}>Sin resultados</td></tr>
            )}
            {filtered.map((lead, i) => {
              const cls = getClassification(lead.hot_score)
              return (
                <tr key={lead.id}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : undefined,
                    background: 'transparent',
                  }}
                  className="hover:bg-white/2 transition-colors">
                  {/* Empresa */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{lead.company_name ?? '—'}</div>
                    {lead.company_website && (
                      <a href={lead.company_website} target="_blank" rel="noopener"
                        className="text-[11px] flex items-center gap-1 mt-0.5"
                        style={{ color: 'var(--accent)' }}>
                        {lead.company_website.replace(/^https?:\/\//, '')}
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </td>
                  {/* Sector */}
                  <td className="px-4 py-3 text-xs max-w-[140px]" style={{ color: 'var(--text-dim)' }}>
                    <div className="truncate">{lead.industry ?? '—'}</div>
                  </td>
                  {/* Geografía */}
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-dim)' }}>
                    {lead.geography?.split(' — ')[0] ?? '—'}
                  </td>
                  {/* Score */}
                  <td className="px-4 py-3 w-32">
                    <ScoreBar score={lead.hot_score} />
                  </td>
                  {/* Clasificación */}
                  <td className="px-4 py-3">
                    <Badge cls={cls} />
                  </td>
                  {/* Stage — editable, sync a Notion */}
                  <td className="px-4 py-3">
                    <StageSelect leadId={lead.id} stage={lead.stage} onUpdate={handleStageUpdate} />
                  </td>
                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`}
                          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                          style={{ color: 'var(--text-dim)' }} title={lead.email}>
                          <Mail size={13} />
                        </a>
                      )}
                      {lead.linkedin_url && (
                        <a href={lead.linkedin_url} target="_blank" rel="noopener"
                          className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                          style={{ color: 'var(--text-dim)' }} title="LinkedIn">
                          <Link2 size={13} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
        {filtered.length} de {leads.length} leads · Fuente: Supabase
      </p>
    </div>
  )
}
