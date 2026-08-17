'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Gauge } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { shouldWarnGenerationCap, type GenerationCapStatus } from '@/lib/generation-cap'

// Aviso discreto del techo de generaciones/mes. Vive en el sidebar (visible
// desde cualquier página que genere contenido) y solo aparece cuando hay techo
// (MAX_MONTHLY_GENERATIONS definido) Y quedan pocas: el 100 % del tiempo normal
// no se ve nada. Cuando quedan cero cambia de tono y lo dice claro, para que el
// usuario entienda el corte ANTES de que una generación le falle con un
// "network error" — que es lo que enseña hoy la mayoría de sitios cuando la
// ruta devuelve el error del techo (ver lib/generation-cap.ts).
//
// Se relee al cambiar de página: es un count(head) barato y así el número no se
// queda viejo tras generar. Sin techo (enabled:false) la ruta ni consulta la BD.
export default function GenerationCapNotice() {
  const { activeClient } = useActiveClient()
  const path = usePathname()
  const [status, setStatus] = useState<GenerationCapStatus | null>(null)
  const clientId = activeClient?.id

  useEffect(() => {
    if (!clientId) { setStatus(null); return }
    let cancelled = false
    fetch(`/api/usage/cap?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s: GenerationCapStatus | null) => { if (!cancelled) setStatus(s) })
      .catch(() => { /* el aviso nunca debe romper el sidebar */ })
    return () => { cancelled = true }
  }, [clientId, path])

  if (!status || !shouldWarnGenerationCap(status)) return null

  const remaining = status.remaining ?? 0
  const exhausted = remaining <= 0
  const accent = exhausted ? '#f87171' : '#fbbf24'

  return (
    <div className="px-3 pb-1">
      <div className="rounded-lg px-3 py-2"
        style={{ background: `${accent}14`, border: `1px solid ${accent}40` }}>
        <div className="flex items-center gap-2">
          <Gauge size={12} style={{ color: accent }} className="shrink-0" />
          <p className="text-[10px] font-medium leading-tight" style={{ color: accent }}>
            {exhausted
              ? 'Monthly generations used up'
              : `${remaining} of ${status.limit} generations left this month`}
          </p>
        </div>
        <p className="mt-1 text-[9px] leading-snug text-ink-tertiary">
          {exhausted
            ? 'New generations are paused until next month.'
            : 'Included generations reset on the 1st.'}{' '}
          <Link href="/integrations" className="underline hover:text-ink">
            Connect your own key
          </Link>{' '}
          for unlimited use.
        </p>
      </div>
    </div>
  )
}
