'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator, Loader2 } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import { useClientTools } from '@/lib/hooks/useClientTools'

// Puente entre el encargo y el precio: crea un envío con lo que se puede leer
// del correo SIN inventar nada y lleva al operador a completarlo.
//
// El botón solo aparece si la marca tiene el Cotizador habilitado; la API
// vuelve a comprobarlo, porque una comprobación en el navegador no es una
// autorización.
export default function QuoteFromTicketButton({ clientId, ticketId, locale }: {
  clientId: string; ticketId: string; locale: Locale
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Misma fuente que la navegación (client_tools): si la marca no tiene el
  // Cotizador abierto, el botón no existe. La API lo vuelve a comprobar.
  const { tools, isAgency, isLoading } = useClientTools(clientId)
  const enabled = isAgency || tools.some((t) => t.id === 'quotes' && t.enabled)

  const go = async () => {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/cotizador/shipments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ticketId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error'); setBusy(false); return }
      router.push(`/quotes/${data.shipment.id}`)
    } catch {
      setError('Network error'); setBusy(false)
    }
  }

  if (isLoading || !enabled) return null

  return (
    <>
      <button onClick={go} disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-2 text-xs text-ink-secondary hover:text-ink disabled:opacity-50">
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Calculator size={12} />} {t('quotes.from-ticket', locale)}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </>
  )
}
