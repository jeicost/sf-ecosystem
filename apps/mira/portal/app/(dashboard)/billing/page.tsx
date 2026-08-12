'use client'

// Facturación — lo que el cliente paga, lo que le queda y cómo cambiarlo.
//
// Antes esto no existía: el plan vivía en user_metadata, nadie podía ver su
// propia cuenta y darse de baja era escribir un correo. Una suscripción que no
// se puede cancelar sola no es solo mala experiencia, es un problema legal.
//
// La página dice la verdad en los tres estados posibles: en prueba, pagando, y
// "el cobro con tarjeta todavía no está encendido" — que es donde estamos
// mientras no haya claves de Stripe. Fingir un botón de pago que no cobra sería
// peor que no tenerlo.

import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { CreditCard, Users, Check, Loader2, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'

interface PlanInfo {
  id: string
  name: string
  package: string
  monthlyEur: number
  monthlyUsd: number
  setupEur: number
  seats: number
  brands: number
  images: number
  selfServe: boolean
  blurb: string
}

interface BillingStatus {
  clientName: string
  plan: PlanInfo
  /** Cuenta con condiciones acordadas fuera de la plataforma: no se le enseña tarifa. */
  managedAccount: boolean
  subscriptionStatus: string
  trialEndsAt: string | null
  trialDaysLeft: number | null
  onboardingMode: string
  seatsUsed: number | null
  seatsMax: number | null
  addons: Record<string, { name: string; eur: number; recurring: boolean }>
  payments: { enabled: boolean; payableNow: boolean; hasSubscription: boolean }
}

const STATUS_LABEL: Record<string, { text: string; tone: 'ok' | 'warn' | 'bad' }> = {
  trialing: { text: 'En prueba', tone: 'warn' },
  active: { text: 'Activa', tone: 'ok' },
  past_due: { text: 'Pago pendiente', tone: 'bad' },
  canceled: { text: 'Cancelada', tone: 'bad' },
  paused: { text: 'En pausa', tone: 'warn' },
}

const TONE: Record<'ok' | 'warn' | 'bad', string> = {
  ok: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  bad: 'text-red-400 bg-red-500/10 border-red-500/25',
}

const eur = (n: number) => `${n.toLocaleString('es-ES')} €`

export default function BillingPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/billing/status?clientId=${clientId}`)
      const json = await res.json()
      if (res.ok) setStatus(json)
      else setNotice({ kind: 'err', text: json.error || 'No se pudo leer tu facturación' })
    } catch {
      setNotice({ kind: 'err', text: 'No se pudo leer tu facturación' })
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    load()
  }, [load])

  // Vuelta de Stripe. El "pagado" es optimista a propósito: quien confirma de
  // verdad es el webhook, así que se recarga el estado en vez de creérselo.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid')) {
      setNotice({ kind: 'ok', text: 'Pago recibido. Puede tardar unos segundos en reflejarse aquí.' })
      window.history.replaceState({}, '', '/billing')
    }
    if (params.get('canceled')) {
      setNotice({ kind: 'err', text: 'Pago cancelado. No se ha cobrado nada.' })
      window.history.replaceState({}, '', '/billing')
    }
  }, [])

  async function startCheckout(plan: string) {
    if (!clientId) return
    setBusy(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, plan }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setNotice({ kind: 'err', text: json.error || 'No se pudo iniciar el pago' })
    } catch {
      setNotice({ kind: 'err', text: 'No se pudo iniciar el pago' })
    }
    setBusy(null)
  }

  async function openPortal() {
    if (!clientId) return
    setBusy('portal')
    try {
      const res = await fetch('/api/billing/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setNotice({ kind: 'err', text: json.error || 'No se pudo abrir el portal' })
    } catch {
      setNotice({ kind: 'err', text: 'No se pudo abrir el portal' })
    }
    setBusy(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="text-ink-muted animate-spin" />
      </div>
    )
  }

  if (!status) {
    return (
      <div className="px-8 py-8">
        <h1 className="text-2xl font-semibold text-ink">Facturación</h1>
        <p className="text-ink-tertiary mt-2 text-sm">No se pudo cargar la cuenta de esta marca.</p>
      </div>
    )
  }

  const badge = STATUS_LABEL[status.subscriptionStatus] ?? { text: status.subscriptionStatus, tone: 'warn' as const }
  const seatsPct =
    status.seatsMax && status.seatsUsed != null ? Math.min(100, (status.seatsUsed / status.seatsMax) * 100) : 0

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Facturación</h1>
          <p className="text-ink-tertiary mt-1 text-sm">
            Tu plan, tu equipo y tus facturas — para {status.clientName}
          </p>
        </div>
        <span className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border', TONE[badge.tone])}>
          {badge.text}
        </span>
      </div>

      {notice && (
        <div
          className={clsx(
            'mb-6 px-4 py-3 rounded-xl text-sm border',
            notice.kind === 'ok'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
              : 'text-red-400 bg-red-500/10 border-red-500/25'
          )}
        >
          {notice.text}
        </div>
      )}

      {/* ── El plan actual ── */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-ink-tertiary">Tu plan</p>
            <div className="flex items-baseline gap-3 mt-1.5">
              <h2 className="text-2xl font-semibold text-ink">
                {status.managedAccount ? 'Plan gestionado' : status.plan.name}
              </h2>
              {!status.managedAccount && (
                <span className="text-ink-tertiary text-sm">
                  {eur(status.plan.monthlyEur)}/mes · sin IVA
                </span>
              )}
            </div>
            <p className="text-sm text-ink-tertiary mt-1">
              {status.managedAccount
                ? 'Tus condiciones están acordadas con Startup Factory. Cualquier cambio, háblalo con tu contacto.'
                : status.plan.blurb}
            </p>
          </div>

          {status.payments.hasSubscription && (
            <button
              onClick={openPortal}
              disabled={busy === 'portal'}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-line hover:bg-surface-hover transition-colors text-ink flex items-center gap-2 disabled:opacity-50"
            >
              {busy === 'portal' ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Facturas y tarjeta
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-line">
          {[
            { label: 'Personas', value: `${status.seatsUsed ?? '—'} / ${status.seatsMax ?? status.plan.seats}` },
            { label: 'Marcas', value: status.managedAccount ? 'Según acuerdo' : status.plan.brands },
            { label: 'Imágenes al mes', value: status.managedAccount ? 'Según acuerdo' : status.plan.images },
            {
              label: 'Alta',
              value: status.managedAccount
                ? 'Entrenada por nosotros'
                : status.plan.setupEur
                  ? eur(status.plan.setupEur)
                  : 'Autoservicio',
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-lg font-semibold text-ink">{value}</p>
              <p className="text-[11px] text-ink-tertiary mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {status.seatsMax != null && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} className="text-ink-tertiary" />
              <span className="text-xs text-ink-tertiary">
                {status.seatsUsed} de {status.seatsMax} personas con acceso
              </span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${seatsPct}%`,
                  background: seatsPct >= 100 ? '#f87171' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Prueba en curso ── */}
      {!status.managedAccount && status.subscriptionStatus === 'trialing' && status.trialDaysLeft != null && (
        <div className="card p-6 mb-6 border border-amber-500/25">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-ink font-medium">
                {status.trialDaysLeft > 0
                  ? `Te quedan ${status.trialDaysLeft} ${status.trialDaysLeft === 1 ? 'día' : 'días'} de prueba`
                  : 'Tu periodo de prueba ha terminado'}
              </p>
              <p className="text-sm text-ink-tertiary mt-1">
                Al terminar, {status.plan.name} son {eur(status.plan.monthlyEur)} al mes. Sin permanencia: se
                cancela desde aquí cuando quieras.
              </p>

              {status.payments.payableNow ? (
                <button
                  onClick={() => startCheckout(status.plan.id)}
                  disabled={busy === status.plan.id}
                  className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                >
                  {busy === status.plan.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CreditCard size={14} />
                  )}
                  Activar {status.plan.name} — {eur(status.plan.monthlyEur)}/mes
                </button>
              ) : (
                <div className="mt-4 px-4 py-3 rounded-xl bg-surface border border-line flex items-start gap-2.5">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-ink-tertiary">
                    El pago con tarjeta se está terminando de configurar. Escríbenos a{' '}
                    <a href="mailto:hola@startupsfactory.es" className="underline text-ink-secondary">
                      hola@startupsfactory.es
                    </a>{' '}
                    y lo activamos a mano — tu cuenta sigue funcionando mientras tanto.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Qué incluye ── */}
      <div className="card p-6 mb-6">
        <p className="text-[11px] uppercase tracking-widest text-ink-tertiary mb-4">Incluido en tu plan</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            'Cerebro de Marca con gobernanza y versiones',
            'Equipo de agentes y chat con tu contexto',
            'Bandeja de aprobación y calendario',
            '8 informes de negocio y 19 acciones rápidas',
            status.managedAccount ? 'Imágenes según tu acuerdo' : `${status.plan.images} imágenes al mes`,
            'Google Drive conectado',
            status.onboardingMode === 'assisted'
              ? 'Cerebro entrenado por nosotros'
              : 'Alta guiada que rellenas tú',
            `Hasta ${status.seatsMax ?? status.plan.seats} personas`,
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5">
              <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-sm text-ink-secondary">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Complementos ── */}
      <div className="card p-6">
        <p className="text-[11px] uppercase tracking-widest text-ink-tertiary mb-4">Complementos</p>
        <div className="space-y-2.5">
          {Object.entries(status.addons).map(([key, addon]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-line last:border-0">
              <span className="text-sm text-ink-secondary">{addon.name}</span>
              <span className="text-sm text-ink font-medium tabular-nums">
                {eur(addon.eur)}
                <span className="text-ink-tertiary font-normal">{addon.recurring ? '/mes' : ' una vez'}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-tertiary mt-4">
          {status.managedAccount
            ? 'Precios de tarifa. ¿Necesitas alguno? Háblalo con tu contacto en Startup Factory.'
            : '¿Necesitas alguno? Escríbenos y lo añadimos a tu próxima factura.'}
        </p>
      </div>
    </div>
  )
}
