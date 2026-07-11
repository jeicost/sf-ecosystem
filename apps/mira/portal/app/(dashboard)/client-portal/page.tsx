'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, TrendingUp, Settings, Palette, Loader2 } from 'lucide-react'
import ClientPortalHeader from '@/components/client-portal-header'
import StatCard from '@/components/stat-card'
import { getClientStats, getClientDeliveries } from '@/lib/client-portal-service'
import { createClient } from '@/lib/supabase'

const QUICK_ACTIONS = [
  {
    icon: '📁',
    label: 'Documentación',
    desc: 'Sube brand book, docs, handbooks para agentes',
    href: '/client-portal/documentation',
    color: '#8B5CF6',
  },
  {
    icon: '📦',
    label: 'Mis Entregas',
    desc: 'Historial de todos los deliverables generados',
    href: '/client-portal/entregas',
    color: '#6366F1',
  },
  {
    icon: '📈',
    label: 'Mis Reportes',
    desc: 'Analytics, métricas y performance tracking',
    href: '/client-portal/reportes',
    color: '#F97316',
  },
  {
    icon: '🎨',
    label: 'Mi Brand Brain',
    desc: 'Perfil de marca, pillars de contenido, voz',
    href: '/client-portal/brand',
    color: '#10B981',
  },
  {
    icon: '⚙️',
    label: 'Mi Configuración',
    desc: 'Perfil, preferencias, equipo, facturación',
    href: '/client-portal/config',
    color: '#EF4444',
  },
]

export default function ClientPortalHome() {
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = createClient()
        const { data: { user } } = await db.auth.getUser()
        if (!user) return

        // Get client ID from user metadata or query client table
        const meta = user.user_metadata || {}
        let cId = meta.client_id

        if (!cId) {
          // Fallback: get first client this user has access to
          const { data: access } = await db
            .from('mira_project_access')
            .select('project_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()
          cId = access?.project_id
        }

        if (cId) {
          setClientId(cId)
          const statsData = await getClientStats(cId)
          setStats(statsData)

          const deliveries = await getClientDeliveries(cId)
          const recentActivities = deliveries
            .slice(0, 3)
            .map((d: any) => ({
              date: d.date,
              action: `Entregable generado: ${d.tool}`,
              tool: d.tool,
            }))
          setActivities(recentActivities)
        }
      } catch (error) {
        console.error('Failed to fetch client data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="px-8 py-8 max-w-5xl">
      <ClientPortalHeader
        title="Mi Portal MIRA"
        subtitle="Gestiona tu marca, entregas, reportes y configuración"
        icon="🏢"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-[#444]" />
          </div>
        ) : stats ? (
          <>
            <StatCard label="Entregas Generadas" value={stats.contentGenerated} hint="Este mes" />
            <StatCard label="Herramientas Usadas" value={`${stats.toolsUsed}/7`} hint="Toolkit completo" />
            <StatCard label="Últimas 30 días" value={`${stats.timeSavedHours.toFixed(1)}h`} hint="Tiempo ahorrado con IA" />
          </>
        ) : (
          <div className="col-span-3 text-center text-[#666]">No data available</div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Accesos rápidos
        </p>
        <div className="grid grid-cols-2 gap-4">
          {QUICK_ACTIONS.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="group relative flex flex-col rounded-2xl p-5 overflow-hidden transition-all duration-200 hover:scale-[1.01]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${action.color}35`
                el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${action.color}18`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.boxShadow = 'none'
              }}
            >
              <div className="h-px w-full mb-4 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent 5%, ${action.color}cc 50%, transparent 95%)` }} />

              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
                  {action.icon}
                </div>
              </div>

              <p className="text-[13px] font-semibold text-white mb-1">{action.label}</p>
              <p className="text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{action.desc}</p>

              <div className="flex items-center justify-between mt-4 pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Abrir</span>
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-1"
                  style={{ color: action.color }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Actividad Reciente
        </p>
        <div className="space-y-2">
          {activities.length > 0 ? (
            activities.map((item, i) => (
              <div key={i} className="card px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{item.action}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(item.date).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                  {item.tool}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p className="text-sm">No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
