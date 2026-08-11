'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckSquare, Sparkles, Send, Rocket } from 'lucide-react'
import type { WeeklyReport } from '@/lib/weekly-report'

// Parte Semanal en la portada (espacio "Hoy"). Un vistazo de 30s a la semana,
// con los datos del raíl. Degrada con gracia: si no hay cliente o el fetch
// falla, no se muestra nada (no rompe la home).
export default function WeeklyReportCard({ clientId, brand }: { clientId?: string; brand: string }) {
  const [r, setR] = useState<WeeklyReport | null>(null)

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/weekly-report?clientId=${clientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setR(d))
      .catch(() => setR(null))
  }, [clientId])

  if (!r) return null

  const stats = [
    { label: 'Producido', value: r.produced, icon: Sparkles, tint: brand },
    { label: 'Por aprobar', value: r.pending, icon: CheckSquare, tint: '#F59E0B', href: '/approvals' },
    { label: 'Aprobado', value: r.approved, icon: Send, tint: '#10B981' },
    { label: 'Publicado', value: r.published, icon: Rocket, tint: '#6366F1' },
  ]

  return (
    <div className="mb-6 rounded-2xl border border-line-subtle bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: brand }}>
            Parte semanal
          </p>
          <p className="text-sm text-ink-secondary">Cómo va tu semana, de un vistazo</p>
        </div>
        <Link href="/performance" className="text-xs text-ink-tertiary hover:text-ink transition-colors">
          Ver detalle →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tint, href }) => {
          const inner = (
            <div className="rounded-xl border border-line-subtle bg-page p-3.5 h-full transition-all hover:border-ink-muted">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Icon size={13} style={{ color: tint }} />
                <span className="text-[11px] text-ink-tertiary">{label}</span>
              </div>
              <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
            </div>
          )
          return href
            ? <Link key={label} href={href}>{inner}</Link>
            : <div key={label}>{inner}</div>
        })}
      </div>

      {r.publishedItems.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {r.publishedItems.slice(0, 6).map((it, i) => (
            <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-page text-ink-tertiary border border-line-subtle">
              🚀 {it.platform}{it.pillar ? ` · ${it.pillar}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
