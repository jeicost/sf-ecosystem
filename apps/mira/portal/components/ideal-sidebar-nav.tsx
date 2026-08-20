'use client'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Zap, BookOpen, CreditCard } from 'lucide-react'
import { IDEAL_SPACES, resolveNavItemStatus, minPlanForNavItem } from '@/lib/sections'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { hasEntitlement, type Entitlement } from '@/lib/entitlements'
import { useClientTools } from '@/lib/hooks/useClientTools'
import { ENTITLEMENT_TO_TOOL_ID } from '@/lib/tools/catalog'
import type { UserPlan } from '@/lib/plans'
import { UnavailableNavItem } from '@/components/nav-item-status'

// Navegación consolidada del sistema ideal: 6 espacios en vez de 27 rutas
// sueltas (Fase 1). Se monta detrás del flag NEXT_PUBLIC_IDEAL_UI; con el flag
// apagado, el layout renderiza la navegación de siempre y este componente no
// aparece. Nada se borra: las rutas fuera de estos espacios (Operaciones,
// Finanzas, marketplace) siguen accesibles por URL — solo salen del menú.
export default function IdealSidebarNav({
  path,
  pendingCount,
  isAgency,
  plan,
}: {
  path: string
  pendingCount: number
  isAgency: boolean
  /** user_metadata.plan de quien mira: decide qué items salen con candado. */
  plan: UserPlan
}) {
  const isActive = (href: string) => path === href || (href !== '/' && path.startsWith(href + '/'))
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  // Qué módulos tiene abiertos la marca, según la BD (client_tools). Mientras
  // carga se usa la allowlist de código, que es exactamente lo que sembró la
  // 0073: así los clientes de siempre no ven su herramienta parpadear.
  const { tools, isLoading } = useClientTools(activeClient?.id)

  // Herramientas restringidas por cliente (p. ej. Licitaciones): solo aparecen
  // para clientes con el entitlement, o para la agencia. Es distinto del
  // candado por plan: lo que el cliente no tiene contratado como vertical no
  // se enseña; lo que su PLAN no incluye sí se enseña, bloqueado (upsell).
  const canSee = (item: { requires?: Entitlement; hidden?: boolean }) => {
    // 'hidden': la ruta pertenece a la sección para el gating, pero no se pinta
    // en el menú. Ver NavItem.hidden en lib/sections.
    if (item.hidden) return false
    if (!item.requires) return true
    if (isLoading) return hasEntitlement(item.requires, activeClient?.id, isAgency)
    const toolId = ENTITLEMENT_TO_TOOL_ID[item.requires] ?? item.requires
    return tools.some((t) => t.id === toolId && t.enabled)
  }

  const itemClass = (active: boolean) => clsx(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
    active
      ? 'bg-surface-hover text-ink font-medium'
      : 'text-ink-tertiary hover:text-ink hover:bg-surface'
  )

  return (
    <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto">
      {IDEAL_SPACES.map((space) => {
        const items = space.items.filter(canSee)
        if (items.length === 0) return null
        return (
        <div key={space.key}>
          <div className="flex items-center gap-1.5 px-2 mb-1">
            <space.icon size={12} className="text-ink-muted" />
            <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">
              {space.label}
            </span>
          </div>
          <div className="space-y-0.5">
            {items.map((item) => {
              const { href, label, icon: Icon } = item
              const status = resolveNavItemStatus(item, plan)
              if (status !== 'available') {
                return (
                  <UnavailableNavItem key={href}
                    label={label} icon={Icon} status={status} locale={locale}
                    requiredPlan={minPlanForNavItem(item)}
                    className={itemClass(false)} />
                )
              }
              const active = isActive(href)
              const showBadge = href === '/approvals' && pendingCount > 0
              return (
                <Link key={href} href={href} className={itemClass(active)}>
                  <Icon size={15} className={active ? 'text-ink' : 'text-ink-tertiary'} />
                  {label}
                  {showBadge && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse"
                      style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
        )
      })}

      {/* Secundarios: se conservan, fuera de los 6 espacios principales */}
      <div className="pt-2 border-t border-line-subtle space-y-0.5">
        <Link href="/integrations"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/integrations') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <Zap size={13} /> Connections
        </Link>
        <Link href="/billing"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/billing') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <CreditCard size={13} /> Billing
        </Link>
        <Link href="/resources"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/resources') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <BookOpen size={13} /> Resources
        </Link>
      </div>
    </nav>
  )
}
