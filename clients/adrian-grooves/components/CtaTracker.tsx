'use client'

import { useEffect } from 'react'
import { track } from '@/lib/track'
import { site } from '@/lib/site'

/**
 * Dispara `InitiateCheckout` cuando alguien pulsa un CTA que lleva al pago.
 *
 * Un solo oyente para toda la página en vez de convertir cada sección en
 * componente de cliente: los CTA son enlaces normales marcados con `data-cta`,
 * y solo cuentan cuando su destino es una URL absoluta — es decir, cuando la
 * venta está abierta. Con `#lista` no se dispara nada: eso no es un checkout.
 */
export function CtaTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[data-cta]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (/^https?:\/\//i.test(href)) {
        track('InitiateCheckout', { value: Number(site.price), currency: 'EUR', content_name: a.dataset.cta })
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return null
}
