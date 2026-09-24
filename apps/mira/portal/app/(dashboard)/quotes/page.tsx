'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Calculator, Plus, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import type { QuoteShipment } from '@/lib/cotizador/store'

// Lista de envíos. Un envío = un destino: un manifiesto con varios destinos son
// varias filas, porque el motor cotiza uno a uno.

const STATUS_STYLE: Record<QuoteShipment['status'], string> = {
  pendiente_datos: 'bg-amber-500/10 text-amber-400',
  listo: 'bg-sky-500/10 text-sky-400',
  cotizado: 'bg-emerald-500/10 text-emerald-400',
  no_cotizable: 'bg-red-500/10 text-red-400',
}

export default function QuotesPage() {
  const { locale } = useLocaleContext()
  const { activeClient } = useActiveClient()
  const [rows, setRows] = useState<QuoteShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const clientId = activeClient?.id
  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    const res = await fetch(`/api/cotizador/shipments?clientId=${clientId}`)
    const data = await res.json()
    if (res.ok) setRows(data.shipments || [])
    setLoading(false)
  }, [clientId])
  useEffect(() => { load() }, [load])

  if (!activeClient) return null
  const brand = activeClient.primaryColor || '#6366F1'

  const create = async () => {
    setCreating(true)
    const res = await fetch('/api/cotizador/shipments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: activeClient.id }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) window.location.href = `/quotes/${data.shipment.id}`
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: brand }}>
            <Calculator size={13} /> {t('quotes.title', locale)}
          </p>
          <h1 className="text-2xl font-semibold text-ink">{t('quotes.title', locale)}</h1>
          <p className="mt-1 text-xs text-ink-tertiary">{t('quotes.subtitle', locale)}</p>
        </div>
        <button onClick={create} disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: brand }}>
          {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} {t('quotes.new', locale)}
        </button>
      </div>

      {loading ? (
        <Loader2 size={16} className="animate-spin text-ink-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-line bg-card p-8 text-center text-xs text-ink-tertiary">{t('quotes.empty', locale)}</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((s) => (
            <Link key={s.id} href={`/quotes/${s.id}`}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-line-subtle px-3 py-2 transition-colors hover:bg-surface">
              <code className="w-full truncate text-[12px] text-ink-secondary sm:w-44">{s.shipment_ref}</code>
              <span className="flex-1 truncate text-xs text-ink">
                {[s.origin_postal_code, s.destination_postal_code].filter(Boolean).join(' → ') || '—'}
              </span>
              <span className="text-[11px] tabular-nums text-ink-muted">
                {(s.packages || []).length} {t('quotes.packages', locale).toLowerCase()}
              </span>
              <span className={clsx('rounded-full px-2 py-0.5 text-[10px]', STATUS_STYLE[s.status])}>
                {t(`quotes.status.${s.status}`, locale)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
