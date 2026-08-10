'use client'
import { useEffect, useState } from 'react'
import { Loader2, Copy, Check, Zap, Users, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { HOT_SCORE_THRESHOLD } from '@/lib/constants'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { clsx } from 'clsx'
import PageHeader from '@/components/ui/PageHeader'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'

const ICEBREAKER_COLS = 'id,hot_score,company_name,first_name,last_name,title,industry,geography,trigger_event,linkedin_summary,icebreaker_used'

type Mode = 'from-lead' | 'manual'

const VARIANT_RE = /VARIANTE\s+[ABC]/i

function parseVariants(text: string): string[] {
  const parts = text.split(VARIANT_RE).filter(p => p.trim())
  return parts.length >= 3 ? parts.slice(0, 3).map(p => p.trim()) : [text.trim()]
}

export default function IcebreakerPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

  const VARIANT_LABELS = [
    t('comercial.icebreaker.variant-a', locale),
    t('comercial.icebreaker.variant-b', locale),
    t('comercial.icebreaker.variant-c', locale),
  ]

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
    if (!clientId) {
      setLoadingLeads(false)
      return
    }
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
        // clientId explícito: sin él, la API caía al cliente del metadata del
        // usuario — con usuarios multi-marca, Brain equivocado (auditoría 08-10).
        body: JSON.stringify({ role: 'icebreaker-writer', message, includeBrandBrain: true, locale, clientId }),
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
      setRawText(t('comercial.icebreaker.error-generate', locale))
      setVariants([t('comercial.icebreaker.error-generate', locale)])
    } finally {
      setGenerating(false)
    }
  }

  function generateFromLead() {
    if (!selected) return
    const notAvailable = t('common.not-available', locale)
    const msg = t('comercial.icebreaker.prompt-from-lead', locale)
      .replace('{name}', [selected.first_name, selected.last_name].filter(Boolean).join(' ') || notAvailable)
      .replace('{title}', selected.title ?? notAvailable)
      .replace('{company}', selected.company_name ?? notAvailable)
      .replace('{industry}', selected.industry ?? notAvailable)
      .replace('{geography}', selected.geography ?? notAvailable)
      .replace('{trigger}', selected.trigger_event ?? t('comercial.icebreaker.not-detected', locale))
      .replace('{summary}', selected.linkedin_summary ?? notAvailable)

    streamIcebreaker(msg)
  }

  function generateManual() {
    const { firstName, company, title, industry, geography, triggerEvent, linkedinNote } = manualForm
    if (!firstName || !company) return
    const msg = t('comercial.icebreaker.prompt-manual', locale)
      .replace('{firstName}', firstName)
      .replace('{lastName}', manualForm.lastName)
      .replace('{company}', company)
      .replace('{title}', title)
      .replace('{industry}', industry)
      .replace('{geography}', geography)
      .replace('{triggerEvent}', triggerEvent || t('comercial.icebreaker.not-specified', locale))
      .replace('{linkedinNote}', linkedinNote || t('comercial.icebreaker.not-available-plural', locale))

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
      <PageHeader
        eyebrow={t('section.comercial', locale)}
        title="✍️ Finn — Icebreaker"
        subtitle={t('comercial.icebreaker.subtitle', locale)}
        eyebrowColor={DEPARTMENT_METADATA.comercial.color}
      />

      {/* Mode tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
        <button onClick={() => setMode('manual')}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all',
            mode === 'manual' ? 'bg-surface-hover text-ink font-medium' : 'hover:text-ink')}
          style={mode !== 'manual' ? { color: 'var(--text-secondary)' } : undefined}>
          <Zap size={12} /> {t('comercial.icebreaker.manual-entry', locale)}
        </button>
        <button onClick={() => setMode('from-lead')}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all',
            mode === 'from-lead' ? 'bg-surface-hover text-ink font-medium' : 'hover:text-ink')}
          style={mode !== 'from-lead' ? { color: 'var(--text-secondary)' } : undefined}>
          <Users size={12} /> {t('comercial.icebreaker.from-pipeline', locale)}
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
              { label: t('comercial.icebreaker.label-first-name', locale), field: 'firstName' as const, placeholder: 'Carlos' },
              { label: t('comercial.icebreaker.label-last-name', locale), field: 'lastName' as const, placeholder: 'Garcia' },
              { label: t('comercial.icebreaker.label-company-required', locale), field: 'company' as const, placeholder: 'Acme Corp' },
              { label: t('comercial.icebreaker.label-title', locale), field: 'title' as const, placeholder: 'Head of Growth' },
              { label: t('comercial.icebreaker.label-industry', locale), field: 'industry' as const, placeholder: 'SaaS B2B' },
              { label: t('comercial.icebreaker.label-geography', locale), field: 'geography' as const, placeholder: 'Madrid, Spain' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="card p-3">
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
                <input value={manualForm[field]} onChange={e => f(field, e.target.value)} placeholder={placeholder}
                  className="w-full bg-transparent text-sm text-ink outline-none" style={{ color: 'var(--text-primary)' }} />
              </div>
            ))}
          </div>
          <div className="card p-4">
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('comercial.icebreaker.trigger-event-optional-label', locale)}</label>
            <input value={manualForm.triggerEvent} onChange={e => f('triggerEvent', e.target.value)}
              placeholder={t('comercial.icebreaker.trigger-placeholder', locale)}
              className="w-full bg-transparent text-sm text-ink outline-none" style={{ color: 'var(--text-primary)' }} />
          </div>
          <div className="card p-4">
            <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>{t('comercial.icebreaker.linkedin-notes-label', locale)}</label>
            <textarea value={manualForm.linkedinNote} onChange={e => f('linkedinNote', e.target.value)}
              placeholder={t('comercial.icebreaker.linkedin-placeholder', locale)}
              rows={3} className="w-full bg-transparent text-sm text-ink outline-none resize-none leading-relaxed" style={{ color: 'var(--text-primary)' }} />
          </div>
          <button onClick={generateManual} disabled={!manualValid || generating}
            className={clsx(
              'w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all',
              generating ? 'bg-surface-hover' : 'bg-amber-400 text-black'
            )}>
            {generating
              ? <><Loader2 size={16} className="animate-spin text-ink" /><span className="text-ink">{t('comercial.icebreaker.generating', locale)}</span></>
              : <><Zap size={16} /> {t('comercial.icebreaker.generate-with-finn', locale)}</>}
          </button>
        </div>
      )}

      {/* ── FROM PIPELINE ── */}
      {mode === 'from-lead' && (
        <div className="space-y-5">
          {hotLeads.length === 0 ? (
            <div className="card py-16 text-center">
              <p className="text-ink-muted text-sm mb-2">{t('comercial.icebreaker.no-hot-leads', locale)}</p>
              <p className="text-ink-muted text-xs">{t('comercial.icebreaker.no-hot-leads-cta', locale)}</p>
            </div>
          ) : (
            <>
              <div className="card p-5">
                <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>{t('comercial.icebreaker.select-hot-lead', locale)}</label>
                <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setRawText(''); setVariants([]) }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none appearance-none" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                  <option value="">{t('comercial.icebreaker.choose-lead-option', locale)}</option>
                  {hotLeads.map(l => (
                    <option key={l.id} value={l.id}>
                      🔥 {l.hot_score} · {l.company_name ?? t('common.no-company', locale)} — {l.first_name ?? ''} {l.last_name ?? ''}
                    </option>
                  ))}
                </select>
              </div>

              {selected && (
                <div className="card p-5 space-y-3">
                  <p className="text-[11px] text-ink-muted uppercase tracking-wider">{t('comercial.icebreaker.lead-context', locale)}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {[
                      { label: t('comercial.icebreaker.label-company', locale), val: selected.company_name },
                      { label: t('comercial.icebreaker.label-title', locale), val: selected.title },
                      { label: t('comercial.icebreaker.label-industry', locale), val: selected.industry },
                      { label: t('comercial.icebreaker.label-geography', locale), val: selected.geography },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-[11px] mb-0.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                        <p className="text-ink-secondary">{val ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {selected.trigger_event && (
                    <div className="rounded-lg p-3" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                      <p className="text-[11px] mb-1 text-amber-400/70">{t('comercial.icebreaker.trigger-event-heading', locale)}</p>
                      <p className="text-sm text-ink-secondary">{selected.trigger_event}</p>
                    </div>
                  )}
                  {selected.icebreaker_used && (
                    <div className="rounded-lg p-3 border border-emerald-400/15" style={{ background: 'var(--bg-page)' }}>
                      <p className="text-[11px] mb-1 text-emerald-400/60">{t('comercial.icebreaker.saved-label', locale)}</p>
                      <p className="text-sm text-ink-secondary italic">{selected.icebreaker_used}</p>
                    </div>
                  )}
                </div>
              )}

              <button onClick={generateFromLead} disabled={!selectedId || generating}
                className="w-full py-3 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {generating
                  ? <><Loader2 size={16} className="animate-spin" /> {t('comercial.icebreaker.generating', locale)}</>
                  : <><Zap size={16} /> {t('comercial.icebreaker.generate-3-variants', locale)}</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── OUTPUT ── */}
      {(rawText || generating) && (
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>✍️ Finn — {displayVariants.length > 1 ? t('comercial.icebreaker.label-variants', locale) : t('comercial.icebreaker.label-result', locale)}</p>
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
                      activeTab === i ? 'bg-amber-400/15 text-amber-400 border-amber-400/25' : 'hover:text-ink border-transparent'
                    )}
                    style={activeTab !== i ? { color: 'var(--text-secondary)' } : undefined}>
                    {VARIANT_LABELS[i] ?? t('comercial.icebreaker.variant-fallback', locale).replace('{n}', String(i + 1))}
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
                  {copied ? <><Check size={11} className="text-emerald-400" /> {t('comercial.icebreaker.copied', locale)}</> : <><Copy size={11} /> {t('common.copy', locale)}</>}
                </button>
                {selected && (
                  <button onClick={() => saveVariant(displayVariants[activeTab])}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all',
                      saved
                        ? 'text-green-400 border border-green-400/20 bg-green-400/8 cursor-default'
                        : 'text-amber-400 border border-amber-400/25 bg-amber-400/10 hover:bg-amber-400/15'
                    )}>
                    {saved ? <><Check size={11} /> {t('comercial.icebreaker.saved-in-lead', locale)}</> : t('comercial.icebreaker.use-this-variant', locale)}
                  </button>
                )}
                <button onClick={mode === 'from-lead' ? generateFromLead : generateManual}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] hover:text-ink transition-all" style={{ color: 'var(--text-secondary)' }}>
                  <RefreshCw size={11} /> {t('comercial.icebreaker.regenerate', locale)}
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
