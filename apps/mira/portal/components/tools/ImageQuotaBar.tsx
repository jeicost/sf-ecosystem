'use client'
import { useEffect, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import { shouldWarnImageQuota, imageQuotaExhausted, type ImageQuotaStatus } from '@/lib/image-quota'

/**
 * Cuánta cuota de imágenes queda este mes, y la salida cuando se acaba.
 *
 * El número de imágenes del plan llevaba meses siendo decorativo: se anunciaba
 * en la landing y en /billing sin contador ni tope. Esta barra es la cara
 * visible de que ahora sí se cuenta y sí se corta.
 *
 * El botón de compra solo aparece si Stripe está configurado Y existe el precio
 * del pack. Mientras no lo estén, se ofrece el contacto: un botón que no cobra
 * es peor que no tener botón.
 */
export default function ImageQuotaBar({
  clientId, brand, locale, onPurchased,
}: {
  clientId: string
  brand: string
  locale: Locale
  onPurchased?: () => void
}) {
  const [quota, setQuota] = useState<ImageQuotaStatus | null>(null)
  const [payable, setPayable] = useState(false)
  const [pack, setPack] = useState<{ images: number; eur: number } | null>(null)
  const [buying, setBuying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/billing/image-pack?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => {
        setQuota(d.quota ?? null)
        setPayable(!!d.payable)
        setPack({ images: d.images, eur: d.eur })
      })
      .catch(() => {})
  }, [clientId, onPurchased])

  if (!quota || !quota.enabled || quota.limit == null) return null

  const exhausted = imageQuotaExhausted(quota)
  const warn = shouldWarnImageQuota(quota)
  const pct = Math.min(100, Math.round((quota.used / Math.max(1, quota.limit)) * 100))
  const tone = exhausted ? '#f87171' : warn ? '#fbbf24' : brand

  const buy = async () => {
    setBuying(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/image-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start the payment')
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the payment')
      setBuying(false)
    }
  }

  return (
    <div className="rounded-xl border border-line bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs text-ink-secondary">
          <ImageIcon size={13} style={{ color: tone }} />
          {t('tools.images.count', locale)
            .replace('{used}', String(quota.used))
            .replace('{limit}', String(quota.limit))}
        </span>
        {(exhausted || warn) && pack && (
          payable ? (
            <button onClick={buy} disabled={buying}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-opacity disabled:opacity-50"
              style={{ background: `${brand}1a`, color: brand }}>
              {buying && <Loader2 size={11} className="animate-spin" />}
              +{pack.images} · {pack.eur} €
            </button>
          ) : (
            <a href="mailto:hola@startupsfactory.es?subject=More%20images%20for%20MIRA"
              className="text-[11px] font-medium" style={{ color: brand }}>
              Ask us for more
            </a>
          )
        )}
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: tone }} />
      </div>
      {quota.packImages > 0 && (
        <p className="mt-1.5 text-[10px] text-ink-muted">
          {quota.planImages} + {quota.packImages} extra
        </p>
      )}
      {error && <p className="mt-1.5 text-[10px]" style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}
