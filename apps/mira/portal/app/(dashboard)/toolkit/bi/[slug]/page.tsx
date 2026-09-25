'use client'
import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, AlertTriangle, Loader2 } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import PowerBIReportEmbed from '@/components/reports/PowerBIReportEmbed'
import type { ExternalReportForClient } from '@/lib/reports/external'

export default function BiReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  const [report, setReport] = useState<ExternalReportForClient | null>(null)
  const [loading, setLoading] = useState(true)

  const clientId = activeClient?.id
  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const res = await fetch(`/api/external-reports?clientId=${clientId}&slug=${encodeURIComponent(slug)}`)
    const data = await res.json()
    setReport(res.ok ? (data.reports?.[0] ?? null) : null)
    setLoading(false)
  }, [clientId, slug])
  useEffect(() => { load() }, [load])

  if (!activeClient) return null
  const brand = activeClient.primaryColor || '#6366F1'

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <Link href="/toolkit" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink">
        <ArrowLeft size={13} /> {t('bi.section', locale)}
      </Link>

      {loading ? (
        <Loader2 size={16} className="animate-spin text-ink-muted" />
      ) : !report ? (
        <p className="rounded-2xl border border-line bg-card p-8 text-center text-xs text-ink-tertiary">404</p>
      ) : (
        <>
          <div className="mb-5">
            <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: brand }}>
              <BarChart3 size={13} /> <span translate="no">{t('bi.provider', locale)}</span>
            </p>
            <h1 className="text-2xl font-semibold text-ink">{report.title}</h1>
            {report.description && <p className="mt-1 text-xs text-ink-tertiary">{report.description}</p>}
          </div>

          {/* Un informe desactivado NO enseña su iframe aunque conserve la URL:
              apagarlo tiene que apagarlo de verdad, no solo quitarlo de la
              lista. La URL sigue en la base de datos para poder reactivarlo. */}
          {report.status === 'disabled' ? (
            <p className="flex items-start gap-1.5 rounded-2xl bg-surface px-4 py-3 text-xs text-ink-tertiary">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {t('bi.status.disabled', locale)}
            </p>
          ) : !report.embed_url || report.status === 'not_configured' ? (
            <p className="flex items-start gap-1.5 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {t('bi.not-configured', locale)}
            </p>
          ) : (
            <PowerBIReportEmbed title={report.title} embedUrl={report.embed_url}
              externalUrl={report.external_url} locale={locale} />
          )}

          <p className="mt-3 text-[11px] text-ink-muted">
            {t('bi.access-note', locale)}
            {report.owner ? ` · ${report.owner}` : ''}
            {/* «Configuración actualizada», nunca «última actualización de los
                datos»: MIRA no conoce el refresco del dataset. */}
            {` · ${t('bi.config-updated', locale)}: ${new Date(report.updated_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB')}`}
          </p>
        </>
      )}
    </div>
  )
}
