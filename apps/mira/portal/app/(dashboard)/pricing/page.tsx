'use client'

// Comparador de planes — el hueco que la auditoría go-live (01-sep) llevaba
// señalado desde julio (FASE2 C.5): "precio invisible dentro de la app, sin
// CTA de upgrade funcional". /billing enseña TU plan; esta página enseña los
// cinco y deja comprar los autoservicio. El catálogo es lib/billing/plans.ts —
// misma verdad que la factura; los nombres/blurbs se localizan con las mismas
// claves que usa /billing.

import { useCallback, useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { Check, CreditCard, Loader2, Mail } from 'lucide-react'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t, type Locale } from '@/lib/i18n'
import { BILLING_PLANS, type BillingPlan } from '@/lib/billing/plans'

function planName(id: string, fallback: string, locale: Locale): string {
  const key = `billing.plan-name.${id}`
  const label = t(key, locale)
  return label === key ? fallback : label
}
function planBlurb(id: string, fallback: string, locale: Locale): string {
  const key = `billing.plan-blurb.${id}`
  const label = t(key, locale)
  return label === key ? fallback : label
}

interface Status {
  plan: { id: string }
  managedAccount: boolean
  payments: { payableNow: boolean }
}

export default function PricingPage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eur = useCallback(
    (n: number) => `${n.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US')} €`,
    [locale]
  )

  useEffect(() => {
    if (!clientId) return
    fetch(`/api/billing/status?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => json && setStatus(json))
      .catch(() => {})
  }, [clientId])

  async function startCheckout(planId: string) {
    if (!clientId) return
    setBusy(planId)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, plan: planId }),
      })
      const json = await res.json()
      if (json.url) window.location.href = json.url
      else setError(json.error || t('billing.checkout-error', locale))
    } catch {
      setError(t('billing.checkout-error', locale))
    }
    setBusy(null)
  }

  const plans = Object.values(BILLING_PLANS)
  const groups: Array<{ label: string; plans: BillingPlan[] }> = [
    { label: t('pricing.self-serve-group', locale), plans: plans.filter((p) => p.selfServe) },
    { label: t('pricing.enterprise-group', locale), plans: plans.filter((p) => !p.selfServe) },
  ]

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-ink">{t('pricing.title', locale)}</h1>
      <p className="text-ink-tertiary mt-1 text-sm mb-2">{t('pricing.subtitle', locale)}</p>
      {status?.managedAccount && (
        <p className="text-xs text-amber-400/90 mb-4">{t('pricing.managed-note', locale)}</p>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm border text-red-400 bg-red-500/10 border-red-500/25">
          {error}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.label} className="mt-6">
          <p className="text-[11px] uppercase tracking-widest text-ink-tertiary mb-3">{group.label}</p>
          <div className={clsx('grid gap-4', group.plans.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
            {group.plans.map((plan) => {
              const isCurrent = !status?.managedAccount && status?.plan.id === plan.id
              const features = [
                `${t('billing.stat.people', locale)}: ${plan.seats}`,
                `${t('billing.stat.brands', locale)}: ${plan.brands}`,
                `${t('billing.stat.images', locale)}: ${plan.images}`,
                plan.setupEur
                  ? `${t('billing.stat.setup', locale)}: ${eur(plan.setupEur)}`
                  : t('pricing.setup-free', locale),
              ]
              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'card p-5 flex flex-col',
                    isCurrent && 'border-indigo-500/50 shadow-[0_0_24px_rgba(99,102,241,0.15)]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-ink">{planName(plan.id, plan.name, locale)}</h2>
                    {isCurrent && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border border-indigo-500/40 text-indigo-300 bg-indigo-500/10">
                        {t('pricing.current-badge', locale)}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-semibold text-ink mt-2">
                    {t('pricing.per-month', locale).replace('{price}', eur(plan.monthlyEur))}
                  </p>
                  <p className="text-xs text-ink-tertiary mt-1 mb-4">{planBlurb(plan.id, plan.blurb, locale)}</p>
                  <ul className="space-y-1.5 mb-5 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink-secondary">
                        <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.selfServe ? (
                    status?.payments.payableNow && !isCurrent ? (
                      <button
                        onClick={() => startCheckout(plan.id)}
                        disabled={busy === plan.id}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
                      >
                        {busy === plan.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                        {t('pricing.activate', locale).replace('{plan}', planName(plan.id, plan.name, locale))}
                      </button>
                    ) : (
                      <a
                        href="mailto:hola@startupsfactory.es"
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-line hover:bg-surface-hover transition-colors text-ink flex items-center justify-center gap-2"
                      >
                        <Mail size={14} />
                        {t('pricing.contact', locale)}
                      </a>
                    )
                  ) : (
                    <a
                      href="mailto:hola@startupsfactory.es"
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border border-line hover:bg-surface-hover transition-colors text-ink flex items-center justify-center gap-2"
                    >
                      <Mail size={14} />
                      {t('pricing.contact', locale)}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-ink-tertiary mt-8">{t('pricing.vat-note', locale)}</p>
    </div>
  )
}
