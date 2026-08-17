'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { Lock, Clock, type LucideIcon } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'
import { planLabel, type UserPlan } from '@/lib/plans'
import type { NavItemStatus } from '@/lib/sections'

// Item de menú que NO abre: bloqueado por plan o "próximamente". Lo comparten
// los dos sidebars (el ideal y el viejo del layout) para que un candado
// signifique lo mismo en los dos y no haya dos tooltips distintos contando dos
// historias. Copia el gesto del switcher de departamentos: clic → tooltip
// efímero, no navegación. La diferencia es que aquí el tooltip dice QUÉ plan
// hace falta y lleva a /billing, en vez de un "Upgrade your plan" genérico —
// el feedback original de Natalia fue justo ese: un bloqueo que no explica.
//
// No es un <Link> a la página bloqueada a propósito: las subrutas de un
// departamento (/comercial/discovery, ...) no tienen guard propio, solo la
// portada del departamento lo tiene (components/plan-gate.tsx). Un link ahí
// sería la misma puerta trasera de siempre.

/** Texto del tooltip nativo (title) para un item no disponible. */
export function navStatusTitle(status: NavItemStatus, requiredPlan: UserPlan | null, locale: Locale): string {
  if (status === 'coming_soon') return t('integrations.coming-soon', locale)
  const plan = requiredPlan ? planLabel(requiredPlan) : null
  return plan ? `${t('integrations.upgrade-plan', locale)} · ${plan}` : t('integrations.upgrade-plan', locale)
}

export function UnavailableNavItem({
  label,
  icon: Icon,
  status,
  requiredPlan,
  locale,
  className,
  iconSize = 15,
}: {
  label: string
  icon: LucideIcon
  status: Exclude<NavItemStatus, 'available'>
  requiredPlan: UserPlan | null
  locale: Locale
  /** Clases del item "en reposo" del sidebar que lo pinta, para que encaje con sus vecinos. */
  className: string
  iconSize?: number
}) {
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    if (!showTip) return
    const id = setTimeout(() => setShowTip(false), 2600)
    return () => clearTimeout(id)
  }, [showTip])

  const isSoon = status === 'coming_soon'
  const planName = requiredPlan ? planLabel(requiredPlan) : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowTip(v => !v)}
        title={navStatusTitle(status, requiredPlan, locale)}
        aria-disabled="true"
        className={clsx(className, 'w-full text-left cursor-not-allowed opacity-70 hover:opacity-100')}
      >
        <Icon size={iconSize} className="text-ink-muted" />
        <span className="truncate">{label}</span>
        {isSoon ? (
          <span className="ml-auto inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
            style={{ background: 'rgba(139,92,246,0.15)', color: 'rgba(167,139,250,0.9)' }}>
            <Clock size={9} />
            Soon
          </span>
        ) : (
          <Lock size={11} className="ml-auto shrink-0 text-ink-muted" />
        )}
      </button>

      {showTip && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-lg border border-line-subtle bg-card px-2.5 py-2 text-[10px] text-ink-tertiary shadow-xl">
          {isSoon ? (
            <>
              <span className="block text-ink font-medium mb-0.5">{t('integrations.coming-soon', locale)}</span>
              {t('integrations.coming-soon-desc', locale)}
            </>
          ) : (
            <>
              <span className="block text-ink font-medium mb-0.5">
                {planName ? `${planName} plan` : t('integrations.upgrade-plan', locale)}
              </span>
              <span className="block mb-1.5">
                {planName
                  ? `Not included in your current plan. Available from ${planName}.`
                  : 'Not included in your current plan.'}
              </span>
              <Link href="/billing" onClick={() => setShowTip(false)}
                className="inline-block rounded px-2 py-1 font-medium text-white"
                style={{ background: '#6366f1' }}>
                {t('integrations.upgrade-plan', locale)}
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
