'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Rocket, Clock, PiggyBank } from 'lucide-react'
import type { ValueReport } from '@/lib/value-report'

// Informe de Valor mensual en el espacio "Resultados". La pieza de retención:
// lo verificable (producido/publicado/coste IA) grande, y las estimaciones
// (horas ahorradas, coste evitado) claramente marcadas como tales. Degrada a
// nada si no hay cliente o falla el fetch.
export default function ValueReportCard({ clientId, brand, locale }: { clientId?: string; brand: string; locale: 'es' | 'en' }) {
  const [r, setR] = useState<ValueReport | null>(null)

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/value-report?clientId=${clientId}&locale=${locale}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => (d && !d.error ? setR(d) : null))
      .catch(() => setR(null))
  }, [clientId, locale])

  if (!r) return null

  const verifiable = [
    { label: 'Producido', value: String(r.produced), icon: Sparkles, tint: brand },
    { label: 'Publicado / usado', value: String(r.published), icon: Rocket, tint: '#6366F1' },
    { label: 'Coste de IA', value: `$${r.aiCostUsd.toFixed(2)}`, icon: PiggyBank, tint: '#10B981' },
  ]

  return (
    <div className="mb-6 rounded-2xl border p-6"
      style={{ background: `linear-gradient(135deg, ${brand}0D 0%, var(--bg-surface) 60%)`, borderColor: 'var(--border)' }}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
            Informe de valor · {r.monthLabel}
          </p>
          <p className="text-sm text-ink-secondary">Lo que MIRA produjo y te ahorró este mes</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {verifiable.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="rounded-xl border border-line-subtle bg-page p-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Icon size={13} style={{ color: tint }} />
              <span className="text-[11px] text-ink-tertiary">{label}</span>
            </div>
            <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Estimaciones — claramente marcadas para no confundir con dato duro */}
      <div className="rounded-xl border border-dashed border-line-subtle p-4 flex flex-wrap items-center gap-x-8 gap-y-3">
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Estimado</span>
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-ink-tertiary" />
          <span className="text-sm text-ink-secondary">
            <strong className="text-ink tabular-nums">~{r.hoursSavedEst}h</strong> de trabajo ahorradas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PiggyBank size={15} className="text-ink-tertiary" />
          <span className="text-sm text-ink-secondary">
            hacerlo por fuera te costaría <strong className="text-ink tabular-nums">~{r.costAvoidedEurEst}€</strong>
          </span>
        </div>
      </div>

      {r.topPieces.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.topPieces.map((it, i) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-page text-ink-tertiary border border-line-subtle">
              🚀 {it.platform}{it.pillar ? ` · ${it.pillar}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
