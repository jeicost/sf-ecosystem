'use client'
import { useEffect, useState } from 'react'
import { Loader2, Send, Copy, Check, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Lead } from '@/lib/types'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import { clsx } from 'clsx'
import PageHeader from '@/components/ui/PageHeader'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'

const CLASS_LABEL: Record<string, { label: string; cls: string }> = {
  interested:     { label: 'Interesado',       cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
  not_now:        { label: 'No ahora',          cls: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
  not_interested: { label: 'No interesado',     cls: 'text-red-400 bg-red-400/10 border-red-400/25' },
  referral:       { label: 'Deriva a otro',     cls: 'text-violet-400 bg-violet-400/10 border-violet-400/25' },
}

export default function QualifyPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const { locale } = useLocaleContext()

  const [leads, setLeads]           = useState<Lead[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [replyText, setReplyText]   = useState('')
  const [output, setOutput]         = useState('')
  const [analyzing, setAnalyzing]   = useState(false)
  const [copied, setCopied]         = useState(false)
  const [loadingLeads, setLoadingLeads] = useState(true)

  useEffect(() => {
    createClient()
      .from('leads')
      .select('id,company_name,first_name,last_name,title,hot_score,stage')
      .eq('client_id', clientId)
      .not('stage', 'in', '("won","lost","prospected")')
      .order('hot_score', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setLeads(data as Lead[])
        setLoadingLeads(false)
      })
  }, [clientId])

  // Extract parsed fields from streamed JSON
  const parsed = (() => {
    if (!output) return null
    try {
      const cleaned = output.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch { return null }
  })()

  const isJson = output.trim().startsWith('{')

  async function analyze() {
    if (!replyText.trim() || analyzing) return
    setAnalyzing(true)
    setOutput('')

    try {
      const res = await fetch('/api/comercial/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selectedId || null, replyText }),
      })
      if (!res.body) throw new Error('no stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setOutput(full)
      }
    } catch {
      setOutput('Error al analizar. Inténtalo de nuevo.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cls = parsed?.classification ? CLASS_LABEL[parsed.classification] : null

  return (
    <div className="px-8 py-8 max-w-2xl">
      <PageHeader
        eyebrow={t('section.comercial', locale)}
        title="💬 Quinn — Qualify"
        subtitle="Analiza respuestas de outreach con BANT y genera el follow-up perfecto."
        eyebrowColor={DEPARTMENT_METADATA.comercial.color}
      />

      {/* Lead selector */}
      <div className="card p-5 mb-4">
        <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          {t('comercial.qualify.lead-optional', locale)}
        </label>
        {loadingLeads ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <Loader2 size={12} className="animate-spin" /> Cargando leads...
          </div>
        ) : (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="w-full rounded-lg px-3 py-2.5 text-sm text-ink focus:outline-none appearance-none" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
            <option value="">— Sin lead específico —</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.company_name ?? 'Sin empresa'} — {[l.first_name, l.last_name].filter(Boolean).join(' ') || 'Sin nombre'}
                {l.title ? ` (${l.title})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Reply input */}
      <div className="card p-5 mb-4">
        <label className="block text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>
          Respuesta recibida <span className="text-red-400">*</span>
        </label>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          placeholder="Pega aquí el mensaje que recibiste del prospect..."
          rows={5}
          className="w-full bg-transparent text-sm text-ink outline-none resize-none leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      <button onClick={analyze} disabled={!replyText.trim() || analyzing}
        className={clsx(
          'w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all mb-6',
          replyText.trim() && !analyzing
            ? 'bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25 border border-emerald-400/25'
            : 'bg-surface text-ink-muted border border-line-subtle cursor-not-allowed'
        )}>
        {analyzing
          ? <><Loader2 size={15} className="animate-spin" /> Quinn analizando...</>
          : <><Send size={15} /> Analizar con Quinn</>}
      </button>

      {/* Output */}
      {output && (
        <div className="space-y-3">
          {parsed && cls ? (
            <>
              {/* Classification + BANT */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={clsx('px-3 py-1.5 rounded-lg text-sm font-semibold border', cls.cls)}>
                      {cls.label}
                    </div>
                    {parsed.bant_score !== undefined && (
                      <div className="px-2.5 py-1 rounded-lg text-[11px]" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                        BANT {parsed.bant_score}/4
                      </div>
                    )}
                  </div>
                  <MessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
                </div>

                {/* BANT breakdown */}
                {parsed.bant_budget && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(['budget', 'authority', 'need', 'timeline'] as const).map(k => {
                      const val = parsed[`bant_${k}`]
                      return (
                        <div key={k} className="text-center">
                          <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>{k}</p>
                          <div className={clsx(
                            'text-[11px] font-semibold px-2 py-1 rounded',
                            val === 'yes' ? 'text-green-400 bg-green-400/10' : val === 'no' ? 'text-red-400 bg-red-400/10' : 'text-ink-muted bg-surface'
                          )}>
                            {val === 'yes' ? '✓' : val === 'no' ? '✗' : '?'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Next move */}
              {parsed.next_move && (
                <div className="card p-4">
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>Siguiente movimiento</p>
                  <p className="text-sm text-ink">{parsed.next_move}</p>
                </div>
              )}

              {/* Suggested reply */}
              {parsed.suggested_reply && (
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Mensaje sugerido</p>
                    <button onClick={() => copy(parsed.suggested_reply)}
                      className="flex items-center gap-1 text-[10px] hover:text-ink transition-all" style={{ color: 'var(--text-secondary)' }}>
                      {copied ? <><Check size={10} className="text-green-400" /> Copiado</> : <><Copy size={10} /> Copiar</>}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed rounded-lg p-3" style={{ color: 'var(--text-primary)', background: 'var(--bg-page)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                    {parsed.suggested_reply}
                  </p>
                </div>
              )}

              {/* Buying signals */}
              {parsed.buying_signals?.length > 0 && (
                <div className="card p-4">
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>{t('comercial.qualify.purchase-signals', locale)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(parsed.buying_signals as string[]).map(s => (
                      <span key={s} className="text-[11px] px-2 py-1 rounded-full bg-green-400/8 text-green-400 border border-green-400/15">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-5">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'var(--text-primary)' }}>{output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
