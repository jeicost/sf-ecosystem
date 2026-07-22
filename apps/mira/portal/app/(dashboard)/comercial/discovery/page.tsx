'use client'
import { useState } from 'react'
import { Search, Loader2, Plus, CheckCircle2, ChevronDown } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { clsx } from 'clsx'

interface DiscoveredLead {
  company_name: string
  company_website: string | null
  linkedin_url: string | null
  industry: string
  geography: string
  key_person_name: string | null
  key_person_title: string | null
  description: string
  trigger_signals: string[]
  score: number
  classification: 'hot' | 'warm' | 'cold' | 'disqualify'
  reason: string
}

const CLASS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  hot:        { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'HOT' },
  warm:       { color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'WARM' },
  cold:       { color: '#6B7280', bg: 'rgba(107,114,128,0.12)',label: 'COLD' },
  disqualify: { color: '#374151', bg: 'rgba(55,65,81,0.12)',   label: 'DESC' },
}

export default function DiscoveryPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

  const [keywords, setKeywords]   = useState('')
  const [industry, setIndustry]   = useState('')
  const [geography, setGeography] = useState('')
  const [limit, setLimit]         = useState(20)

  const [running, setRunning]     = useState(false)
  const [status, setStatus]       = useState('')
  const [leads, setLeads]         = useState<DiscoveredLead[]>([])
  const [savedCount, setSavedCount] = useState<number | null>(null)
  const [added, setAdded]         = useState<Set<string>>(new Set())

  async function runDiscovery() {
    if (!keywords.trim() || running) return
    setRunning(true)
    setLeads([])
    setSavedCount(null)
    setStatus('Iniciando búsqueda...')

    try {
      const res = await fetch('/api/comercial/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, industry, geography, limit, clientId }),
      })

      if (!res.body) throw new Error('No stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n').filter(Boolean)
        for (const line of lines) {
          try {
            const msg = JSON.parse(line)
            if (msg.type === 'status') setStatus(msg.message)
            if (msg.type === 'done') {
              setLeads(msg.leads ?? [])
              setSavedCount(msg.saved ?? 0)
              setStatus('')
            }
            if (msg.type === 'error') setStatus(`Error: ${msg.message}`)
          } catch {}
        }
      }
    } catch (e) {
      setStatus(`Error: ${String(e)}`)
    } finally {
      setRunning(false)
    }
  }

  async function addToPipeline(lead: DiscoveredLead) {
    const key = lead.company_name
    setAdded(prev => new Set([...prev, key]))
    await fetch('/api/comercial/discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: lead.company_name,
        industry: lead.industry,
        geography: lead.geography,
        limit: 1,
        clientId,
      }),
    }).catch(() => {})
  }

  const hotLeads  = leads.filter(l => l.classification === 'hot')
  const warmLeads = leads.filter(l => l.classification === 'warm')
  const rest      = leads.filter(l => l.classification !== 'hot' && l.classification !== 'warm')

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[22px]">🔍</span>
            <h1 className="text-2xl font-semibold text-ink">Rex — Lead Discovery</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('comercial.discovery.find-companies', locale)}</p>
        </div>
      </div>

      {/* Search form */}
      <div className="card p-5 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              Palabras clave <span className="text-[#EF4444]">*</span>
            </label>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runDiscovery()}
              placeholder='Ej: "venture builder España" o "startup studio LATAM"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Industria</label>
            <input
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder='Ej: "Venture Capital" o "SaaS B2B"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.discovery.geography', locale)}</label>
            <input
              value={geography}
              onChange={e => setGeography(e.target.value)}
              placeholder='Ej: "España" o "LATAM"'
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none transition-colors"
              style={{
                background: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                borderWidth: '1px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.discovery.limit', locale)}</span>
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setLimit(n)}
                className={clsx(
                  'px-2.5 py-1 rounded text-[11px] transition-all border',
                  limit === n
                    ? 'bg-[#EF4444]/15 border-[#EF4444]/30 text-[#f87171]'
                    : 'hover:text-ink border-transparent'
                )}
                style={limit !== n ? { color: 'var(--text-tertiary)' } : undefined}>
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={runDiscovery}
            disabled={!keywords.trim() || running}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              keywords.trim() && !running
                ? 'bg-[#EF4444] text-white hover:bg-[#dc2626]'
                : 'bg-surface text-ink-muted cursor-not-allowed'
            )}
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            {running ? 'Buscando...' : 'Buscar con Rex'}
          </button>
        </div>

        {status && (
          <div className="mt-4 flex items-center gap-2 text-[12px]" style={{ color: 'rgba(239,68,68,0.7)' }}>
            <Loader2 size={12} className="animate-spin" />
            {status}
          </div>
        )}
      </div>

      {/* Results */}
      {leads.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <p className="text-sm text-ink font-medium">{leads.length} empresas encontradas</p>
            {savedCount !== null && (
              <span className="flex items-center gap-1 text-[11px] text-green-400">
                <CheckCircle2 size={11} /> {savedCount} {t('comercial.discovery.added-to-pipeline', locale)}
              </span>
            )}
          </div>

          {hotLeads.length > 0 && (
            <LeadGroup title="HOT" color="#EF4444" leads={hotLeads} added={added} onAdd={addToPipeline} />
          )}
          {warmLeads.length > 0 && (
            <LeadGroup title="WARM" color="#F97316" leads={warmLeads} added={added} onAdd={addToPipeline} />
          )}
          {rest.length > 0 && (
            <LeadGroup title="COLD / DESCARTADOS" color="var(--text-muted)" leads={rest} added={added} onAdd={addToPipeline} collapsed />
          )}
        </div>
      )}
    </div>
  )
}

function LeadGroup({ title, color, leads, added, onAdd, collapsed = false }: {
  title: string
  color: string
  leads: DiscoveredLead[]
  added: Set<string>
  onAdd: (l: DiscoveredLead) => void
  collapsed?: boolean
}) {
  const [open, setOpen] = useState(!collapsed)

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 mb-3 group"
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color }}>{title}</span>
        <span className="text-[10px] ml-1" style={{ color: 'var(--text-tertiary)' }}>({leads.length})</span>
        <ChevronDown size={12} className={clsx('transition-transform ml-1', !open && '-rotate-90')} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {open && (
        <div className="space-y-2">
          {leads.map(lead => (
            <DiscoveryLeadRow key={lead.company_name} lead={lead} added={added.has(lead.company_name)} onAdd={onAdd} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiscoveryLeadRow({ lead, added, onAdd }: {
  lead: DiscoveredLead
  added: boolean
  onAdd: (l: DiscoveredLead) => void
}) {
  const cls = CLASS_STYLE[lead.classification] ?? CLASS_STYLE.cold

  return (
    <div className="card p-4 flex items-start gap-4">
      {/* Score */}
      <div className="shrink-0 text-center w-12">
        <div className="text-lg font-bold" style={{ color: cls.color }}>{lead.score}</div>
        <div className="text-[9px] font-semibold uppercase" style={{ color: cls.color }}>{cls.label}</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-ink">{lead.company_name}</p>
          {lead.company_website && (
            <a href={lead.company_website} target="_blank" rel="noreferrer"
              className="text-[10px] transition-colors" style={{ color: 'var(--text-tertiary)' }}>↗</a>
          )}
        </div>
        {lead.key_person_name && (
          <p className="text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
            {lead.key_person_name}{lead.key_person_title ? ` · ${lead.key_person_title}` : ''}
          </p>
        )}
        <p className="text-[11px] mb-2" style={{ color: 'var(--text-tertiary)' }}>{lead.description}</p>
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>{lead.industry}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>📍 {lead.geography}</span>
          {lead.trigger_signals.slice(0, 2).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[#f87171] border border-[#EF4444]/20">
              ⚡ {s}
            </span>
          ))}
        </div>
        <p className="text-[10px] mt-1.5 italic" style={{ color: 'var(--text-tertiary)' }}>{lead.reason}</p>
      </div>

      {/* Add button */}
      <button
        onClick={() => !added && onAdd(lead)}
        disabled={added}
        className={clsx(
          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all',
          added
            ? 'text-green-400 border border-green-400/20 bg-green-400/8 cursor-default'
            : 'text-[#EF4444] border border-[#EF4444]/25 bg-[#EF4444]/8 hover:bg-[#EF4444]/15'
        )}
      >
        {added ? <><CheckCircle2 size={11} /> En pipeline</> : <><Plus size={11} /> Añadir</>}
      </button>
    </div>
  )
}
