'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Plus, Loader2, Save, AlertTriangle } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { ExternalReport } from '@/lib/reports/external'

// Donde se pegan las URL de Power BI. Solo la agencia.
//
// El rechazo de una URL de «Publicar en la web» ocurre en el servidor, no
// aquí: una comprobación en el navegador es una ayuda, no una garantía.

const F = 'w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none'
const LBL = 'flex flex-col gap-1 text-[11px] text-ink-tertiary'

export default function BiManagePage() {
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  const [reports, setReports] = useState<ExternalReport[]>([])
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [draft, setDraft] = useState({ slug: '', title: '', description: '', embedUrl: '', externalUrl: '', owner: '' })

  const clientId = activeClient?.id
  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const res = await fetch(`/api/external-reports?clientId=${clientId}`)
    const data = await res.json()
    if (res.ok) { setReports(data.reports || []); setCanManage(!!data.canManage) }
    setLoading(false)
  }, [clientId])
  useEffect(() => { load() }, [load])

  if (!activeClient) return null
  const brand = activeClient.primaryColor || '#6366F1'

  const call = async (method: 'POST' | 'PATCH', body: Record<string, unknown>, key: string) => {
    setBusy(key); setError(null); setOk(null)
    const res = await fetch('/api/external-reports', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: activeClient.id, ...body }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Error')
    else { setOk(t('bi.manage.saved', locale)); await load() }
    setBusy(null)
    return res.ok
  }

  const add = async () => {
    const created = await call('POST', {
      slug: draft.slug.trim().toLowerCase(), title: draft.title.trim(),
      description: draft.description.trim() || null,
      embedUrl: draft.embedUrl.trim() || null, externalUrl: draft.externalUrl.trim() || null,
      owner: draft.owner.trim() || null, displayOrder: reports.length + 1,
    }, 'add')
    if (created) setDraft({ slug: '', title: '', description: '', embedUrl: '', externalUrl: '', owner: '' })
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <Link href="/toolkit" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink">
        <ArrowLeft size={13} /> {t('bi.section', locale)}
      </Link>
      <div className="mb-6">
        <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: brand }}>
          <BarChart3 size={13} /> {t('bi.section', locale)}
        </p>
        <h1 className="text-2xl font-semibold text-ink">{t('bi.manage.title', locale)}</h1>
        <p className="mt-1 text-xs text-ink-tertiary">{t('bi.manage.desc', locale)}</p>
      </div>

      {loading ? <Loader2 size={16} className="animate-spin text-ink-muted" /> : !canManage ? (
        <p className="text-xs text-ink-tertiary">403</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} locale={locale} brand={brand} busy={busy}
              onSave={(patch) => call('PATCH', { id: r.id, ...patch }, r.id)} />
          ))}

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">{t('bi.manage.add', locale)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={LBL}>{t('bi.manage.slug', locale)}
                <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })} placeholder="envios" className={F} />
              </label>
              <label className={LBL}>{t('bi.manage.title-field', locale)}
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Informe de Envíos" className={F} />
              </label>
              <label className={`${LBL} sm:col-span-2`}>{t('bi.manage.description', locale)}
                <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={F} />
              </label>
              <label className={`${LBL} sm:col-span-2`}>{t('bi.manage.embed', locale)}
                <input value={draft.embedUrl} onChange={(e) => setDraft({ ...draft, embedUrl: e.target.value })}
                  placeholder="https://app.powerbi.com/reportEmbed?reportId=…" className={F} />
              </label>
              <label className={`${LBL} sm:col-span-2`}>{t('bi.manage.external', locale)}
                <input value={draft.externalUrl} onChange={(e) => setDraft({ ...draft, externalUrl: e.target.value })} className={F} />
              </label>
              <label className={LBL}>{t('bi.manage.owner', locale)}
                <input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} className={F} />
              </label>
            </div>
            <button onClick={add} disabled={busy !== null || !draft.slug.trim() || !draft.title.trim()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
              {busy === 'add' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} {t('bi.manage.add', locale)}
            </button>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
          {ok && <p className="text-xs text-emerald-400">{ok}</p>}
        </div>
      )}
    </div>
  )
}

function ReportRow({ report, locale, brand, busy, onSave }: {
  report: ExternalReport; locale: ReturnType<typeof useLocaleContext>['locale']; brand: string
  busy: string | null; onSave: (patch: Record<string, unknown>) => void
}) {
  const [embedUrl, setEmbedUrl] = useState(report.embed_url || '')
  const [externalUrl, setExternalUrl] = useState(report.external_url || '')
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">{report.title}</h2>
        <code className="text-[11px] text-ink-muted">/toolkit/bi/{report.slug}</code>
      </div>
      <div className="grid gap-3">
        <label className={LBL}>{t('bi.manage.embed', locale)}
          <input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} className={F} />
        </label>
        <label className={LBL}>{t('bi.manage.external', locale)}
          <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className={F} />
        </label>
      </div>
      <button onClick={() => onSave({ embedUrl: embedUrl.trim() || null, externalUrl: externalUrl.trim() || null })}
        disabled={busy !== null}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
        {busy === report.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('bi.manage.save', locale)}
      </button>
    </div>
  )
}
