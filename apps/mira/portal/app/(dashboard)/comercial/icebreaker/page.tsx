'use client'
import { useEffect, useState } from 'react'
import { Loader2, Copy, Check, Zap, Users, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { HOT_SCORE_THRESHOLD } from '@/lib/constants'
import { useLocaleContext } from '@/app/locale-provider'
import { clsx } from 'clsx'

const ICEBREAKER_COLS = 'id,hot_score,company_name,first_name,last_name,title,industry,geography,trigger_event,linkedin_summary,icebreaker_used'

type Mode = 'from-lead' | 'manual'

const VARIANT_LABELS = ['A — Directa', 'B — Educacional', 'C — Casual']
const VARIANT_RE = /VARIANTE\s+[ABC]/i

function parseVariants(text: string): string[] {
  const parts = text.split(VARIANT_RE).filter(p => p.trim())
  return parts.length >= 3 ? parts.slice(0, 3).map(p => p.trim()) : [text.trim()]
}

export default function IcebreakerPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

  const [mode, setMode]           = useState<Mode>('manual')
  const [hotLeads, setHotLeads]   = useState<Lead[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [rawText, setRawText]     = useState('')
  const [variants, setVariants]   = useState<string[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [copied, setCopied]       = useState(false)
  const [saved, setSaved]         = useState(false)

  const [manualForm, setManualForm] = useState({
    firstName: '', lastName: '', company: '', title: '',
    industry: '', geography: '', triggerEvent: '', linkedinNote: '',
  })

  useEffect(() => {
    createClient()
      .from('leads')
      .select(ICEBREAKER_COLS)
      .eq('client_id', clientId)
      .gte('hot_score', HOT_SCORE_THRESHOLD)
      .order('hot_score', { ascending: false })
      .then(({ data }) => {
        if (data) setHotLeads(data as Lead[])
        setLoadingLeads(false)
      })
  }, [clientId])

  const selected = hotLeads.find(l => l.id === selectedId)

  async function streamIcebreaker(message: string) {
    setGenerating(true)
    setRawText('')
    setVariants([])
    setSaved(false)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'icebreaker-writer', message, includeBrandBrain: true, locale }),
      })
      if (!res.ok || !res.body) throw new Error('Error')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setRawText(full)
        setActiveTab(0)
      }
      const parsed = parseVariants(full)
      setVariants(parsed)
    } catch {
      setRawText('Error al generar. Inténtalo de nuevo.')
      setVariants(['Error al generar. Inténtalo de nuevo.'])
    } finally {
      setGenerating(false)
    }
  }

  function generateFromLead() {
    if (!selected) return
    const msg = `Genera 3 variantes de icebreaker (VARIANTE A, VARIANTE B, VARIANTE C) para este prospect B2B:

PROSPECT:
- Nombre: ${[selected.first_name, selected.last_name].filter(Boolean).join(' ') || 'No disponible'}
- Cargo: ${selected.title ?? 'No disponible'}
- Empresa: ${selected.company_name ?? 'No disponible'}
- Industria: ${selected.industry ?? 'No disponible'}
- Geografía: ${selected.geography ?? 'No disponible'}
- Trigger event: ${selected.trigger_event ?? 'No detectado'}
- LinkedIn summary: ${selected.linkedin_summary ?? 'No disponible'}

Genera las 3 variantes ahora.`

    streamIcebreaker(msg)
  }

  function generateManual() {
    const { firstName, company, title, industry, geography, triggerEvent, linkedinNote } = manualForm
    if (!firstName || !company) return
    const msg = `Genera 3 variantes de icebreaker (VARIANTE A, VARIANTE B, VARIANTE C) para este prospect B2B:

PROSPECT:
- Nombre: ${firstName} ${manualForm.lastName}
- Empresa: ${company}
- Cargo: ${title}
- Industria: ${industry}
- Geografía: ${geography}
- Evento trigger: ${triggerEvent || 'No especificado'}
- Notas LinkedIn: ${linkedinNote || 'No disponibles'}

Genera las 3 variantes ahora.`

    streamIcebreaker(msg)
  }

  async function saveVariant(text: string) {
    if (!selected || saved) return
    await fetch(`/api/comercial/leads/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icebreaker_used: text }),
    })
    setHotLeads(prev => prev.map(l => l.id === selected.id ? { ...l, icebreaker_used: text } : l))
    setSaved(true)
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const f = (field: keyof typeof manualForm, val: string) =>
    setManualForm(prev => ({ ...prev, [field]: val }))

  const manualValid = manualForm.firstName && manualForm.company
  const displayVariants = variants.length >= 2 ? variants : rawText ? [rawText] : []

  if (loadingLeads) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
    </div>
  )

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">✍️</span>
            <h1 className="text-2xl font-semibold text-ink">Finn — Icebreaker</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Genera 3 variantes de primer mensaje ultra-personalizado.</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
        <button onClick={() => setMode('manual')}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all',
            mode === 'manual' ? 'bg-surface-hover text-ink font-medium' : 'hover:text-ink')}
          style={mode !== 'manual' ? { color: 'var(--text-secondary)' } : undefined}>
          <Zap size={12} /> Entrada manual
        </button>
        <button onClick={() => setMode('from-lead')}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all',
            mode === 'from-lead' ? 'bg-surface-hover text-ink font-medium' : 'hover:text-ink')}
          style={mode !== 'from-lead' ? { color: 'var(--text-secondary)' } : undefined}>
          <Users size={12} /> Desde pipeline
          {hotLeads.length > 0 && (
            <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 rounded-full">{hotLeads.length}</span>
          )}
        </button>
      </div>

      {/* ── MANUAL ── */}
      {mode === 'manual' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Nombre *', field: 'firstName' as const, placeholder: 'Carlos' },
              { label: 'Apellido', field: 'lastName' as const, placeholder: 'García' },
              { label: 'Empresa *', field: 'company' as const, placeholder: 'Acme Corp' },
              { label: 'Cargo', field: 'title' as const, placeholder: 'Head of Growth' },
              { label: 'Industria', field: 'industry' as const, placeholder: 'SaaS B2B' },
              { label: 'Geografía', field: 'geography' as const, placeholder: 'Madrid, España' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="card p-3">
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <input value={manualForm[field]} onChange={e => f(field, e.target.value)} placeholder={placeholder}
                  className="w-full bg-transparent text-sm text-ink outline-none" style={{ color: 'var(--text-primary)' }} />
              </div>
            ))}
          </div>
          <div className="card p-4">
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Evento trigger (opcional)</label>
            <input value={manualForm.triggerEvent} onChange={e => f('triggerEvent', e.target.value)}
              placeholder="Ej: Acaban de levantar una ronda Serie A de $5M"
              className="w-full bg-transparent text-sm text-ink outline-none" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="card p-4">
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notas LinkedIn</label>
            <textarea value={manualForm.linkedinNote} onChange={e => f('linkedinNote', e.target.value)}
              placeholder="Ej: Publicó sobre IA la semana pasada..."
              rows={3} className="w-full bg-transparent text-sm text-ink outline-none resize-none leading-relaxed" style={{ color: 'var(--text-primary)' }} />
          </div>
          <button onClick={generateManual} disabled={!manualValid || generating}
            className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ background: generating ? 'var(--bg-surface-hover)' : '#EAB308', color: '#000' }}>
            {generating
              ? <><Loader2 size={16} className="animate-spin text-ink" /><span className="text-ink">Finn escribiendo…</span></>
              : <><Zap size={16} /> Generar 3 variantes con Finn</>}
          </button>
        </div>
      )}

      {/* ── FROM PIPELINE ── */}
      {mode === 'from-lead' && (
        <div className="space-y-5">
          {hotLeads.length === 0 ? (
            <div className="card py-16 text-center">
              <p className="text-ink-muted text-sm mb-2">No hay leads hot (≥75) en el pipeline.</p>
              <p className="text-ink-muted text-xs">Usa Rex para descubrir leads o la entrada manual.</p>
            </div>
          ) : (
            <>
              <div className="card p-5">
                <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Selecciona un lead hot</label>
                <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setRawText(''); setVariants([]) }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none appearance-none" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                  <option value="">— Elige un lead —</option>
                  {hotLeads.map(l => (
                    <option key={l.id} value={l.id}>
                      🔥 {l.hot_score} · {l.company_name ?? 'Sin empresa'} — {l.first_name ?? ''} {l.last_name ?? ''}
                    </option>
                  ))}
                </select>
              </div>

              {selected && (
                <div className="card p-5 space-y-3">
                  <p className="text-[11px] text-ink-muted uppercase tracking-wider">Contexto del lead</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Empresa', val: selected.company_name },
                      { label: 'Cargo', val: selected.title },
                      { label: 'Industria', val: selected.industry },
                      { label: 'Geografía', val: selected.geography },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                        <p className="text-ink-secondary">{val ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {selected.trigger_event && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                      <p className="text-[11px] mb-1" style={{ color: 'rgba(180, 83, 9, 0.7)' }}>Trigger event</p>
                      <p className="text-sm text-ink-secondary">{selected.trigger_event}</p>
                    </div>
                  )}
                  {selected.icebreaker_used && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-page)', borderColor: 'rgba(34, 197, 94, 0.15)', borderWidth: '1px' }}>
                      <p className="text-[11px] mb-1" style={{ color: 'rgba(134, 239, 172, 0.6)' }}>Icebreaker guardado</p>
                      <p className="text-sm text-ink-secondary italic">{selected.icebreaker_used}</p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={generateFromLead} disabled={!selectedId || generating}
                className="w-full py-3 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {generating
                  ? <><Loader2 size={16} className="animate-spin" /> Finn escribiendo…</>
                  : <><Zap size={16} /> Generar 3 variantes</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── OUTPUT ── */}
      {(rawText || generating) && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>✍️ Finn — {displayVariants.length > 1 ? '3 Variantes' : 'Resultado'}</p>
            {generating && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />}
          </div>

          {displayVariants.length > 1 ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                {displayVariants.map((_, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className={clsx(
                      'flex-1 py-1.5 text-[11px] rounded-md transition-all font-medium border',
                      activeTab === i ? 'bg-[#EAB308]/15 text-[#EAB308] border-[#EAB308]/25' : 'hover:text-ink border-transparent'
                    )}
                    style={activeTab !== i ? { color: 'var(--text-secondary)' } : undefined}>
                    {VARIANT_LABELS[i] ?? `Variante ${i + 1}`}
                  </button>
                ))}
              </div>

              {/* Current variant */}
              <div className="rounded-lg p-4 mb-3" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'var(--text-primary)' }}>
                  {displayVariants[activeTab]}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => copy(displayVariants[activeTab])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-all hover:text-ink" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  {copied ? <><Check size={11} className="text-emerald-400" /> Copiado</> : <><Copy size={11} /> Copiar</>}
                </button>
                {selected && (
                  <button onClick={() => saveVariant(displayVariants[activeTab])}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all',
                      saved
                        ? 'text-green-400 border border-green-400/20 bg-green-400/8 cursor-default'
                        : 'text-[#EAB308] border border-[#EAB308]/25 bg-[#EAB308]/8 hover:bg-[#EAB308]/15'
                    )}>
                    {saved ? <><Check size={11} /> Guardado en lead</> : 'Usar esta variante →'}
                  </button>
                )}
                <button onClick={mode === 'from-lead' ? generateFromLead : generateManual}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] hover:text-ink transition-all" style={{ color: 'var(--text-secondary)' }}>
                  <RefreshCw size={11} /> Regenerar
                </button>
              </div>
            </>
          ) : (
            <pre className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap font-sans">{rawText}</pre>
          )}
        </div>
      )}
    </div>
  )
}
