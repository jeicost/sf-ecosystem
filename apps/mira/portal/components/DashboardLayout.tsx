'use client'

import { useProjects } from '@/lib/hooks/useProjects'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LogOut, Grid3X3, Settings } from 'lucide-react'
import { useState } from 'react'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { projects, user, loading } = useProjects()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHome = pathname === '/home'
  const isProjects = pathname.startsWith('/projects')

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 border-r border-gray-800 flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
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
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            Dashboard
          </Link>

          <div className="py-4 border-t border-gray-800">
            <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-3">
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
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {project.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-6 border-t border-gray-800 space-y-3">
          {user && (
            <>
              <div className="text-sm">
                <p className="text-gray-400">Logged in as</p>
                <p className="font-medium truncate">{user.company_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="pt-3 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
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
        <div className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <Link
              href="/admin/settings"
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </Link>
            <button
              onClick={() => {
                // Implement logout
              }}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
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
          <aside className="w-64 h-full bg-gray-900 border-r border-gray-800 flex flex-col p-6">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="mb-4 text-gray-400 hover:text-white"
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
