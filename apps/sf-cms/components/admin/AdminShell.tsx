'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, FileText, Newspaper, Image as ImageIcon, Users, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/posts', label: 'Posts', icon: Newspaper },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
] as const

export function AdminShell({
  isGlobalAdmin,
  children,
}: {
  isGlobalAdmin: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()

  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-slate-50">{children}</div>
  }

  const navItems = isGlobalAdmin
    ? [...NAV_ITEMS, { href: '/admin/access', label: 'Access', icon: Users }]
    : NAV_ITEMS

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900 p-5 text-white">
        <div className="mb-8 px-2">
          <h2 className="text-lg font-semibold tracking-tight">SF-CMS</h2>
          <p className="mt-0.5 text-xs text-slate-400">Content Management</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon, ...rest }) => {
            const exact = 'exact' in rest && rest.exact
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-4 border-t border-slate-800 pt-4">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
