'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, BookOpen, Download } from 'lucide-react'
import { getUser, type MiraUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'

// ─── Department directory ───────────────────────────────────────────────────
// Video guides aren't recorded yet — this is shown as an inert "coming soon"
// list, not clickable content. See the video guides section below.

const DEPARTMENTS: Record<string, { icon: string; label: string }> = {
  marketing: { icon: '🎯', label: 'Marketing' },
  comercial: { icon: '🚀', label: 'Sales' },
  estrategia: { icon: '🔭', label: 'Strategy' },
  innovacion: { icon: '💡', label: 'Innovation' },
  admin: { icon: '⚙️', label: 'Admin' },
  finanzas: { icon: '💰', label: 'Finance' },
}

const DEPT_ORDER = ['marketing', 'comercial', 'estrategia', 'innovacion', 'admin', 'finanzas']

export default function ResourcesPage() {
  const router = useRouter()
  const [user, setUser] = useState<MiraUser | null>(null)

  useEffect(() => {
    const stored = getUser()
    if (stored) { setUser(stored); return }
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      const meta = data.user.user_metadata ?? {}
      const u: MiraUser = {
        id: data.user.id, name: meta.name ?? data.user.email ?? 'User',
        email: data.user.email ?? '', role: meta.role ?? 'client',
        plan: meta.plan ?? 'starter',
        avatar: meta.avatar ?? (data.user.email?.[0]?.toUpperCase() ?? 'U'),
      }
      import('@/lib/auth').then(m => m.setUser(u))
      setUser(u)
    })
  }, [router])

  if (!user) return null

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2"
          style={{ color: 'rgba(99,102,241,0.7)' }}>Training center</p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Resources</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          The user manual, plus video guides as they get produced.
        </p>
      </div>

      {/* User manual */}
      <section className="mb-10">
        <div className="card p-6 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <BookOpen size={20} style={{ color: '#818cf8' }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">User manual (PDF)</h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Everything you need to run your MIRA team — agents, workflows, and best practices in one document.
              </p>
            </div>
          </div>
          <a href="/docs/MIRA-Manual-de-Usuario.pdf" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Download size={13} /> Open PDF
          </a>
        </div>
      </section>

      {/* Video guides */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-sm font-semibold text-ink">Video guides</h2>
          <div className="flex-1" style={{ height: '1px', background: 'var(--border-subtle)' }} />
        </div>
        <div className="rounded-2xl border border-dashed py-10 px-8 text-center" style={{ borderColor: 'var(--border)' }}>
          <Clock size={22} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium text-ink-secondary mb-1">Coming soon</p>
          <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Step-by-step video walkthroughs for every agent are in production and will land here department by department.
            Until then, the user manual above covers the full team.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {DEPT_ORDER.map(slug => {
              const dept = DEPARTMENTS[slug]
              return (
                <span key={slug} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <span className="leading-none">{dept.icon}</span> {dept.label}
                </span>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
