'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useActiveClient } from '@/lib/client-context'
import type { ReportReadinessResult } from '@/lib/business-reports/readiness'

const DOT: Record<string, string> = {
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
}

// Semáforo de completitud del Brand Brain para el reporte. INFORMA de la
// calidad esperable y enlaza a completar lo que falta — NUNCA bloquea generar
// (filosofía del playbook: los huecos salen como open items en el informe).
export default function ReportReadiness({ toolSlug }: { toolSlug: string }) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [readiness, setReadiness] = useState<ReportReadinessResult | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/business-reports/readiness?tool_slug=${toolSlug}&clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReadiness)
      .catch(() => setReadiness(null))
  }, [clientId, toolSlug])

  if (!readiness || readiness.items.length === 0) return null

  const missing = readiness.items.filter((i) => i.level !== 'green')

  return (
    <div className="card p-4 mb-6">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${DOT[readiness.overall]}`} />
          <span className="text-sm font-medium text-ink">
            Brand Brain: {missing.length === 0
              ? 'completo para este informe'
              : `${missing.length} dato${missing.length > 1 ? 's' : ''} mejorable${missing.length > 1 ? 's' : ''}`}
          </span>
        </div>
        <span className="text-xs text-ink-tertiary">{expanded ? 'Ocultar' : 'Ver detalle'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-1.5">
          {readiness.items.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${DOT[item.level]}`} />
                <span className={item.level === 'green' ? 'text-ink-tertiary' : 'text-ink-secondary'}>{item.label}</span>
              </div>
              {item.level !== 'green' && (
                <Link
                  href={`/brand-brain?tab=${item.brainTab}`}
                  className="text-purple-400 hover:text-purple-300 transition-colors shrink-0"
                >
                  Completar en Brand Brain →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {missing.length > 0 && (
        <p className="mt-3 text-[11px] text-ink-tertiary">
          Puedes generar igualmente — los huecos saldrán como open items numerados en el informe.
        </p>
      )}
    </div>
  )
}
