'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import ClientPortalHeader from '@/components/client-portal-header'
import StatCard from '@/components/stat-card'
import { getClientStats } from '@/lib/client-portal-service'
import { createClient } from '@/lib/supabase'

export default function ReportesPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = createClient()
        const { data: { user } } = await db.auth.getUser()
        if (!user) return

        const meta = user.user_metadata || {}
        let clientId = meta.client_id

        if (!clientId) {
          const { data: access } = await db
            .from('mira_project_access')
            .select('project_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()
          clientId = access?.project_id
        }

        if (clientId) {
          const data = await getClientStats(clientId)
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="px-8 py-8 max-w-6xl">
      <ClientPortalHeader
        title="Mis Reportes"
        subtitle="Analytics, métricas y performance tracking"
        icon="📈"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {loading ? (
          <div className="col-span-4 flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-[#444]" />
          </div>
        ) : stats ? (
          <>
            <StatCard label="Contenido Generado" value={stats.contentGenerated} hint="Piezas en 30 días" />
            <StatCard label="Alcance Estimado" value={`${(stats.reachEstimated / 1000).toFixed(1)}K`} hint="Personas impactadas" />
            <StatCard label="Tiempo Ahorrado" value={`${stats.timeSavedHours.toFixed(1)}h`} hint="Vs creación manual" />
            <StatCard label="ROI Proyectado" value={`${stats.roiProjected}%`} hint="Basado en herramientas" />
          </>
        ) : (
          <div className="col-span-4 text-center text-[#666]">No data available</div>
        )}
      </div>

      {/* Reports by Tool */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Reportes por Herramienta
        </p>
        <div className="grid grid-cols-2 gap-4">
          {stats?.toolReports && stats.toolReports.length > 0 ? (
            stats.toolReports.map((report: any) => (
              <div key={report.tool} className="card px-5 py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{report.tool}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{report.uses} usos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-400">{report.avgRating.toFixed(1)}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>★ rating</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Última vez: {new Date(report.lastUsed).toLocaleDateString('es-ES')}
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <p className="text-sm">Sin reportes generados aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Tendencias Mensuales
        </p>
        <div className="card px-6 py-8">
          <div className="flex items-end justify-between h-32">
            {['Jun', 'Jul (parcial)'].map((month, i) => (
              <div key={month} className="flex flex-col items-center gap-2">
                <div className="w-12 rounded-t" style={{
                  height: i === 0 ? '120px' : '80px',
                  background: 'linear-gradient(180deg, #8B5CF6 0%, rgba(139,92,246,0.3) 100%)',
                  boxShadow: '0 4px 12px rgba(139,92,246,0.2)',
                }}></div>
                <p className="text-xs text-white font-medium">{month}</p>
              </div>
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
            📊 Proyección: +15% de uso en julio vs junio
          </p>
        </div>
      </div>
    </div>
  )
}
