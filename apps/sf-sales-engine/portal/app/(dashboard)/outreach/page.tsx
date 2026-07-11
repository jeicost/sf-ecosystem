'use client'
import { useEffect, useState } from 'react'
import { type Lead } from '@/lib/supabase'
import { Mail, ExternalLink, Copy, Check } from 'lucide-react'

const SF_CLIENT_ID = '00000000-0000-0000-0000-000000000001'

function IcebreakerCard({ lead }: { lead: Lead }) {
  const [copied, setCopied] = useState(false)

  const icebreaker = lead.icebreaker_used
    ?? `Sin icebreaker — ejecuta: uv run python scripts/generate_icebreakers.py`

  function copy() {
    navigator.clipboard.writeText(icebreaker)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-medium text-white text-sm">{lead.company_name}</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
            {lead.industry?.split('/')[0].trim()} · {lead.geography?.split(' — ')[0]}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="badge-hot">🔥 {lead.hot_score}</span>
        </div>
      </div>

      <div className="rounded-lg p-3 text-sm leading-relaxed mb-3"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--text)' }}>
        {lead.linkedin_summary
          ? `"${lead.linkedin_summary.slice(0, 120)}..." — Curioso cómo estáis llevando la parte de adquisición en las startups de vuestro portafolio. ¿Tiene sentido hablar 20 minutos?`
          : icebreaker}
      </div>

      <div className="flex items-center gap-2">
        {lead.email && (
          <a href={`mailto:${lead.email}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Mail size={12} /> {lead.email}
          </a>
        )}
        {lead.linkedin_url && (
          <a href={lead.linkedin_url} target="_blank" rel="noopener"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>
            <ExternalLink size={12} /> LinkedIn
          </a>
        )}
        <button onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ml-auto"
          style={{ background: 'var(--surface)', color: copied ? 'var(--green)' : 'var(--text-dim)', border: '1px solid var(--border)' }}>
          {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
        </button>
      </div>
    </div>
  )
}

export default function OutreachPage() {
  const [hotLeads, setHotLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/leads?min_score=75&stage=prospected')
      const data = await res.json()
      setHotLeads(Array.isArray(data) ? data : [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="px-8 py-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Outreach</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {hotLeads.length} hot leads sin contactar · Listos para outreach
        </p>
      </div>

      <div className="rounded-lg p-4 mb-6 flex items-start gap-3"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="text-lg">💡</div>
        <div>
          <p className="text-sm font-medium text-white mb-0.5">Icebreakers generados con el Commercial Brain</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Cada mensaje usa la descripción real del VB. En Semana 3 se generarán con Claude Sonnet
            consumiendo LinkedIn, noticias y señales de trigger automáticamente.
          </p>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-center py-12" style={{ color: 'var(--text-dim)' }}>Cargando hot leads...</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {hotLeads.map(lead => <IcebreakerCard key={lead.id} lead={lead} />)}
      </div>

      {!loading && hotLeads.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-dim)' }}>
          <p className="text-sm">No hay hot leads sin contactar</p>
          <p className="text-xs mt-1">Ejecuta <code style={{ color: 'var(--accent)' }}>make seed-vbs</code> para cargar leads</p>
        </div>
      )}
    </div>
  )
}
