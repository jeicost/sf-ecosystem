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
//
// i18n (01-sep): era la única página del portal entera en castellano
// hardcodeado — y justo la más comercial. Los nombres/blurbs de plan y addon
// se resuelven por clave (billing.plan-name.<id>…) con fallback al catálogo
// de lib/billing/plans.ts, que sigue siendo la verdad de la factura.

import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { CreditCard, Users, Check, Loader2, ExternalLink, Sparkles, AlertTriangle } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t, type Locale } from '@/lib/i18n'

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

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'bad'> = {
  trialing: 'warn',
  active: 'ok',
  past_due: 'bad',
  canceled: 'bad',
  paused: 'warn',
}

const TONE: Record<'ok' | 'warn' | 'bad', string> = {
  ok: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  warn: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  bad: 'text-red-400 bg-red-500/10 border-red-500/25',
}

// Nombre/blurb comercial localizado, con el catálogo como fallback para ids
// que el i18n no conozca (un plan nuevo no debe romper la página).
function planName(plan: PlanInfo, locale: Locale): string {
  const key = `billing.plan-name.${plan.id}`
  const label = t(key, locale)
  return label === key ? plan.name : label
}
function planBlurb(plan: PlanInfo, locale: Locale): string {
  const key = `billing.plan-blurb.${plan.id}`
  const label = t(key, locale)
  return label === key ? plan.blurb : label
}
function addonName(key: string, fallback: string, locale: Locale): string {
  const k = `billing.addon.${key}`
  const label = t(k, locale)
  return label === k ? fallback : label
}

export default function BillingPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [blockedReason, setBlockedReason] = useState<string | null>(null)

  const eur = useCallback(
    (n: number) => `${n.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US')} €`,
    [locale]
  )

  const load = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/billing/status?clientId=${clientId}`)
      const json = await res.json()
      if (res.ok) setStatus(json)
      else setNotice({ kind: 'err', text: json.error || t('billing.load-error', locale) })
    } catch {
      setNotice({ kind: 'err', text: t('billing.load-error', locale) })
    }
    setLoading(false)
  }, [clientId, locale])

  useEffect(() => {
    load()
  }, [load])

  // Vuelta de Stripe. El "pagado" es optimista a propósito: quien confirma de
  // verdad es el webhook, así que se recarga el estado en vez de creérselo.
  // `blocked` viene del gate de suscripción de proxy.ts: la persona llegó aquí
  // redirigida porque su prueba caducó o su suscripción está cancelada.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid')) {
      setNotice({ kind: 'ok', text: t('billing.paid-notice', locale) })
      window.history.replaceState({}, '', '/billing')
    }
    if (params.get('canceled')) {
      setNotice({ kind: 'err', text: t('billing.canceled-notice', locale) })
      window.history.replaceState({}, '', '/billing')
    }
    const blocked = params.get('blocked')
    if (blocked === 'trial_ended' || blocked === 'canceled') {
      setBlockedReason(blocked)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      else setNotice({ kind: 'err', text: json.error || t('billing.checkout-error', locale) })
    } catch {
      setNotice({ kind: 'err', text: t('billing.checkout-error', locale) })
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
      else setNotice({ kind: 'err', text: json.error || t('billing.portal-error', locale) })
    } catch {
      setNotice({ kind: 'err', text: t('billing.portal-error', locale) })
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
        <h1 className="text-2xl font-semibold text-ink">{t('billing.title', locale)}</h1>
        <p className="text-ink-tertiary mt-2 text-sm">{t('billing.load-error-account', locale)}</p>
      </div>
    )
  }

  const statusKey = `billing.status.${status.subscriptionStatus}`
  const statusLabel = t(statusKey, locale)
  const badge = {
    text: statusLabel === statusKey ? status.subscriptionStatus : statusLabel,
    tone: STATUS_TONE[status.subscriptionStatus] ?? ('warn' as const),
  }
  const seatsPct =
    status.seatsMax && status.seatsUsed != null ? Math.min(100, (status.seatsUsed / status.seatsMax) * 100) : 0
  const displayPlanName = status.managedAccount ? t('billing.managed-plan', locale) : planName(status.plan, locale)

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t('billing.title', locale)}</h1>
          <p className="text-ink-tertiary mt-1 text-sm">
            {t('billing.subtitle', locale).replace('{name}', status.clientName)}
          </p>
        </div>
        <span className={clsx('px-3 py-1.5 rounded-full text-xs font-medium border', TONE[badge.tone])}>
          {badge.text}
        </span>
      </div>

      {blockedReason && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm border text-red-400 bg-red-500/10 border-red-500/25 flex items-start gap-2.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{t(`billing.blocked.${blockedReason}`, locale)}</span>
        </div>
      )}

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
            <p className="text-[11px] uppercase tracking-widest text-ink-tertiary">{t('billing.your-plan', locale)}</p>
            <div className="flex items-baseline gap-3 mt-1.5">
              <h2 className="text-2xl font-semibold text-ink">{displayPlanName}</h2>
              {!status.managedAccount && (
                <span className="text-ink-tertiary text-sm">
                  {t('billing.per-month-novat', locale).replace('{price}', eur(status.plan.monthlyEur))}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-tertiary mt-1">
              {status.managedAccount ? t('billing.managed-desc', locale) : planBlurb(status.plan, locale)}
            </p>
          </div>

          {status.payments.hasSubscription && (
            <button
              onClick={openPortal}
              disabled={busy === 'portal'}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-line hover:bg-surface-hover transition-colors text-ink flex items-center gap-2 disabled:opacity-50"
            >
              {busy === 'portal' ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              {t('billing.invoices-card', locale)}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-line">
          {[
            {
              label: t('billing.stat.people', locale),
              value: `${status.seatsUsed ?? '—'} / ${status.seatsMax ?? status.plan.seats}`,
            },
            {
              label: t('billing.stat.brands', locale),
              value: status.managedAccount ? t('billing.according-agreement', locale) : status.plan.brands,
            },
            {
              label: t('billing.stat.images', locale),
              value: status.managedAccount ? t('billing.according-agreement', locale) : status.plan.images,
            },
            {
              label: t('billing.stat.setup', locale),
              value: status.managedAccount
                ? t('billing.trained-by-us', locale)
                : status.plan.setupEur
                  ? eur(status.plan.setupEur)
                  : t('billing.self-serve-setup', locale),
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
                {t('billing.seats-with-access', locale)
                  .replace('{used}', String(status.seatsUsed))
                  .replace('{max}', String(status.seatsMax))}
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
                {status.trialDaysLeft > 1
                  ? t('billing.trial-days-left', locale).replace('{n}', String(status.trialDaysLeft))
                  : status.trialDaysLeft === 1
                    ? t('billing.trial-day-left', locale)
                    : t('billing.trial-ended', locale)}
              </p>
              <p className="text-sm text-ink-tertiary mt-1">
                {t('billing.after-trial', locale)
                  .replace('{plan}', planName(status.plan, locale))
                  .replace('{price}', eur(status.plan.monthlyEur))}
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
                  {t('billing.activate', locale)
                    .replace('{plan}', planName(status.plan, locale))
                    .replace('{price}', eur(status.plan.monthlyEur))}
                </button>
              ) : (
                <div className="mt-4 px-4 py-3 rounded-xl bg-surface border border-line flex items-start gap-2.5">
                  <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-ink-tertiary">
                    {t('billing.payments-config', locale).split('{email}')[0]}
                    <a href="mailto:hola@startupsfactory.es" className="underline text-ink-secondary">
                      hola@startupsfactory.es
                    </a>
                    {t('billing.payments-config', locale).split('{email}')[1]}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Qué incluye ── */}
      <div className="card p-6 mb-6">
        <p className="text-[11px] uppercase tracking-widest text-ink-tertiary mb-4">{t('billing.included', locale)}</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[
            t('billing.included.brain', locale),
            t('billing.included.agents', locale),
            t('billing.included.approvals', locale),
            t('billing.included.reports', locale),
            status.managedAccount
              ? t('billing.included.images-agreement', locale)
              : t('billing.included.images', locale).replace('{n}', String(status.plan.images)),
            t('billing.included.drive', locale),
            status.onboardingMode === 'assisted'
              ? t('billing.included.brain-trained', locale)
              : t('billing.included.onboarding-self', locale),
            t('billing.included.seats', locale).replace('{n}', String(status.seatsMax ?? status.plan.seats)),
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
        <p className="text-[11px] uppercase tracking-widest text-ink-tertiary mb-4">{t('billing.addons', locale)}</p>
        <div className="space-y-2.5">
          {Object.entries(status.addons).map(([key, addon]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-line last:border-0">
              <span className="text-sm text-ink-secondary">{addonName(key, addon.name, locale)}</span>
              <span className="text-sm text-ink font-medium tabular-nums">
                {eur(addon.eur)}
                <span className="text-ink-tertiary font-normal">
                  {addon.recurring ? t('billing.per-month', locale) : t('billing.one-time', locale)}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-tertiary mt-4">
          {status.managedAccount ? t('billing.addons-note-managed', locale) : t('billing.addons-note', locale)}
        </p>
        <a href="/pricing" className="inline-block text-xs text-indigo-300 hover:text-indigo-200 mt-3 underline">
          {t('billing.see-plans', locale)}
        </a>
      </div>
    </div>
  )
}
