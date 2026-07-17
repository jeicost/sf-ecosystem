'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowRight, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getUser, isSuperAdmin } from '@/lib/auth'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import AdminClientsOverview from '@/components/admin-clients-overview'
import StatCard from '@/components/stat-card'
import UnifiedHistory from '@/components/unified-history'
import PageHeader from '@/components/ui/PageHeader'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'
import { getClientStats } from '@/lib/client-portal-service'

const QUICK_ACCESS_CONFIG = [
  { icon: '📁', labelKey: 'home.documentation', href: '/client-portal/documentation', color: '#8B5CF6' },
  { icon: '📦', labelKey: 'home.deliveries', href: '/client-portal/entregas', color: '#6366F1' },
  { icon: '🎨', labelKey: 'brain.title', href: '/brand-brain', color: '#10B981' },
  { icon: '⚙️', labelKey: 'home.configuration', href: '/client-portal/config', color: '#EF4444' },
]

export default function HomePage() {
  const { locale } = useLocaleContext()
  const [userName, setUserName] = useState('')
  const [plan, setPlan] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getUser()
    if (stored) {
      setUserName(stored.name ?? stored.email)
      setPlan(stored.plan ?? '')
    }

    const db = createClient()
    db.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const meta = data.user.user_metadata ?? {}
      setUserName(meta.name ?? data.user.email ?? '')
      setPlan(meta.plan ?? '')

      // Fetch client stats if not super_admin
      if (!isSuperAdmin({ id: data.user.id, plan: meta.plan ?? '' } as any)) {
        let cId = meta.client_id
        if (!cId) {
          const { data: access } = await db
            .from('mira_project_access')
            .select('project_id')
            .eq('user_id', data.user.id)
            .limit(1)
            .single()
          cId = access?.project_id
        }
        if (cId) {
          const statsData = await getClientStats(cId)
          setStats(statsData)
        }
      }

      db.from('mira_projects').select('*').order('created_at', { ascending: false })
        .then(({ data: projects }) => { setProjects(projects ?? []); setLoading(false) })
    })
  }, [])

  const firstName = userName.split(' ')[0] || userName

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Super Admin: Clients Dashboard | Regular users: Full Portal */}
      {isSuperAdmin(getUser()) ? (
        <div className="mb-10">
          <AdminClientsOverview />
        </div>
      ) : (
        <>
          {/* Welcome */}
          <PageHeader
            eyebrow="Dashboard"
            eyebrowColor="#8B5CF6"
            title={firstName ? `Welcome back, ${firstName.split('@')[0]}` : 'Welcome to MIRA'}
            subtitle={
              <>
                Your AI agency — 30 agents working 24/7.
                {plan && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                  style={{ background: 'rgba(139,92,246,0.12)', color: 'rgba(167,139,250,0.8)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  {plan}
                </span>}
              </>
            }
          />

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10">
              <StatCard label="Entregas Generadas" value={stats.contentGenerated} hint="Este mes" />
              <StatCard label="Herramientas Usadas" value={`${stats.toolsUsed}/7`} hint="Toolkit completo" />
              <StatCard label={t('home.last-30-days', locale)} value={`${stats.timeSavedHours.toFixed(1)}h`} hint={t('home.time-saved-ai', locale)} />
            </div>
          )}

          {/* Recent Generations */}
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Your recent generations
            </p>
            <UnifiedHistory />
          </div>

          {/* Quick Access */}
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {t('home.quick-shortcuts', locale)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
              {QUICK_ACCESS_CONFIG.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group relative flex flex-col rounded-xl p-4 overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${action.color}35`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <div className="text-lg mb-2">{action.icon}</div>
                  <p className="text-[12px] font-semibold text-white">{t(action.labelKey, locale)}</p>
                  <div className="mt-auto pt-2">
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: action.color }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 6 Teams grid */}
          <div className="mb-10">
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Your teams
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(DEPARTMENT_METADATA).map(dept => (
                <Link key={dept.slug} href={dept.href}
                  className="group relative flex flex-col rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${dept.color}35`
                    el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${dept.color}18`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(255,255,255,0.08)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  <div className="h-px w-full mb-4 opacity-40 group-hover:opacity-100 transition-opacity"
                    style={{ background: `linear-gradient(90deg, transparent 5%, ${dept.color}cc 50%, transparent 95%)` }} />

                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}25` }}>
                      {dept.icon}
                    </div>
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: `${dept.color}10`, color: `${dept.color}cc`, border: `1px solid ${dept.color}20` }}>
                      {dept.count > 0 ? `${dept.count} agents` : 'Support tools'}
                    </span>
                  </div>

                  <p className="text-[13px] font-semibold text-white mb-1">{dept.name}</p>
                  <p className="text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{dept.description}</p>

                  <div className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Ready</span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1"
                      style={{ color: dept.color }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Projects — only visible to super_admin (dead scaffolding for regular users) */}
      {isSuperAdmin(getUser()) && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
      )}
    </div>
  )
}
