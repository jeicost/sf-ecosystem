'use client'

// Mitad de navegador del registro de actividad: un ping por página abierta y
// por clic relevante. Nunca bloquea nada; si falla, no pasa nada.

export function trackPage(route: string, clientId?: string | null, meta?: Record<string, unknown>): void {
  send({ route, clientId, meta })
}

export function trackAction(route: string, action: string, clientId?: string | null, meta?: Record<string, unknown>): void {
  send({ route, action, clientId, meta })
}

function send(payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/activity', new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch('/api/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
  } catch { /* nunca molesta */ }
}
