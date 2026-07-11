'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Flame, Send, Settings, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { href: '/pipeline', label: 'Pipeline',  icon: BarChart2 },
  { href: '/outreach', label: 'Outreach',  icon: Send },
  { href: '/metrics',  label: 'Métricas',  icon: TrendingUp },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="flex min-h-screen">
      <aside className="w-52 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              C
            </div>
            <span className="font-semibold text-white tracking-wide text-sm">Comercial</span>
          </div>
          <p className="text-[10px] mt-1 ml-[36px]" style={{ color: 'var(--text-dim)' }}>
            SF Sales Engine
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  active ? 'text-white font-medium' : 'hover:text-white'
                )}
                style={{
                  background: active ? 'rgba(99,102,241,0.12)' : undefined,
                  color: active ? 'white' : 'var(--text-dim)',
                }}>
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>v0.1 · Startup Factory</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
