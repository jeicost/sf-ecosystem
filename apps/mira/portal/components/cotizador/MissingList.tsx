'use client'
import { AlertTriangle } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import type { MissingItem } from '@/lib/cotizador/readiness'

// Qué falta para poder cotizar, en palabras del operador. Es la traducción a
// persona del PENDIENTE_DATOS del contrato: sin esto, el botón de pedir precio
// estaría gris sin explicar por qué.
export default function MissingList({ missing, locale }: { missing: MissingItem[]; locale: Locale }) {
  if (!missing.length) return null
  return (
    <div className="rounded-xl bg-amber-500/10 px-3 py-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
        <AlertTriangle size={12} /> {t('quotes.missing.title', locale)}
      </p>
      <ul className="space-y-0.5 text-[11px] text-amber-300/90">
        {missing.map((m, i) => (
          <li key={`${m.reason}-${m.packageIndex ?? 'x'}-${i}`}>
            · {t(`quotes.missing.${m.reason}`, locale).replace('{n}', String((m.packageIndex ?? 0) + 1))}
          </li>
        ))}
      </ul>
    </div>
  )
}
