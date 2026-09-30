'use client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Save, Calculator, MapPin, AlertTriangle, CheckCircle2, Copy, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { t, type Locale } from '@/lib/i18n'
import { usableOption, unusableReason, type QuoteOption, type QuotePackage, type RatingAreasResult } from '@/lib/cotizador/contract'
import type { QuoteShipment, StoredQuote } from '@/lib/cotizador/store'
import { missingForQuote, type MissingItem } from '@/lib/cotizador/readiness'
import MissingList from './MissingList'
import PackagesEditor from './PackagesEditor'

// El envío, de principio a fin: datos → áreas → precio.
//
// El orden de la pantalla es el orden del contrato, y el botón de pedir precio
// no se enciende hasta que no falta nada. Un precio solo aparece cuando el
// motor devuelve OK con total y MONEDA: si no, sale el código de error tal
// cual, sin adornar. Y si el envío cambió después de cotizar (`stale`), el
// precio viejo pierde el verde y se pide otro.

const F = 'w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-sm text-ink outline-none'
const LBL = 'flex flex-col gap-1 text-[11px] text-ink-tertiary'

/**
 * Importe enseñable de una opción, o null. La moneda sale de la opción y, si
 * no, de la raíz de la respuesta; sin ninguna de las dos NO hay importe. Aquí
 * había un `currency || 'EUR'` que convertía cualquier divisa en euros.
 */
function money(option: unknown, root: { currency?: string | null }): string | null {
  const price = usableOption(option as QuoteOption | null, root)
  if (!price) return null
  return `${price.total.toFixed(2).replace('.', ',')} ${price.currency}`
}

export default function ShipmentEditor({ clientId, shipmentId, locale, brand }: {
  clientId: string; shipmentId: string; locale: Locale; brand: string
}) {
  const [shipment, setShipment] = useState<QuoteShipment | null>(null)
  const [quotes, setQuotes] = useState<StoredQuote[]>([])
  const [areas, setAreas] = useState<RatingAreasResult | null>(null)
  // Lo dice el servidor al cargar: es el único que ve COTIZADOR_TOKEN.
  const [configured, setConfigured] = useState(true)
  const [busy, setBusy] = useState<'load' | 'save' | 'areas' | 'quote' | null>('load')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setBusy('load')
    const res = await fetch(`/api/cotizador/shipments?clientId=${clientId}&id=${shipmentId}`)
    const data = await res.json()
    if (res.ok) { setShipment(data.shipment); setQuotes(data.quotes || []); setConfigured(!!data.configured) }
    else setMsg({ kind: 'error', text: data.error || 'Error' })
    setBusy(null)
  }, [clientId, shipmentId])
  useEffect(() => { load() }, [load])

  if (busy === 'load' && !shipment) {
    return <div className="flex items-center gap-2 p-8 text-sm text-ink-tertiary"><Loader2 size={14} className="animate-spin" /> …</div>
  }
  if (!shipment) return <p className="p-8 text-sm text-ink-tertiary">{msg?.text || 'not found'}</p>

  const patch = (p: Partial<QuoteShipment>) => setShipment({ ...shipment, ...p } as QuoteShipment)
  // Se recalcula en vivo con lo que hay en pantalla: el operador ve desaparecer
  // cada carencia según la rellena, sin tener que guardar para enterarse.
  const missing = missingForQuote(shipment)
  // Lo que el motor nombró en su último MISSING_REQUIRED_DATA (p. ej. el área
  // de tarificación, que MIRA no sabe comprobar). Se enseña junto a lo local
  // pero no bloquea el botón: solo el motor puede confirmar que ya está.
  const engineMissing = (Array.isArray(shipment.missing) ? shipment.missing : [])
    .filter((m): m is MissingItem => !!m && m.reason === 'engine_required')

  /**
   * Persiste lo que hay en pantalla. Devuelve true si el servidor lo guardó:
   * «Pedir precio» y «Consultar áreas» lo llaman ANTES de preguntar al motor,
   * porque el servidor cotiza el envío GUARDADO; si el operador había editado
   * sin guardar, el precio no era de lo que estaba viendo.
   */
  const save = async (): Promise<boolean> => {
    setBusy('save'); setMsg(null)
    const res = await fetch('/api/cotizador/shipments', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, id: shipment.id, patch: {
        origin_country: shipment.origin_country, origin_postal_code: shipment.origin_postal_code,
        origin_rating_area: shipment.origin_rating_area,
        destination_country: shipment.destination_country, destination_postal_code: shipment.destination_postal_code,
        destination_rating_area: shipment.destination_rating_area,
        palletized: shipment.palletized, service: shipment.service, packages: shipment.packages,
        notes: shipment.notes,
      } }),
    })
    const data = await res.json()
    if (res.ok) { setShipment(data.shipment); setMsg({ kind: 'ok', text: t('quotes.saved', locale) }) }
    else setMsg({ kind: 'error', text: data.error || 'Error' })
    setBusy(null)
    return res.ok
  }

  /** Guarda y, si no se pudo, lo dice y NO se llama al motor (fail-closed). */
  const saveBeforeAsking = async (): Promise<boolean> => {
    if (await save()) return true
    setMsg((m) => ({ kind: 'error', text: `${t('quotes.save.failed', locale)} ${m?.text ?? ''}`.trim() }))
    return false
  }

  const askAreas = async () => {
    // Primero se guarda: sin esto el motor resolvía áreas de los datos viejos.
    if (!(await saveBeforeAsking())) return
    setBusy('areas'); setMsg(null); setAreas(null)
    const res = await fetch('/api/cotizador/rating-areas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, shipmentId: shipment.id }),
    })
    const data = await res.json()
    if (res.ok) setAreas(data.ratingAreas)
    else setMsg({ kind: 'error', text: data.message || data.error || 'Error' })
    setBusy(null)
  }

  const ask = async () => {
    // Primero se guarda: el precio tiene que ser de lo que el operador ve.
    if (!(await saveBeforeAsking())) return
    setBusy('quote'); setMsg(null)
    const res = await fetch('/api/cotizador/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, shipmentId: shipment.id }),
    })
    const data = await res.json()
    if (!res.ok) {
      // 502 = sin veredicto: el envío no ha cambiado de estado y la tarjeta
      // de resultado ofrece reintentar. OK_WITHOUT_PRICE es el motor
      // contestando OK sin precio, no un motor caído: se dice tal cual.
      setMsg({ kind: 'error', text: data.error !== 'engine_unavailable' ? (data.message || data.error || 'Error')
        : data.code === 'OK_WITHOUT_PRICE' ? t('quotes.engine.ok-without-price', locale) : t('quotes.engine.unavailable', locale) })
    }
    await load()
    setBusy(null)
  }

  // Manifiesto con varios destinos: mismo origen y mismos bultos, otro destino.
  const duplicate = async () => {
    setBusy('save'); setMsg(null)
    const res = await fetch('/api/cotizador/shipments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, duplicateOf: shipment.id }),
    })
    const data = await res.json()
    setBusy(null)
    if (res.ok) window.location.href = `/quotes/${data.shipment.id}`
    else setMsg({ kind: 'error', text: data.error || 'Error' })
  }

  const side = (which: 'origin' | 'destination') => {
    const info = areas?.[which]
    const field = which === 'origin' ? 'origin_rating_area' : 'destination_rating_area'
    if (!info) return null
    if (info.status === 'NOT_REQUIRED') return <p className="text-[11px] text-ink-muted">{t('quotes.rating-area.none', locale)}</p>
    if (info.status !== 'AVAILABLE' || info.options.length === 0) {
      return <p className="text-[11px] text-amber-400">{t('quotes.rating-area.unavailable', locale)}</p>
    }
    return (
      <label className={LBL}>
        {t('quotes.rating-area.pick', locale)}
        <select value={shipment[field] || ''} onChange={(e) => patch({ [field]: e.target.value } as Partial<QuoteShipment>)} className={F}>
          <option value="">—</option>
          {info.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    )
  }

  const last = quotes[0]
  const recommended = (last?.recommended ?? null) as Record<string, unknown> | null
  const alternatives = Array.isArray(last?.alternatives) ? (last!.alternatives as Record<string, unknown>[]) : []
  // El precio solo se enseña en verde si es de ESTOS datos: OK, utilizable y
  // no caducado. `stale` lo calcula el servidor comparando peticiones.
  const lastPrice = last && last.status === 'OK' ? money(recommended, last) : null
  const lastFresh = !!lastPrice && !last?.stale

  return (
    <div className="space-y-5">
      {!configured && (
        <p className="flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {t('quotes.not-configured', locale)}
        </p>
      )}

      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {(['origin', 'destination'] as const).map((which) => (
            <div key={which} className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <MapPin size={12} style={{ color: brand }} /> {t(`quotes.${which}`, locale)}
              </h3>
              <label className={LBL}>{t('quotes.country', locale)}
                <input value={(which === 'origin' ? shipment.origin_country : shipment.destination_country) || ''}
                  onChange={(e) => patch({ [which === 'origin' ? 'origin_country' : 'destination_country']: e.target.value.toUpperCase().slice(0, 2) } as Partial<QuoteShipment>)}
                  placeholder="ES" className={F} />
              </label>
              <label className={LBL}>{t('quotes.postal', locale)}
                <input value={(which === 'origin' ? shipment.origin_postal_code : shipment.destination_postal_code) || ''}
                  onChange={(e) => patch({ [which === 'origin' ? 'origin_postal_code' : 'destination_postal_code']: e.target.value.trim() } as Partial<QuoteShipment>)}
                  className={F} />
              </label>
              {side(which)}
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] text-ink-tertiary">{t('quotes.palletized', locale)}</p>
            <div className="flex gap-1.5">
              {([['yes', true], ['no', false], ['unset', null]] as const).map(([key, v]) => (
                <button key={key} onClick={() => patch({ palletized: v })}
                  className={clsx('rounded-lg px-2.5 py-1 text-[11px] transition-colors',
                    shipment.palletized === v ? 'text-white' : 'bg-surface text-ink-secondary hover:text-ink')}
                  style={shipment.palletized === v ? { background: brand } : undefined}>
                  {t(`quotes.palletized.${key}`, locale)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-muted">{t('quotes.palletized.help', locale)}</p>
          </div>
          <label className={LBL}>{t('quotes.service', locale)}
            <select value={shipment.service} onChange={(e) => patch({ service: e.target.value as QuoteShipment['service'] })} className={F}>
              <option value="AUTO">AUTO</option><option value="ECONOMY">ECONOMY</option><option value="PREMIUM">PREMIUM</option>
            </select>
          </label>
        </div>

        <div className="mt-5 border-t border-line-subtle pt-4">
          <PackagesEditor packages={(shipment.packages || []) as QuotePackage[]} locale={locale}
            onChange={(p) => patch({ packages: p })} />
        </div>

        <div className="mt-4 space-y-3">
          <MissingList missing={[...missing, ...engineMissing]} locale={locale} />
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
              {busy === 'save' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {t('quotes.save', locale)}
            </button>
            <button onClick={askAreas} disabled={busy !== null || !configured}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
              {busy === 'areas' ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />} {t('quotes.rating-area.ask', locale)}
            </button>
            <button onClick={ask} disabled={busy !== null || missing.length > 0 || !configured}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
              {busy === 'quote' ? <Loader2 size={12} className="animate-spin" /> : <Calculator size={12} />}
              {busy === 'quote' ? t('quotes.quoting', locale) : t('quotes.quote', locale)}
            </button>
            <button onClick={duplicate} disabled={busy !== null} title={t('quotes.duplicate.help', locale)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-tertiary transition-colors hover:text-ink disabled:opacity-50">
              <Copy size={12} /> {t('quotes.duplicate', locale)}
            </button>
            {msg && (
              <span className={clsx('text-xs', msg.kind === 'error' ? 'text-red-400' : 'text-emerald-400')}>{msg.text}</span>
            )}
          </div>
        </div>
      </div>

      {last && (
        <div className="rounded-2xl border border-line bg-card p-5">
          {last.status === 'error' ? (
            // Sin veredicto: el motor no contestó (red, timeout, 5xx, no-JSON)
            // o contestó OK sin precio utilizable (OK_WITHOUT_PRICE). No es un
            // "no": el envío sigue como estaba y se puede volver a preguntar.
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-start gap-1.5 text-xs text-amber-400">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>
                  {last.error_code === 'OK_WITHOUT_PRICE' ? t('quotes.engine.ok-without-price', locale) : t('quotes.engine.unavailable', locale)}
                  {' '}<code className="text-ink-muted">{last.error_code || ''}</code>
                </span>
              </p>
              <button onClick={ask} disabled={busy !== null || missing.length > 0 || !configured}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:text-ink disabled:opacity-50">
                {busy === 'quote' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} {t('quotes.engine.retry', locale)}
              </button>
            </div>
          ) : lastPrice ? (
            <>
              {lastFresh ? (
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 size={13} /> {t('quotes.result.recommended', locale)}
                </p>
              ) : (
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertTriangle size={13} /> {t('quotes.result.stale', locale)}
                </p>
              )}
              <div className="flex flex-wrap items-baseline gap-3">
                <span className={clsx('text-2xl font-semibold tabular-nums', lastFresh ? 'text-ink' : 'text-ink-muted line-through')}>
                  {lastPrice}
                </span>
                <span className="text-xs text-ink-secondary">
                  {String(recommended?.provider ?? '')} {String(recommended?.service ?? '')}
                </span>
              </div>
              {alternatives.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-muted">{t('quotes.result.alternatives', locale)}</p>
                  <ul className="space-y-1">
                    {alternatives.map((a, i) => {
                      const amount = money(a, last)
                      return (
                        <li key={i} className="flex items-baseline justify-between gap-3 rounded-lg bg-surface px-2.5 py-1.5 text-xs">
                          <span className="text-ink-secondary">{String(a.provider ?? '')} {String(a.service ?? '')}</span>
                          {amount ? (
                            <span className={clsx('tabular-nums', lastFresh ? 'text-ink' : 'text-ink-muted line-through')}>{amount}</span>
                          ) : (
                            // Sin moneda (ni en la opción ni en la raíz) no hay importe que
                            // enseñar; con moneda pero sin total utilizable (null, texto,
                            // cero) tampoco, y antes se culpaba a la moneda igualmente.
                            <span className="text-[11px] text-amber-400">
                              {unusableReason(a as QuoteOption, last) === 'no_currency'
                                ? t('quotes.result.no-currency', locale) : t('quotes.result.none', locale)}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </>
          ) : last.status === 'OK' ? (
            // OK sin precio utilizable (total nulo, no numérico o sin moneda):
            // el contrato no se ha cumplido y MIRA no rellena el hueco.
            <p className="flex items-start gap-1.5 text-xs text-amber-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{t('quotes.result.not-usable-ok', locale)} {recommended && usableOption(recommended as QuoteOption, last) === null && typeof recommended.total === 'number' ? t('quotes.result.no-currency', locale) : ''}</span>
            </p>
          ) : (
            // Sin OK no hay precio: se enseña el código del motor tal cual.
            <p className="flex items-start gap-1.5 text-xs text-amber-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{t('quotes.result.none', locale)} — <code className="text-ink-secondary">{last.error_code || last.status}</code></span>
            </p>
          )}
          {/* Los avisos llegan también con status OK — un precio con avisos no
              es un precio limpio, y el operador tiene que verlos. */}
          {Array.isArray(last.warnings) && last.warnings.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-muted">{t('quotes.result.warnings', locale)}</p>
              <ul className="space-y-1">
                {(last.warnings as unknown[]).map((w, i) => (
                  <li key={i} className="rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-400">
                    {typeof w === 'string' ? w : JSON.stringify(w)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-subtle pt-3 text-[10px] text-ink-muted">
            {last.trace_id && <span>{t('quotes.result.trace', locale)}: <code>{last.trace_id}</code></span>}
            {last.data_version && <span>{t('quotes.result.data-version', locale)}: {last.data_version}</span>}
          </p>
        </div>
      )}

      {/* Histórico: una cotización vieja sigue siendo la respuesta que dio el
          motor ese día, con su traza. No se borra al pedir otra. */}
      {quotes.length > 1 && (
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-ink-muted">{t('quotes.history.title', locale)}</p>
          <ul className="space-y-1">
            {quotes.slice(1).map((q) => {
              const total = q.status === 'OK' ? money(q.recommended, q) : null
              const label = q.status === 'error'
                ? `${t('quotes.history.error', locale)} · ${q.error_code || ''}`
                : total
                  ? (q.stale ? `${total} · ${t('quotes.history.stale', locale)}` : total)
                  : `${t('quotes.history.not-usable', locale)} · ${q.error_code || q.status}`
              return (
                <li key={q.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-surface px-2.5 py-1.5 text-[11px]">
                  <span className="text-ink-tertiary">{new Date(q.created_at).toLocaleString(locale === 'es' ? 'es-ES' : 'en-GB')}</span>
                  <span className={total && !q.stale ? 'tabular-nums text-ink' : 'text-ink-muted'}>{label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
