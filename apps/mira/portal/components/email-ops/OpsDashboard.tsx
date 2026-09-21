'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { t } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { OpsStats } from '@/lib/email-ops/stats'

// Panel de operación de Email Ops: las cifras del departamento a partir de los
// encargos que ya ha leído el sistema. Primer dashboard de MIRA sobre datos
// operativos del cliente — y la referencia de cómo se hacen los siguientes:
//   · el dato vive en nuestras tablas y se agrega en SERVIDOR, acotado por
//     cliente (la frontera multi-marca no se delega en el navegador);
//   · la IA extrae, TypeScript cuenta (lib/email-ops/stats.ts);
//   · forma antes que color: tiles para los totales, columnas para el tiempo,
//     barras de UN tono para comparar magnitudes, tabla para el ranking.
// El tono de datos es --viz-series-1 (globals.css), validado contra la
// superficie real en los dos temas.

type Range = '30' | '90' | 'all'
const RANGES: Range[] = ['30', '90', 'all']

interface Tip { x: number; y: number; value: string; label: string }

/** Más de este número de días seguidos → se agrupa por semana. */
const DAILY_LIMIT = 45

function fmtDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`))
}

/**
 * Serie temporal continua: los días sin encargos existen y valen 0 (un fin de
 * semana sin servicio es información, no un hueco). Si el tramo es largo se
 * agrupa por semana para no pintar cien columnas.
 */
function timeSeries(byDay: OpsStats['byDay'], locale: Locale): { key: string; label: string; count: number }[] {
  if (byDay.length === 0) return []
  const counts = new Map(byDay.map((d) => [d.date, d.count]))
  const start = new Date(`${byDay[0].date}T00:00:00Z`)
  const end = new Date(`${byDay[byDay.length - 1].date}T00:00:00Z`)
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  const days: { date: string; count: number }[] = []
  for (let i = 0; i < spanDays; i++) {
    const d = new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10)
    days.push({ date: d, count: counts.get(d) ?? 0 })
  }
  if (spanDays <= DAILY_LIMIT) return days.map((d) => ({ key: d.date, label: fmtDate(d.date, locale), count: d.count }))
  const weeks = new Map<string, number>()
  for (const d of days) {
    const dt = new Date(`${d.date}T00:00:00Z`)
    const monday = new Date(dt.getTime() - ((dt.getUTCDay() + 6) % 7) * 86400000).toISOString().slice(0, 10)
    weeks.set(monday, (weeks.get(monday) ?? 0) + d.count)
  }
  return [...weeks].map(([w, count]) => ({ key: w, label: fmtDate(w, locale), count }))
}

export default function OpsDashboard({ clientId, locale }: { clientId: string; locale: Locale }) {
  const [range, setRange] = useState<Range>('90')
  const [stats, setStats] = useState<OpsStats | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [fieldLabels, setFieldLabels] = useState<Record<string, { es: string; en: string }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const days = range === 'all' ? '' : `&days=${range}`
    fetch(`/api/email-ops/stats?clientId=${clientId}${days}`)
      .then(async (res) => {
        const data = await res.json()
        if (!alive) return
        if (!res.ok) { setError(data.error || 'Error'); return }
        setError(null); setStats(data.stats); setTruncated(!!data.truncated); setFieldLabels(data.fieldLabels || {})
      })
      .catch(() => { if (alive) setError('Network error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [clientId, range])

  const series = useMemo(() => (stats ? timeSeries(stats.byDay, locale) : []), [stats, locale])

  // Primera carga: spinner. Recargas: se mantiene lo pintado a media opacidad
  // (sin esqueleto ni salto de maquetación).
  if (!stats && loading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 size={20} className="animate-spin text-ink-muted" /></div>
  }
  if (!stats) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error || 'Error'}</p>

  const s = stats.totals
  const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)

  return (
    <div>
      {/* Filtros: una fila, arriba, y acotan todo lo de debajo */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg bg-surface p-1" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setRange(r)} aria-pressed={range === r}
              className={clsx('rounded-md px-3 py-1.5 text-xs transition-colors',
                range === r ? 'bg-surface-hover font-medium text-ink' : 'text-ink-tertiary hover:text-ink')}>
              {t(`emailops.dash.range.${r}`, locale)}
            </button>
          ))}
        </div>
        {loading && <Loader2 size={14} className="animate-spin text-ink-muted" />}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
      {truncated && <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">{t('emailops.dash.truncated', locale)}</p>}

      <div className={clsx('transition-opacity', loading && 'opacity-50')}>
        {s.requests === 0 ? (
          <div className="card py-14 text-center text-sm text-ink-tertiary">{t('emailops.dash.empty', locale)}</div>
        ) : (
          <>
            {/* Totales: son números, no gráficos */}
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatTile label={t('emailops.dash.requests', locale)} value={s.requests} />
              <StatTile label={t('emailops.dash.clients', locale)} value={s.clients}
                hint={s.other ? t('emailops.dash.clients.hint', locale).replace('{n}', String(s.other)) : undefined} />
              <StatTile label={t('emailops.dash.packages', locale)} value={s.packages}
                hint={t('emailops.dash.packages.hint', locale).replace('{n}', String(s.packagesKnown)).replace('{total}', String(s.requests))} />
              <StatTile label={t('emailops.dash.complete', locale)} value={`${pct(s.complete, s.requests)}%`}
                hint={`${s.complete}/${s.requests} · ${t('emailops.dash.complete.hint', locale)}`} />
              <StatTile label={t('emailops.dash.urgent', locale)} value={s.urgent} hint={`${pct(s.urgent, s.requests)}%`} />
            </div>

            {/* En el tiempo: columnas de un solo tono */}
            <div className="card mb-5 px-5 py-4">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink">{t('emailops.dash.byday', locale)}</h3>
                {stats.noDate > 0 && <span className="text-[11px] text-ink-muted">{t('emailops.dash.byday.nodate', locale).replace('{n}', String(stats.noDate))}</span>}
              </div>
              <ColumnChart data={series} />
            </div>

            {/* Mixes: comparar magnitudes → barras horizontales de un tono */}
            <div className="mb-5 grid gap-5 md:grid-cols-2">
              <div className="card px-5 py-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">{t('emailops.dash.delivery', locale)}</h3>
                <BarList total={s.requests} rows={stats.byDelivery.map((d) => ({
                  key: d.key, count: d.count,
                  label: d.key === 'none' ? t('emailops.dash.delivery.none', locale) : t(`emailops.delivery.${d.key}`, locale),
                }))} />
              </div>
              <div className="card px-5 py-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">{t('emailops.dash.vehicle', locale)}</h3>
                <BarList total={s.requests} rows={stats.byVehicle.map((v) => ({
                  key: v.key, count: v.count, label: t(`emailops.dash.vehicle.${v.key}`, locale),
                }))} />
              </div>
            </div>

            {/* Ranking de clientes: con pocos encargos, una tabla es más honesta que barras casi iguales */}
            <div className="mb-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
              <div className="card overflow-x-auto px-5 py-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-ink-muted">
                      <th className="pb-2 pr-3 font-semibold">{t('emailops.dash.table.client', locale)}</th>
                      <th className="pb-2 pr-3 text-right font-semibold">{t('emailops.dash.table.requests', locale)}</th>
                      <th className="pb-2 pr-3 text-right font-semibold">{t('emailops.dash.table.packages', locale)}</th>
                      <th className="pb-2 text-right font-semibold">{t('emailops.dash.table.last', locale)}</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {stats.clients.slice(0, stats.clients.length <= 15 ? 15 : 12).map((c) => (
                      <tr key={c.name} className="border-b border-line-subtle last:border-0">
                        <td className="py-2 pr-3 text-ink" translate="no">{c.name}</td>
                        <td className="py-2 pr-3 text-right text-ink-secondary">{c.requests}</td>
                        <td className="py-2 pr-3 text-right text-ink-secondary">{c.packages || '—'}</td>
                        <td className="py-2 text-right text-ink-tertiary">{c.lastDate ? fmtDate(c.lastDate, locale) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {stats.clients.length > 15 && <p className="pt-2 text-[11px] text-ink-tertiary">+{stats.clients.length - 12} {t('emailops.dash.table.more', locale)}</p>}
              </div>

              <div className="card px-5 py-4">
                <h3 className="mb-3 text-sm font-semibold text-ink">{t('emailops.dash.missing', locale)}</h3>
                {stats.missing.length === 0 ? (
                  <p className="flex items-start gap-2 text-xs text-ink-secondary">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden />
                    {t('emailops.dash.missing.none', locale)}
                  </p>
                ) : (
                  <BarList total={s.requests} rows={stats.missing.map((m) => ({ key: m.field, count: m.count, label: fieldLabels[m.field]?.[locale] ?? m.field }))} />
                )}
              </div>
            </div>

            {/* Vista de tabla: todo valor del panel es legible sin pasar el ratón */}
            <details className="card px-5 py-3 text-xs">
              <summary className="cursor-pointer text-ink-secondary hover:text-ink">{t('emailops.dash.table.view', locale)}</summary>
              <div className="mt-3 grid gap-6 md:grid-cols-3">
                <DataTable title={t('emailops.dash.byday', locale)} rows={series.map((d) => [d.label, d.count])} />
                <DataTable title={t('emailops.dash.delivery', locale)} rows={stats.byDelivery.map((d) => [
                  d.key === 'none' ? t('emailops.dash.delivery.none', locale) : t(`emailops.delivery.${d.key}`, locale), d.count])} />
                <DataTable title={t('emailops.dash.vehicle', locale)} rows={stats.byVehicle.map((v) => [t(`emailops.dash.vehicle.${v.key}`, locale), v.count])} />
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[11px] text-ink-tertiary">{label}</p>
      {/* Cifras proporcionales en el número grande: tabular solo en columnas */}
      <p className="mt-0.5 text-2xl font-semibold text-ink">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {hint && <p className="mt-0.5 text-[11px] leading-snug text-ink-tertiary">{hint}</p>}
    </div>
  )
}

/** Tooltip único por gráfico. El valor manda, la etiqueta acompaña. */
function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-line bg-page px-2.5 py-1.5 text-center shadow-lg"
      style={{ left: tip.x, top: tip.y - 6 }} role="status">
      <p className="text-sm font-semibold text-ink tabular-nums">{tip.value}</p>
      <p className="whitespace-nowrap text-[11px] text-ink-tertiary">{tip.label}</p>
    </div>
  )
}

/**
 * Columnas: ≤24px, extremo de dato redondeado a 4px y cuadrado en la base, valor
 * en el tope (todas las columnas llevan su valor, así que no hace falta eje Y).
 * El área de acierto es la franja entera, no solo la columna pintada.
 */
function ColumnChart({ data }: { data: { key: string; label: string; count: number }[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const max = Math.max(1, ...data.map((d) => d.count))
  const PLOT = 140
  // Con muchas columnas las etiquetas del eje se pisarían: se enseña una de cada N.
  const every = Math.max(1, Math.ceil(data.length / 12))

  const show = (el: HTMLElement, d: { label: string; count: number }) => {
    const box = ref.current?.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    if (!box) return
    const h = (d.count / max) * PLOT
    setTip({ x: r.left - box.left + r.width / 2, y: PLOT - h + 18, value: String(d.count), label: d.label })
  }

  return (
    <div ref={ref} className="relative" onPointerLeave={() => setTip(null)}>
      <Tooltip tip={tip} />
      <div className="flex items-end gap-1 border-b" style={{ height: PLOT + 18, borderColor: 'var(--viz-grid)' }}>
        {data.map((d) => {
          const h = d.count ? Math.max(3, (d.count / max) * PLOT) : 0
          return (
            <div key={d.key} tabIndex={0} aria-label={`${d.label}: ${d.count}`}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none focus-visible:rounded focus-visible:ring-1 focus-visible:ring-ink-muted"
              onPointerEnter={(e) => show(e.currentTarget, d)} onFocus={(e) => show(e.currentTarget, d)} onBlur={() => setTip(null)}>
              <span className={clsx('mb-1 text-[11px] tabular-nums', d.count ? 'text-ink-secondary' : 'text-ink-muted')}>{d.count}</span>
              <div className="w-full max-w-[24px] rounded-t transition-[filter] group-hover:brightness-110"
                style={{ height: h, background: 'var(--viz-series-1)' }} />
            </div>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-1">
        {data.map((d, i) => (
          <span key={d.key} className="min-w-0 flex-1 truncate text-center text-[10px] text-ink-tertiary">{i % every === 0 ? d.label : ''}</span>
        ))}
      </div>
    </div>
  )
}

/**
 * Barras horizontales de UN tono (se compara magnitud, no identidad): orden
 * descendente, extremo redondeado a la derecha, valor en la punta.
 */
function BarList({ rows, total }: { rows: { key: string; label: string; count: number }[]; total: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const max = Math.max(1, ...rows.map((r) => r.count))

  const show = (el: HTMLElement, r: { label: string; count: number }) => {
    const box = ref.current?.getBoundingClientRect()
    // Se ancla en la PUNTA de la barra (donde mira el lector), no en el centro
    // de la fila: ahí tapaba el título de la tarjeta.
    const b = (el.querySelector('[data-bar]') as HTMLElement | null)?.getBoundingClientRect() ?? el.getBoundingClientRect()
    if (!box) return
    const share = total ? Math.round((r.count / total) * 100) : 0
    setTip({ x: b.right - box.left, y: b.top - box.top, value: `${r.count} · ${share}%`, label: r.label })
  }

  return (
    <div ref={ref} className="relative space-y-2" onPointerLeave={() => setTip(null)}>
      <Tooltip tip={tip} />
      {rows.map((r) => (
        <div key={r.key} tabIndex={0} aria-label={`${r.label}: ${r.count}`}
          className="group grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 rounded outline-none focus-visible:ring-1 focus-visible:ring-ink-muted"
          onPointerEnter={(e) => show(e.currentTarget, r)} onFocus={(e) => show(e.currentTarget, r)} onBlur={() => setTip(null)}>
          <span className="truncate text-xs text-ink-secondary">{r.label}</span>
          {/* La pista reserva a la derecha el sitio de la etiqueta (pr-8) y TODAS
              las barras se miden contra la misma pista. Antes un maxWidth
              recortaba solo la barra más larga y un 4 salía al 91 % de un 5 en
              vez del 80 %: el gráfico mentía sobre los datos. */}
          <div className="relative pr-8">
            <div className="relative h-3.5">
              <div data-bar className="absolute inset-y-0 left-0 rounded-r transition-[filter] group-hover:brightness-110"
                style={{ width: `${(r.count / max) * 100}%`, minWidth: r.count ? 3 : 0, background: 'var(--viz-series-1)' }} />
              <span className="absolute top-1/2 -translate-y-1/2 pl-1.5 text-xs tabular-nums text-ink-secondary"
                style={{ left: `${(r.count / max) * 100}%` }}>{r.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DataTable({ title, rows }: { title: string; rows: (string | number)[][] }) {
  return (
    <div>
      <p className="mb-1.5 font-medium text-ink">{title}</p>
      <table className="w-full tabular-nums">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className="border-b border-line-subtle last:border-0">
              <td className="py-1 pr-3 text-ink-secondary">{label}</td>
              <td className="py-1 text-right text-ink">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
