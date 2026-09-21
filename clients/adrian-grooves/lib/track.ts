/**
 * Eventos de conversión para el píxel de Meta.
 *
 * POR QUÉ. El trimestre existe para medir un número —el CAC— y hasta el
 * 21-sep-2026 la página no disparaba ni un evento: el componente de píxeles
 * solo hace `init` + `PageView`. Sin `Lead` no se sabe qué anuncio trae
 * registros, y sin `InitiateCheckout` no se sabe qué anuncio lleva al pago
 * (la compra en sí, `Purchase`, la dispara el checkout de Hotmart con su propia
 * integración del píxel — se configura allí, no aquí).
 *
 * Sin píxel instalado (`pixels` vacío en el CMS) `fbq` no existe y esto no hace
 * nada: nunca lanza ni rompe el formulario.
 */
type Fbq = (cmd: 'track', event: string, params?: Record<string, unknown>) => void

export function track(event: 'Lead' | 'InitiateCheckout', params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  if (typeof fbq !== 'function') return
  try {
    fbq('track', event, params)
  } catch {
    // Un fallo del píxel no puede afectar a la página.
  }
}
