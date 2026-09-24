'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ExternalLink, Settings2, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { t, type Locale } from '@/lib/i18n'
import type { ExternalReport, ExternalReportStatus } from '@/lib/reports/external'

// Business Intelligence dentro de Business Reports, no como producto aparte.
// Si la marca no tiene ningún informe configurado, la sección no existe: una
// sección vacía en el hub de informes solo genera preguntas.

const BADGE: Record<ExternalReportStatus, string> = {
  connected: 'bg-emerald-500/10 text-emerald-400',
  action_required: 'bg-amber-500/10 text-amber-400',
  not_configured: 'bg-surface text-ink-tertiary',
  disabled: 'bg-surface text-ink-muted',
}

export default function BusinessIntelligenceSection({ clientId, locale, brand }: {
  clientId: string; locale: Locale; brand: string
}) {
  const [reports, setReports] = useState<ExternalReport[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/external-reports?clientId=${clientId}`)
    const data = await res.json()
    if (res.ok) { setReports(data.reports || []); setCanManage(!!data.canManage) }
    setLoading(false)
  }, [clientId])
  useEffect(() => { load() }, [load])

  if (loading) return <Loader2 size={14} className="animate-spin text-ink-muted" />
  if (reports.length === 0 && !canManage) return null

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <BarChart3 size={15} style={{ color: brand }} /> {t('bi.section', locale)}
        </h2>
        {canManage && (
          <Link href="/toolkit/bi"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-[11px] text-ink-secondary transition-colors hover:text-ink">
            <Settings2 size={11} /> {t('bi.manage', locale)}
          </Link>
        )}
      </div>

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-6 text-center text-xs text-ink-tertiary">{t('bi.manage.empty', locale)}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-ink">{r.title}</h3>
                <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px]', BADGE[r.status])}>
                  {t(`bi.status.${r.status}`, locale)}
                </span>
              </div>
              {r.description && <p className="mb-2 text-[11px] text-ink-tertiary">{r.description}</p>}
              <p className="mb-3 text-[10px] uppercase tracking-wide text-ink-muted" translate="no">{t('bi.provider', locale)}</p>
              <div className="flex flex-wrap gap-2">
                {/* Un informe sin configurar solo lleva a un aviso: ofrecerlo a
                    quien no puede arreglarlo es mandarle a un callejón. */}
                {(r.status !== 'not_configured' || canManage) && (
                  <Link href={`/toolkit/bi/${r.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white" style={{ background: brand }}>
                    {t('bi.open', locale)}
                  </Link>
                )}
                {r.external_url && (
                  <a href={r.external_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] text-ink-secondary transition-colors hover:text-ink">
                    <ExternalLink size={11} /> {t('bi.open-external', locale)}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
