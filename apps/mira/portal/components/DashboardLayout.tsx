'use client'

import { useProjects } from '@/lib/hooks/useProjects'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LogOut, Grid3X3, Settings } from 'lucide-react'
import { useState } from 'react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { projects, user } = useProjects()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHome = pathname === '/home'
  const isProjects = pathname.startsWith('/projects')

  return (
    <div className="flex h-screen bg-page text-ink">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-line flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-line">
          <Link href="/home" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              M
            </div>
            MIRA
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2">
          <Link
            href="/home"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              isHome
                ? 'bg-purple-600 text-white'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            Dashboard
          </Link>

          <div className="py-4 border-t border-line">
            <p className="text-xs font-semibold text-ink-tertiary uppercase px-4 mb-3">
              Projects ({projects.length})
            </p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className={`block px-4 py-2 rounded-lg text-sm transition truncate ${
                    isProjects && pathname.includes(project.slug)
                      ? 'bg-purple-600/30 text-purple-400'
                      : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'
                  }`}
                >
                  {project.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-line space-y-3">
          {user && (
            <>
              <div className="text-sm">
                <p className="text-ink-secondary">Logged in as</p>
                <p className="font-medium truncate">{user.company_name}</p>
                <p className="text-xs text-ink-tertiary">{user.email}</p>
              </div>
              <div className="pt-3 border-t border-line">
                <p className="text-xs font-semibold text-ink-tertiary uppercase mb-2">
                  Plan
                </p>
                <p className="text-sm font-medium capitalize">{user.subscription_tier}</p>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-line bg-page px-6 py-4 flex items-center justify-between sticky top-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-surface-hover rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Link
              href="/admin/settings"
              className="p-2 hover:bg-surface-hover rounded-lg transition"
            >
              <Settings className="w-5 h-5 text-ink-secondary" />
            </Link>
            <button
              onClick={() => {
                // Implement logout
              }}
              className="p-2 hover:bg-surface-hover rounded-lg transition"
            >
              <LogOut className="w-5 h-5 text-ink-secondary" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/50 backdrop-blur-sm">
          <aside className="w-64 h-full bg-card border-r border-line flex flex-col p-6">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="mb-4 text-ink-secondary hover:text-ink"
            >
              ✕
            </button>
            <nav className="space-y-2">
              <Link
                href="/home"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-600 text-white"
              >
                <Grid3X3 className="w-5 h-5" />
                Dashboard
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </div>
  )
}
