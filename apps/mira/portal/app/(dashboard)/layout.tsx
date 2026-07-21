'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import SectionSwitcher from '@/components/section-switcher'
import ClientSwitcher from '@/components/client-switcher'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ClientProvider, useActiveClient } from '@/lib/client-context'
import { ProjectProvider } from '@/lib/project-context'
import { getActiveSectionFromPath } from '@/lib/sections'
import { getUser, clearUser, isSuperAdmin, type MiraUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { getTheme, setTheme, initTheme, type Theme } from '@/lib/theme'
// Removed import of hardcoded CLIENT_ID - now using dynamic activeClient
// import { CLIENT_ID } from '@/lib/constants'
import { Home, BookOpen, Brain, Zap, Layers } from 'lucide-react'
import MiraLogo from '@/components/mira-logo'
import { ErrorBoundary } from '@/components/error-boundary'

function SidebarContent() {
  const path = usePathname()
  const router = useRouter()
  const { activeClient } = useActiveClient()
  const [user, setUser]         = useState<MiraUser | null>(null)
  const [theme, setThemeState]  = useState<Theme>('dark')
  const [pendingCount, setPending] = useState(0)
  const activeSection = getActiveSectionFromPath(path)
  const navItems = activeSection?.navItems ?? []

useEffect(() => {
    const stored = getUser()
    if (stored) { setUser(stored); setThemeState(initTheme()); return }

    const devBypass = process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true'
    
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) {
        // Allow dev mode bypass for toolkit testing
        if (devBypass && (path.startsWith('/toolkit') || path.startsWith('/brand-brain') || path.startsWith('/documents') || path.startsWith('/project-memory'))) {
          setThemeState(initTheme())
          return
        }
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
        { event: '*', schema: 'public', table: 'approvals', filter: `client_id=eq.${clientId}` },
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
              : 'text-ink-tertiary hover:text-red-400 hover:bg-red-500/8'
          )}>
          <span className="text-sm">🔐</span>
          <span>Admin Panel</span>
          <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'rgba(248,113,113,0.15)', color: 'rgba(248,113,113,0.7)' }}>
            AGENCY
          </span>
        </Link>
      )}

      {/* Home */}
      <Link href="/home"
        className={clsx(
          'mx-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          isSuperAdmin(user) ? 'mt-2' : 'mt-3',
          path === '/home'
            ? 'bg-surface-hover text-ink'
            : 'text-ink-tertiary hover:text-ink hover:bg-surface'
        )}>
        <Home size={13} />
        Home
      </Link>

      {/* Brand Brain — global link */}
      <Link href="/brand-brain"
        className={clsx(
          'mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          path === '/brand-brain'
            ? 'bg-violet-500/15 text-violet-400'
            : 'text-ink-tertiary hover:text-violet-400 hover:bg-violet-500/8'
        )}>
        <Brain size={13} />
        <span>Brand Brain</span>
        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(167,139,250,0.15)', color: 'rgba(167,139,250,0.7)' }}>
          CORE
        </span>
      </Link>

      {/* Toolkit — global link */}
      <Link href="/toolkit"
        className={clsx(
          'mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          path === '/toolkit'
            ? 'bg-violet-500/15 text-violet-400'
            : 'text-ink-tertiary hover:text-violet-400 hover:bg-violet-500/8'
        )}>
        <Layers size={13} />
        <span>Toolkit</span>
      </Link>

      {/* Documentos — global link */}
      <Link href="/documents"
        className={clsx(
          'mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          path.startsWith('/documents')
            ? 'bg-amber-500/15 text-amber-400'
            : 'text-ink-tertiary hover:text-amber-400 hover:bg-amber-500/8'
        )}>
        <span className="text-sm">📄</span>
        <span>Documentos</span>
        <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}>
          NEW
        </span>
      </Link>

      {/* Integrations */}
      <Link href="/integrations"
        className={clsx(
          'mx-3 mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
          path === '/integrations'
            ? 'bg-pink-500/15 text-pink-400'
            : 'text-ink-tertiary hover:text-pink-400 hover:bg-pink-500/8'
        )}>
        <Zap size={13} />
        <span>Integrations</span>
      </Link>

      {/* Section switcher */}
      <div className="mt-2">
        <SectionSwitcher activeSlug={activeSection?.slug ?? ''} userPlan={user.plan} />
      </div>

      {/* Section label */}
      {activeSection && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-[9px] uppercase tracking-widest font-medium" style={{ color: activeSection.color }}>
            {activeSection.shortName}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href + '/'))
          const isApprovals = href === '/approvals'
          const showBadge   = isApprovals && pendingCount > 0
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-surface-hover text-ink font-medium'
                  : 'text-ink-tertiary hover:text-ink hover:bg-surface'
              )}
            >
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
      </nav>

      {/* Resources */}
      <div className="px-3 pb-1">
        <Link href="/resources"
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all',
            path.startsWith('/resources')
              ? 'bg-surface-hover text-ink'
              : 'text-ink-tertiary hover:text-ink hover:bg-surface'
          )}>
          <BookOpen size={13} />
          <span>Resources</span>
        </Link>
      </div>

      {/* Tour button */}
      <div className="px-3 pb-1">
        <button
          onClick={() => { localStorage.removeItem('mira_onboarding_v1'); window.location.href = '/home' }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all text-ink-muted hover:text-ink">
          <span>✦</span>
          <span>Portal tour</span>
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
  return (
    <ClientProvider>
      <ProjectProvider>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 border-r border-line-subtle flex flex-col bg-[var(--bg-sidebar)]">
            <SidebarContent />
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-y-auto bg-page">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </ProjectProvider>
    </ClientProvider>
  )
}
