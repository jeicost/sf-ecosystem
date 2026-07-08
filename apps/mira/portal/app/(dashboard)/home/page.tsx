'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getUser } from '@/lib/auth'

const TEAMS = [
  { slug: 'marketing',  label: 'Marketing',  icon: '🎯', color: '#8B5CF6', href: '/roster',              agents: 8, desc: 'Content · Copy · Ads · Community' },
  { slug: 'comercial',  label: 'Sales',       icon: '🚀', color: '#EF4444', href: '/comercial',           agents: 5, desc: 'Discovery · Scoring · Proposals' },
  { slug: 'estrategia', label: 'Strategy',    icon: '🔭', color: '#6366F1', href: '/estrategia',          agents: 4, desc: 'Plans · Audits · Competitive' },
  { slug: 'innovacion', label: 'Innovation',  icon: '💡', color: '#F97316', href: '/innovacion',          agents: 5, desc: 'Trends · Design Thinking · Foresight' },
  { slug: 'admin',      label: 'Admin',       icon: '⚙️', color: '#10B981', href: '/admin',               agents: 4, desc: 'Billing · Onboarding · Observability' },
  { slug: 'finanzas',   label: 'Finance',     icon: '💰', color: '#F59E0B', href: '/finanzas',            agents: 4, desc: 'Wealth · Investments · Tax · FIRE' },
]

export default function HomePage() {
  const [userName, setUserName] = useState('')
  const [plan, setPlan] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getUser()
    if (stored) {
      setUserName(stored.name ?? stored.email)
      setPlan(stored.plan ?? '')
    }

    const db = createClient()
    db.auth.getUser().then(({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      setUserName(meta.name ?? data.user.email ?? '')
      setPlan(meta.plan ?? '')
    })

    db.from('mira_projects').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setProjects(data ?? []); setLoading(false) })
  }, [])

  const firstName = userName.split(' ')[0] || userName

  return (
    <div className="px-8 py-8 max-w-5xl">

      {/* Welcome */}
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.7)', letterSpacing: '0.12em' }}>
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          {firstName ? `Welcome back, ${firstName.split('@')[0]}` : 'Welcome to MIRA'}
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Your AI agency — 30 agents working 24/7.
          {plan && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(139,92,246,0.12)', color: 'rgba(167,139,250,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
            {plan}
          </span>}
        </p>
      </div>

      {/* 6 Teams grid */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Your teams
        </p>
        <div className="grid grid-cols-3 gap-3">
          {TEAMS.map(team => (
            <Link key={team.slug} href={team.href}
              className="group relative flex flex-col rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${team.color}35`
                el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${team.color}18`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.boxShadow = 'none'
              }}
            >
              <div className="h-px w-full mb-4 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent 5%, ${team.color}cc 50%, transparent 95%)` }} />

              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${team.color}15`, border: `1px solid ${team.color}25` }}>
                  {team.icon}
                </div>
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: `${team.color}10`, color: `${team.color}cc`, border: `1px solid ${team.color}20` }}>
                  {team.agents} agents
                </span>
              </div>

              <p className="text-[13px] font-semibold text-white mb-1">{team.label}</p>
              <p className="text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{team.desc}</p>

              <div className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Ready</span>
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-1"
                  style={{ color: team.color }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Projects
          </p>
          <Link href="/projects/new"
            className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Plus size={12} />
            New project
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-[#444]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl py-10 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-sm text-[#444] mb-3">No projects yet</p>
            <Link href="/projects/new"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-all"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Plus size={12} /> Create your first project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {projects.map(p => (
              <Link key={p.id} href={`/projects/${p.slug}`}
                className="group rounded-2xl p-4 transition-all hover:bg-white/3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{p.name}</p>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                    Active
                  </span>
                </div>
                <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.slug}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#555]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
