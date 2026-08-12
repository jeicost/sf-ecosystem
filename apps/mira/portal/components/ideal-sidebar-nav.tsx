'use client'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Zap, BookOpen, CreditCard } from 'lucide-react'
import { IDEAL_SPACES } from '@/lib/sections'
import { useActiveClient } from '@/lib/client-context'
import { hasTenderTool } from '@/lib/entitlements'

// Navegación consolidada del sistema ideal: 6 espacios en vez de 27 rutas
// sueltas (Fase 1). Se monta detrás del flag NEXT_PUBLIC_IDEAL_UI; con el flag
// apagado, el layout renderiza la navegación de siempre y este componente no
// aparece. Nada se borra: las rutas fuera de estos espacios (Operaciones,
// Finanzas, marketplace) siguen accesibles por URL — solo salen del menú.
export default function IdealSidebarNav({
  path,
  pendingCount,
  isAgency,
}: {
  path: string
  pendingCount: number
  isAgency: boolean
}) {
  const isActive = (href: string) => path === href || (href !== '/' && path.startsWith(href + '/'))
  const { activeClient } = useActiveClient()

  // Herramientas restringidas por cliente (p. ej. Licitaciones): solo aparecen
  // para clientes con el entitlement, o para la agencia.
  const canSee = (item: { requires?: 'tender' }) =>
    item.requires !== 'tender' || hasTenderTool(activeClient?.id, isAgency)

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
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              const showBadge = href === '/approvals' && pendingCount > 0
              return (
                <Link key={href} href={href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                    active
                      ? 'bg-surface-hover text-ink font-medium'
                      : 'text-ink-tertiary hover:text-ink hover:bg-surface'
                  )}>
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
          <Zap size={13} /> Integraciones
        </Link>
        <Link href="/billing"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/billing') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <CreditCard size={13} /> Facturación
        </Link>
        <Link href="/resources"
          className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] transition-all',
            isActive('/resources') ? 'bg-surface-hover text-ink' : 'text-ink-tertiary hover:text-ink hover:bg-surface')}>
          <BookOpen size={13} /> Recursos
        </Link>
      </div>
    </nav>
  )
}
