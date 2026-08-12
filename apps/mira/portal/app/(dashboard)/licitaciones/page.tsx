'use client'
import { useState } from 'react'
import { Loader2, FileText, ListChecks, Sparkles, Copy, Check } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'

// Herramienta de licitaciones (D4 Entrega). Flujo de 3 pasos:
// 1) pegar el pliego → 2) extraer criterios de puntuación → 3) generar memoria.
interface Criterion { group: string; name: string; points: number | null; sub?: { name: string; points: number | null }[]; requires?: string }
interface Criteria { object?: string; expediente?: string; deadline?: string; total_points: number | null; criteria: Criterion[]; data_gaps?: string[] }
interface Section { criterio: string; puntos_objetivo: number | null; titulo: string; contenido: string; datos_a_confirmar?: string[] }
interface Memoria { titulo?: string; resumen_ejecutivo?: string; secciones?: Section[]; checklist_qa?: string[]; data_gaps?: string[] }

const GROUP_LABEL: Record<string, string> = { juicio_valor: 'Juicio de valor', automatico_tecnico: 'Automático técnico', precio: 'Precio' }

export default function LicitacionesPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const brand = activeClient?.primaryColor || '#6366F1'

  const [pliego, setPliego] = useState('')
  const [criteria, setCriteria] = useState<Criteria | null>(null)
  const [memoria, setMemoria] = useState<Memoria | null>(null)
  const [step, setStep] = useState<'idle' | 'extracting' | 'generating'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const extract = async () => {
    if (pliego.trim().length < 200 || !clientId) return
    setStep('extracting'); setError(null); setCriteria(null); setMemoria(null)
    try {
      const res = await fetch('/api/tender/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, clientId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al extraer criterios'); return }
      setCriteria(data)
    } catch { setError('Fallo de red') } finally { setStep('idle') }
  }

  const generate = async () => {
    if (!criteria || !clientId) return
    setStep('generating'); setError(null)
    try {
      const res = await fetch('/api/tender/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pliego, criteria, clientId }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al generar la memoria'); return }
      setMemoria(data)
    } catch { setError('Fallo de red') } finally { setStep('idle') }
  }

  const copyMemoria = () => {
    if (!memoria?.secciones) return
    const txt = [memoria.titulo, '', memoria.resumen_ejecutivo, '', ...memoria.secciones.map(s => `\n## ${s.titulo}${s.puntos_objetivo ? ` (${s.puntos_objetivo} pts)` : ''}\n${s.contenido}`)].join('\n')
    navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 1500)
  }

  const byGroup = (g: string) => criteria?.criteria.filter(c => c.group === g) || []

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
          <FileText size={13} /> Licitaciones
        </p>
        <h1 className="text-2xl font-semibold text-ink">Del pliego a la memoria técnica</h1>
        <p className="mt-1 text-sm text-ink-tertiary">Pega el pliego, extrae los criterios de puntuación y genera la memoria criterio a criterio, con el corpus de {activeClient?.name || 'tu empresa'}.</p>
      </div>

      {/* Paso 1: pliego */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-secondary"><FileText size={13} /> 1 · Pega el pliego (PCAP + PPT + criterios)</label>
        <textarea value={pliego} onChange={e => setPliego(e.target.value)} rows={7}
          placeholder="Pega aquí el texto del pliego de la licitación…"
          className="w-full resize-y rounded-xl border border-line bg-page p-3 text-sm text-ink outline-none focus:ring-1 focus:ring-ink-muted" />
        <button onClick={extract} disabled={pliego.trim().length < 200 || step !== 'idle' || !clientId}
          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
          {step === 'extracting' ? <><Loader2 size={16} className="animate-spin" /> Analizando…</> : <><ListChecks size={16} /> Extraer criterios</>}
        </button>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>

      {/* Paso 2: criterios */}
      {criteria && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><ListChecks size={15} style={{ color: brand }} /> 2 · Criterios de puntuación {criteria.total_points ? `· ${criteria.total_points} pts` : ''}</h2>
            <button onClick={generate} disabled={step !== 'idle'}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: brand }}>
              {step === 'generating' ? <><Loader2 size={14} className="animate-spin" /> Generando…</> : <><Sparkles size={14} /> Generar memoria</>}
            </button>
          </div>
          {criteria.object && <p className="mb-3 text-xs text-ink-tertiary">{criteria.expediente ? `Exp. ${criteria.expediente} · ` : ''}{criteria.object}{criteria.deadline ? ` · límite ${criteria.deadline}` : ''}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {['juicio_valor', 'automatico_tecnico', 'precio'].map(g => byGroup(g).length > 0 && (
              <div key={g} className="rounded-xl border border-line-subtle bg-page p-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider font-semibold text-ink-muted">{GROUP_LABEL[g]}</p>
                <ul className="space-y-1.5">
                  {byGroup(g).map((c, i) => (
                    <li key={i} className="text-xs text-ink-secondary">
                      <span className="text-ink">{c.name}</span>{c.points != null && <span className="text-ink-tertiary"> · {c.points} pts</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: memoria */}
      {memoria && (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FileText size={15} style={{ color: brand }} /> 3 · {memoria.titulo || 'Memoria técnica'}</h2>
            <button onClick={copyMemoria} className="flex items-center gap-1.5 rounded-lg bg-page px-3 py-1.5 text-xs text-ink-secondary hover:text-ink transition-colors">
              {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
            </button>
          </div>
          {memoria.resumen_ejecutivo && <p className="mb-4 text-sm text-ink-secondary">{memoria.resumen_ejecutivo}</p>}
          <div className="space-y-4">
            {memoria.secciones?.map((s, i) => (
              <div key={i} className="rounded-xl border border-line-subtle bg-page p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{s.titulo}</h3>
                  {s.puntos_objetivo != null && <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${brand}22`, color: brand }}>{s.puntos_objetivo} pts</span>}
                </div>
                <p className="whitespace-pre-line text-sm text-ink-secondary leading-relaxed">{s.contenido}</p>
                {s.datos_a_confirmar && s.datos_a_confirmar.length > 0 && (
                  <div className="mt-2 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-2">
                    <p className="text-[10px] uppercase tracking-wider text-amber-500/80 mb-1">A confirmar antes de entregar</p>
                    <ul className="list-disc pl-4 text-xs text-ink-tertiary">{s.datos_a_confirmar.map((d, j) => <li key={j}>{d}</li>)}</ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          {(memoria.checklist_qa?.length || memoria.data_gaps?.length) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {memoria.checklist_qa && memoria.checklist_qa.length > 0 && (
                <div className="rounded-xl border border-line-subtle p-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Checklist QA</p>
                  <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{memoria.checklist_qa.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
              {memoria.data_gaps && memoria.data_gaps.length > 0 && (
                <div className="rounded-xl border border-line-subtle p-3">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-ink-muted">Huecos del corpus</p>
                  <ul className="list-disc pl-4 text-xs text-ink-tertiary space-y-0.5">{memoria.data_gaps.map((c, i) => <li key={i}>{c}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
