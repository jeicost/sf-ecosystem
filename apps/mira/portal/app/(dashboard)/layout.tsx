'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import IdealSidebarNav from '@/components/ideal-sidebar-nav'
import ClientSwitcher from '@/components/client-switcher'
import SelfServeNavLink from '@/components/onboarding/SelfServeNavLink'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ClientProvider, useActiveClient } from '@/lib/client-context'
import { ProjectProvider } from '@/lib/project-context'
import { getActiveSectionFromPath } from '@/lib/sections'
import GenerationCapNotice from '@/components/generation-cap-notice'
import { getUser, clearUser, isSuperAdmin, type MiraUser } from '@/lib/auth'
import { canUseFeature } from '@/lib/plans'
import { createClient } from '@/lib/supabase'
import { getTheme, setTheme, initTheme, type Theme } from '@/lib/theme'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
// Removed import of hardcoded CLIENT_ID - now using dynamic activeClient
// import { CLIENT_ID } from '@/lib/constants'
import { Home, BookOpen, Brain, Zap, Layers, Menu, X, Archive, ClipboardList, CreditCard, Wrench } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'
import { ErrorBoundary } from '@/components/error-boundary'

function SidebarContent() {
  const path = usePathname()
  const router = useRouter()
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const [user, setUser]         = useState<MiraUser | null>(null)
  const [theme, setThemeState]  = useState<Theme>('dark')
  const [pendingCount, setPending] = useState(0)

useEffect(() => {
    const stored = getUser()
    if (stored) { setUser(stored); setThemeState(initTheme()); return }

    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login')
        return
      }
      const meta = data.user.user_metadata ?? {}
      const u: MiraUser = {
        id:     data.user.id,
        name:   meta.name   ?? data.user.email ?? 'User',
        email:  data.user.email ?? '',
        role:   meta.role   ?? 'client',
        plan:   meta.plan   ?? 'starter',
        avatar: meta.avatar ?? (data.user.email?.[0]?.toUpperCase() ?? 'U'),
      }
      import('@/lib/auth').then(m => m.setUser(u))
      setUser(u)
      setThemeState(initTheme())
    })
  }, [router, path])

  useEffect(() => {
    // Multi-empresa: el badge cuenta las aprobaciones del cliente ACTIVO
    // (no del client_id de metadata, que asume un solo cliente por usuario).
    const clientId = activeClient?.id
    if (!clientId) { setPending(0); return }

    const db = createClient()
    db.from('approval_queue').select('id', { count: 'exact', head: true })
      .eq('client_id', clientId).eq('status', 'pending_review')
      .then(({ count }) => setPending(count ?? 0))

    const channel = db.channel('sidebar-approvals')
      .on('postgres_changes',
        // La tabla real es approval_queue — el canal escuchaba una tabla
        // inexistente ("approvals") y el badge solo cambiaba al recargar.
        { event: '*', schema: 'public', table: 'approval_queue', filter: `client_id=eq.${clientId}` },
        () => {
          db.from('approval_queue').select('id', { count: 'exact', head: true })
            .eq('client_id', clientId).eq('status', 'pending_review')
            .then(({ count }) => setPending(count ?? 0))
        }
      ).subscribe()
    return () => { db.removeChannel(channel) }
  }, [activeClient?.id])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  if (!user) return null

  return (
    <>
      {/* Logo — white-label: el cliente ve SU marca; super_admin ve MIRA */}
      <div className="px-4 py-4 border-b border-line-subtle">
        {!isSuperAdmin(user) && activeClient?.logoUrl ? (
          <Link href="/home" className="flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeClient.logoUrl}
              alt={activeClient.name}
              className="h-8 w-auto max-w-[140px] object-contain transition-all group-hover:opacity-90"
              style={{
                filter: activeClient.primaryColor
                  ? `drop-shadow(0 0 8px ${activeClient.primaryColor}40)`
                  : undefined,
              }}
            />
            <div className="min-w-0">
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.03em',
                }}
                className="block truncate"
              >
                {activeClient.name}
              </span>
              <p className="text-[9px] text-ink-muted leading-none mt-0.5">powered by MIRA</p>
            </div>
          </Link>
        ) : (
          <Link href="/home" className="flex items-center gap-2 group">
            <div style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.3))' }}
              className="transition-all group-hover:drop-shadow-[0_0_12px_rgba(124,58,237,0.5)]">
              <MiraLogo size={26} variant="icon" />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>MIRA</span>
              <p className="text-[9px] text-ink-muted leading-none mt-0.5">AI Agency Platform</p>
            </div>
          </Link>
        )}
      </div>

      {/* Client switcher */}
      <div className="border-b border-line-subtle">
        <ClientSwitcher />
      </div>

      {/* Admin Panel — primera entrada para el super_admin */}
      {isSuperAdmin(user) && (
        <Link href="/admin"
          className={clsx(
            'mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
            path === '/admin' || path.startsWith('/admin/')
              ? 'bg-red-500/15 text-red-400'
              : 'text-ink-tertiary hover:text-red-400 hover:bg-red-500/10'
          )}>
          <span className="text-sm">🔐</span>
          <span>Admin Panel</span>
          <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(248,113,113,0.15)', color: 'rgba(248,113,113,0.7)' }}>
            AGENCY
          </span>
        </Link>
      )}

      {/* Alta autoservicio — fuera de los dos bloques de nav a propósito: es
          la puerta de entrada del plan Starter y tiene que existir con el flag
          de UI ideal encendido o apagado. Se auto-oculta salvo para un cliente
          sin pilares que aún no ha terminado el alta (ver SelfServeNavLink). */}
      <SelfServeNavLink path={path} isAgency={isSuperAdmin(user)} />

      {/* La navegación del portal. Antes iba condicionada a NEXT_PUBLIC_IDEAL_UI
          y debajo vivía la clásica como respaldo; esa se borró el 26-ago-2026
          tras comprobar que la ideal llevaba días siendo la única que ven los
          clientes en producción. Sin respaldo, condicionarla sería dejar el
          portal sin menú el día que alguien toque el flag. */}
      <IdealSidebarNav path={path} pendingCount={pendingCount} isAgency={isSuperAdmin(user)} plan={user.plan} />


      {/* Techo de generaciones/mes — solo se pinta si hay techo y quedan pocas.
          Va fuera de los dos bloques de nav: tiene que verse con la UI ideal
          encendida o apagada, igual que el alta autoservicio de arriba. */}
      <GenerationCapNotice />

      {/* Tour button */}
      <div className="px-3 pb-1">
        <button
          onClick={() => { localStorage.removeItem('mira_onboarding_v1'); window.location.href = '/home' }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all text-ink-muted hover:text-ink hover:bg-surface">
          <span>✦</span>
          <span>{t('onboarding.sidebar-trigger', locale)}</span>
        </button>
      </div>

      {/* Theme toggle */}
      <div className="px-3 py-2">
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 group"
          style={{
            background: theme === 'light' ? 'rgba(99,102,241,0.08)' : 'var(--bg-surface)',
            border: theme === 'light' ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--border-subtle)',
          }}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="text-[11px] font-medium text-ink-secondary">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </div>
          <div className="w-8 h-4 rounded-full relative transition-all duration-200 flex-shrink-0"
            style={{ background: theme === 'light' ? '#6366f1' : 'var(--border)' }}>
            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200"
              style={{ left: theme === 'light' ? '17px' : '2px' }} />
          </div>
        </button>
        <LanguageSwitcher />
      </div>

      {/* Legal links */}
      <div className="px-4 pb-1 flex items-center gap-2 text-[9px] text-ink-muted">
        <Link href="/terms" className="hover:text-ink-tertiary">Terms</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-ink-tertiary">Privacy</Link>
        <span>·</span>
        <Link href="/cookies" className="hover:text-ink-tertiary">Cookies</Link>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-line-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] truncate text-ink-secondary">{user.name}</p>
            <p className="text-[9px] text-ink-tertiary">{user.plan} plan</p>
          </div>
          <button onClick={async () => { clearUser(); await createClient().auth.signOut(); router.push('/login') }}
            className="text-[11px] transition-colors shrink-0 text-ink-muted hover:text-ink-secondary">
            ↩
          </button>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Cierra el drawer al navegar (cualquier Link del sidebar cambia la ruta).
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <ClientProvider>
      <ProjectProvider>
        <div className="flex min-h-screen">
          {/* Overlay móvil */}
          {mobileOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Sidebar — drawer fijo en móvil, estático en desktop */}
          <aside
            className={clsx(
              'w-56 shrink-0 border-r border-line-subtle flex flex-col bg-[var(--bg-sidebar)]',
              'fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-200',
              'md:relative md:inset-auto md:translate-x-0',
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden self-end m-2 p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-hover"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-y-auto bg-page min-w-0">
            {/* Barra superior — solo móvil */}
            <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-line-subtle bg-page">
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 -ml-2 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-hover"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <MiraLogo size={18} variant="icon" />
              <span className="text-sm font-semibold text-ink">MIRA</span>
            </div>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </ProjectProvider>
    </ClientProvider>
  )
}
