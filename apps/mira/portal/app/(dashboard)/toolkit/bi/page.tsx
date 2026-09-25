'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Plus, Loader2, Save, AlertTriangle } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { ExternalReportForClient } from '@/lib/reports/external'

interface BrandOption { id: string; name: string }

// Donde se pegan las URL de Power BI. Solo la agencia.
//
// El rechazo de una URL de «Publicar en la web» ocurre en el servidor, no
// aquí: una comprobación en el navegador es una ayuda, no una garantía.

const F = 'w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none'
const LBL = 'flex flex-col gap-1 text-[11px] text-ink-tertiary'

export default function BiManagePage() {
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  const [reports, setReports] = useState<ExternalReportForClient[]>([])
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [draftShared, setDraftShared] = useState<string[]>([])
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

  // Las demás marcas a las que este usuario llega: son las candidatas a ver el
  // informe. Un informe del grupo Aldea se configura una vez y se marca aquí.
  useEffect(() => {
    fetch('/api/me/clients')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setBrands((j?.clients || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))))
      .catch(() => {})
  }, [])

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
      sharedClientIds: draftShared,
    }, 'add')
    if (created) { setDraft({ slug: '', title: '', description: '', embedUrl: '', externalUrl: '', owner: '' }); setDraftShared([]) }
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
              brands={brands} activeClientId={activeClient.id}
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
              <div className="sm:col-span-2">
                <BrandPicker brands={brands} exclude={activeClient.id} selected={draftShared} onChange={setDraftShared} locale={locale} />
              </div>
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

function ReportRow({ report, locale, brand, busy, brands, activeClientId, onSave }: {
  report: ExternalReportForClient; locale: ReturnType<typeof useLocaleContext>['locale']; brand: string
  busy: string | null; brands: BrandOption[]; activeClientId: string
  onSave: (patch: Record<string, unknown>) => void
}) {
  const [embedUrl, setEmbedUrl] = useState(report.embed_url || '')
  const [externalUrl, setExternalUrl] = useState(report.external_url || '')
  const [shared, setShared] = useState<string[]>(report.shared_client_ids || [])

  // Un informe que llega compartido de otra marca se ve, pero no se edita
  // desde aquí: se edita donde vive. La API lo vuelve a impedir.
  if (!report.owned) {
    return (
      <div className="rounded-2xl border border-line-subtle bg-card p-4 opacity-70">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">{report.title}</h2>
          <code className="text-[11px] text-ink-muted">/toolkit/bi/{report.slug}</code>
        </div>
      </div>
    )
  }
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
      <div className="mt-3">
        <BrandPicker brands={brands} exclude={activeClientId} selected={shared} onChange={setShared} locale={locale} />
      </div>
      <button onClick={() => onSave({ embedUrl: embedUrl.trim() || null, externalUrl: externalUrl.trim() || null, sharedClientIds: shared })}
        disabled={busy !== null}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
        {busy === report.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('bi.manage.save', locale)}
      </button>
    </div>
  )
}

/** Qué otras marcas ven este informe. Nada de "todas": se marcan una a una. */
function BrandPicker({ brands, exclude, selected, onChange, locale }: {
  brands: BrandOption[]; exclude: string; selected: string[]
  onChange: (ids: string[]) => void; locale: ReturnType<typeof useLocaleContext>['locale']
}) {
  const options = brands.filter((b) => b.id !== exclude)
  if (options.length === 0) return null
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  return (
    <div>
      <p className="mb-1 text-[11px] text-ink-tertiary">{t('bi.manage.shared', locale)}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((b) => (
          <button key={b.id} onClick={() => toggle(b.id)} type="button"
            className={`rounded-lg px-2.5 py-1 text-[11px] transition-colors ${
              selected.includes(b.id) ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface text-ink-tertiary hover:text-ink'
            }`}>
            {b.name}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-ink-muted">{t('bi.manage.shared-help', locale)}</p>
    </div>
  )
}
