'use client'
import { useState } from 'react'
import { Loader2, FileText, Copy, Check, Save } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { clsx } from 'clsx'

interface CallBrief {
  company: string
  contact_title: string
  problem: string
  services: string
  budget: string
  timeline: string
  notes: string
  industry: string
}

const EMPTY: CallBrief = {
  company: '', contact_title: '', problem: '', services: '',
  budget: '', timeline: '', notes: '', industry: '',
}

export default function ProposalsPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id

  const [brief, setBrief]         = useState<CallBrief>(EMPTY)
  const [output, setOutput]       = useState('')
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [copied, setCopied]       = useState(false)

  function set(field: keyof CallBrief, val: string) {
    setBrief(prev => ({ ...prev, [field]: val }))
    setSaved(false)
  }

  const valid = brief.company && brief.problem

  async function generate() {
    if (!valid || generating) return
    setGenerating(true)
    setOutput('')
    setSaved(false)

    try {
      const res = await fetch('/api/comercial/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callBrief: brief, clientId }),
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
      setOutput('Error al generar. Inténtalo de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const FIELDS: { field: keyof CallBrief; label: string; placeholder: string; required?: boolean; textarea?: boolean }[] = [
    { field: 'company',       label: 'Empresa prospect',     placeholder: 'Ej: Acme Ventures',               required: true },
    { field: 'contact_title', label: 'Cargo del contacto',   placeholder: 'Ej: Managing Partner' },
    { field: 'industry',      label: 'Industria',            placeholder: 'Ej: Venture Capital' },
    { field: 'budget',        label: 'Presupuesto estimado', placeholder: 'Ej: €3,000-5,000/mes' },
    { field: 'timeline',      label: 'Timeline del prospect',placeholder: 'Ej: Empezar en 2 semanas' },
    { field: 'services',      label: 'Servicios de interés', placeholder: 'Ej: Marketing IA + Comercial IA', textarea: true },
    { field: 'problem',       label: 'Problema detectado en la llamada', placeholder: 'Describe el pain principal que mencionó el prospect...', required: true, textarea: true },
    { field: 'notes',         label: 'Notas adicionales',   placeholder: 'Objeciones, contexto especial, competidores mencionados...', textarea: true },
  ]

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📄</span>
          <h1 className="text-2xl font-semibold text-ink">Nova — Proposals</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Genera propuestas comerciales completas desde el brief de una llamada.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* LEFT — Brief form */}
        <div>
          <p className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'var(--text-tertiary)' }}>Call Brief</p>
          <div className="space-y-3">
            {FIELDS.map(({ field, label, placeholder, required, textarea }) => (
              <div key={field} className="card p-4">
                <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {label} {required && <span className="text-[#EF4444]">*</span>}
                </label>
                {textarea ? (
                  <textarea
                    value={brief[field]}
                    onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full bg-transparent text-sm text-ink outline-none resize-none leading-relaxed"
                    style={{ color: 'var(--text-primary)' }}
                  />
                ) : (
                  <input
                    value={brief[field]}
                    onChange={e => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm text-ink outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                )}
              </div>
            ))}
          </div>

          <button onClick={generate} disabled={!valid || generating}
            className={clsx(
              'w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all',
              valid && !generating
                ? 'bg-[#3B82F6]/15 text-[#60a5fa] hover:bg-[#3B82F6]/25 border border-[#3B82F6]/25'
                : 'bg-surface text-ink-muted border border-line-subtle cursor-not-allowed'
            )}>
            {generating
              ? <><Loader2 size={15} className="animate-spin" /> Nova escribiendo...</>
              : <><FileText size={15} /> Generar propuesta con Nova</>}
          </button>
        </div>

        {/* RIGHT — Output */}
        <div className="flex flex-col">
          {output ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>📄 Nova — Propuesta generada</p>
                <div className="flex gap-2">
                  <button onClick={copy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] hover:text-ink transition-all" style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderWidth: '1px' }}>
                    {copied ? <><Check size={11} className="text-emerald-400" /> Copiado</> : <><Copy size={11} /> Copiar</>}
                  </button>
                  {saved && (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-green-400">
                      <Save size={11} /> Guardada en biblioteca
                    </span>
                  )}
                </div>
              </div>

              <div className="card flex-1 p-6 overflow-y-auto max-h-[600px]">
                <ProposalPreview markdown={output} />
              </div>

              {generating && (
                <div className="flex items-center gap-2 mt-3 text-[11px] text-ink-muted">
                  <Loader2 size={11} className="animate-spin" /> Generando...
                </div>
              )}
            </div>
          ) : (
            <div className="card flex-1 flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--border-subtle)' }} />
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>La propuesta aparecerá aquí</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Completa el brief y pulsa Generar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProposalPreview({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n')

  return (
    <div className="prose prose-invert max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return (
          <h1 key={i} className="text-xl font-bold text-ink mb-3 mt-0">{line.slice(2)}</h1>
        )
        if (line.startsWith('## ')) return (
          <h2 key={i} className="text-base font-semibold text-ink mb-2 mt-5 pb-1" style={{ borderBottomColor: 'var(--border-subtle)', borderBottomWidth: '1px' }}>{line.slice(3)}</h2>
        )
        if (line.startsWith('### ')) return (
          <h3 key={i} className="text-sm font-semibold mb-1.5 mt-4 text-ink-secondary">{line.slice(4)}</h3>
        )
        if (line.startsWith('| ')) return (
          <div key={i} className="text-[12px] font-mono px-3 py-1 rounded" style={{ color: 'var(--text-secondary)', background: 'var(--bg-page)', borderBottomColor: 'var(--border-subtle)', borderBottomWidth: '1px' }}>{line}</div>
        )
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <p key={i} className="text-[13px] leading-relaxed flex gap-2 mb-1 text-ink-secondary">
            <span style={{ color: 'var(--text-secondary)' }}>·</span>{line.slice(2)}
          </p>
        )
        if (line.match(/^\d+\. /)) return (
          <p key={i} className="text-[13px] leading-relaxed mb-1 text-ink-secondary">{line}</p>
        )
        if (line.startsWith('---')) return (
          <hr key={i} className="my-4" style={{ borderColor: 'var(--border-subtle)' }} />
        )
        if (line.trim() === '') return <div key={i} className="h-2" />
        return <p key={i} className="text-[13px] leading-relaxed mb-1 text-ink-secondary">{line}</p>
      })}
    </div>
  )
}
