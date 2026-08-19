'use client'
import Link from 'next/link'
import { Lock, ArrowRight, Check } from 'lucide-react'
import type { MiraTool } from '@/lib/tools/catalog'
import { BILLING_ADDONS } from '@/lib/billing/plans'
import { t, type Locale } from '@/lib/i18n'
import type { ImageQuotaStatus } from '@/lib/image-quota'

/**
 * Tarjeta de un módulo. Dos estados y una diferencia que importa: cuando está
 * abierta es un enlace, cuando no lo está NO se navega — se pide. Antes una
 * herramienta no contratada simplemente no existía en la interfaz; ahora se ve,
 * se entiende y se puede pedir, que es de lo que va esta sección.
 */
export default function ToolCard({
  tool, enabled, requested, quota, brand, locale, onRequest,
}: {
  tool: MiraTool
  enabled: boolean
  requested: boolean
  quota: ImageQuotaStatus | null
  brand: string
  locale: Locale
  onRequest: (tool: MiraTool) => void
}) {
  const Icon = tool.icon
  const addon = tool.addonId ? BILLING_ADDONS[tool.addonId] : null

  const meter = tool.meter === 'images' && quota
    ? quota.enabled && quota.limit != null
      ? t('tools.images.count', locale)
          .replace('{used}', String(quota.used))
          .replace('{limit}', String(quota.limit))
      : t('tools.images.unlimited', locale)
    : null

  const body = (
    <>
      <div className="flex items-start gap-3 mb-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: enabled ? `${brand}1a` : 'var(--bg-surface)' }}
        >
          <Icon size={17} style={{ color: enabled ? brand : 'var(--text-muted)' }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink flex items-center gap-1.5">
            {tool.name}
            {!enabled && <Lock size={11} className="text-ink-muted" />}
          </p>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-muted mt-0.5">
            {t(`tools.category.${tool.category}`, locale)}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-ink-tertiary">{t(tool.descriptionKey, locale)}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        {enabled ? (
          <>
            <span className="text-[11px] text-ink-muted">
              {/* Un módulo de operativa NO "viene con el plan": se contrata aparte.
                  Decir lo contrario en su tarjeta contradice la propia sección. */}
              {meter ?? t(tool.category === 'standard' ? 'tools.included' : 'tools.active', locale)}
            </span>
            <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: brand }}>
              {t('tools.open', locale)} <ArrowRight size={12} />
            </span>
          </>
        ) : (
          <>
            <span className="text-[11px] text-ink-muted">
              {addon ? `${addon.eur} €${t('tools.per-month', locale)}` : t('tools.on-request', locale)}
            </span>
            {requested ? (
              <span className="text-[11px] font-medium flex items-center gap-1 text-ink-tertiary">
                <Check size={12} /> {t('tools.requested', locale)}
              </span>
            ) : (
              <button
                onClick={() => onRequest(tool)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
                style={{ background: `${brand}1a`, color: brand }}
              >
                {t('tools.request-access', locale)}
              </button>
            )}
          </>
        )}
      </div>
    </>
  )

  const shell = 'bg-card border border-line rounded-xl p-5 transition-all duration-200'

  if (!enabled) {
    return <div className={`${shell} opacity-75`}>{body}</div>
  }

  return (
    <Link
      href={tool.href}
      className={`${shell} block hover:-translate-y-0.5`}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${brand}40` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '' }}
    >
      {body}
    </Link>
  )
}
