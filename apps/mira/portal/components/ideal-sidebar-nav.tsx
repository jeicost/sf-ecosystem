'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Zap, BookOpen, CreditCard, ChevronDown } from 'lucide-react'
import { IDEAL_SPACES, resolveNavItemStatus, minPlanForNavItem } from '@/lib/sections'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { hasEntitlement, type Entitlement } from '@/lib/entitlements'
import { t } from '@/lib/i18n'
import { useClientTools } from '@/lib/hooks/useClientTools'
import { ENTITLEMENT_TO_TOOL_ID } from '@/lib/tools/catalog'
import type { UserPlan } from '@/lib/plans'
import { UnavailableNavItem } from '@/components/nav-item-status'

/** Qué sección del acordeón dejó abierta el usuario, en ESTE navegador. */
const OPEN_SPACE_KEY = 'mira_sidebar_open_space'

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
  const canSee = (item: { requires?: Entitlement; hidden?: boolean; agencyOnly?: boolean }) => {
    // 'hidden': la ruta pertenece a la sección para el gating, pero no se pinta
    // en el menú. Ver NavItem.hidden en lib/sections.
    if (item.hidden) return false
    // 'agencyOnly': herramienta de gestión (p. ej. Cuestionarios) — el cliente
    // la usa por enlace directo cuando se le envía algo, no desde el menú.
    if (item.agencyOnly && !isAgency) return false
    if (!item.requires) return true
    if (isLoading) return hasEntitlement(item.requires, activeClient?.id, isAgency)
    const toolId = ENTITLEMENT_TO_TOOL_ID[item.requires] ?? item.requires
    return tools.some((t) => t.id === toolId && t.enabled)
  }

  // ── Acordeón: una sección abierta cada vez ────────────────────────────────
  // 20 items en una barra de 224px obligaban a hacer scroll para llegar a
  // Facturación o Recursos. Con el acordeón sólo se ve el bloque en el que
  // estás trabajando (decisión Carlos 11-sep: «más claro y limpio»).
  //
  // Tres reglas para que plegar no se convierta en esconder:
  //  · La sección de la página actual se abre sola al navegar — nunca pierdes
  //    de vista dónde estás.
  //  · La elección del usuario manda hasta que navega a otra sección, y se
  //    recuerda en este navegador.
  //  · Si una sección plegada tiene aprobaciones pendientes, el contador sube
  //    a su cabecera (más abajo).
  const [chosen, setChosen] = useState<string | null>(null)

  const activeSpaceKey = useMemo(
    () => IDEAL_SPACES.find((s) => s.items.some((i) => isActive(i.href)))?.key ?? null,
    // isActive depende de `path`, que es lo que de verdad cambia
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [path]
  )

  useEffect(() => {
    try {
      const stored = localStorage.getItem(OPEN_SPACE_KEY)
      if (stored !== null) setChosen(stored)
    } catch { /* navegador sin almacenamiento: el acordeón sigue funcionando */ }
  }, [])

  // Al cambiar de sección por navegación, esa pasa a ser la abierta.
  useEffect(() => {
    if (!activeSpaceKey) return
    setChosen(activeSpaceKey)
    try { localStorage.setItem(OPEN_SPACE_KEY, activeSpaceKey) } catch {}
  }, [activeSpaceKey])

  // Antes de leer localStorage (y en el render del servidor) manda la sección
  // activa: así no hay parpadeo ni desajuste de hidratación.
  const openKey = chosen ?? activeSpaceKey ?? IDEAL_SPACES[0]?.key ?? ''
  const isOpen = (key: string) => openKey === key
  const toggle = (key: string) => {
    const next = isOpen(key) ? '' : key
    setChosen(next)
    try { localStorage.setItem(OPEN_SPACE_KEY, next) } catch {}
  }

  const itemClass = (active: boolean, child = false) => clsx(
    'flex items-center gap-3 py-2 rounded-lg text-sm transition-all duration-150',
    // Sub-item (p. ej. el calendario bajo Marketing): indentado, mismo gesto.
    child ? 'pl-8 pr-3' : 'px-3',
    active
      ? 'bg-surface-hover text-ink font-medium'
      : 'text-ink-tertiary hover:text-ink hover:bg-surface'
  )

  return (
    <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto">
      {IDEAL_SPACES.map((space) => {
        const items = space.items.filter(canSee)
        if (items.length === 0) return null
        const open = isOpen(space.key)
        // Un aviso que no se ve no sirve: si la sección de Aprobaciones está
        // plegada, el contador sube a su cabecera.
        const hiddenBadge = !open && pendingCount > 0 && items.some((i) => i.href === '/approvals')
        return (
        <div key={space.key}>
          <button
            type="button"
            onClick={() => toggle(space.key)}
            aria-expanded={open}
            className="w-full flex items-center gap-1.5 px-2 mb-1 rounded transition-colors hover:text-ink-tertiary group"
          >
            <space.icon size={12} className="text-ink-muted shrink-0" />
            <span className="text-[9px] uppercase tracking-widest font-semibold text-ink-muted">
              {space.labelKey ? t(space.labelKey, locale) : space.label}
            </span>
            {hiddenBadge && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                {pendingCount}
              </span>
            )}
            <ChevronDown
              size={11}
              className={clsx(
                'shrink-0 text-ink-muted transition-transform duration-200',
                hiddenBadge ? 'ml-1.5' : 'ml-auto',
                open ? 'opacity-0 group-hover:opacity-100' : 'opacity-60 -rotate-90'
              )}
            />
          </button>
          <div className={clsx('space-y-0.5', !open && 'hidden')}>
            {items.map((item) => {
              const { href, icon: Icon } = item
              const label = item.labelKey ? t(item.labelKey, locale) : item.label
              const status = resolveNavItemStatus(item, plan)
              if (status !== 'available') {
                return (
                  <UnavailableNavItem key={href}
                    label={label} icon={Icon} status={status} locale={locale}
                    requiredPlan={minPlanForNavItem(item)}
                    className={itemClass(false, item.child)} />
                )
              }
              const active = isActive(href)
              const showBadge = href === '/approvals' && pendingCount > 0
              return (
                <Link key={href} href={href} className={itemClass(active, item.child)}>
                  <Icon size={item.child ? 13 : 15} className={active ? 'text-ink' : 'text-ink-tertiary'} />
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
          <Zap size={13} /> {t('sidebar.item.connections', locale)}
        </Link>
        <Link href="/billing"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/billing') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <CreditCard size={13} /> {t('sidebar.item.billing', locale)}
        </Link>
        <Link href="/resources"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/resources') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <BookOpen size={13} /> {t('sidebar.item.resources', locale)}
        </Link>
      </div>
    </nav>
  )
}
