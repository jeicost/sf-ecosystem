'use client'

import Link from 'next/link'
import { ArrowRight, FileText, TrendingUp, Settings, Palette } from 'lucide-react'
import ClientPortalHeader from '@/components/client-portal-header'
import StatCard from '@/components/stat-card'

const QUICK_ACTIONS = [
  {
    icon: '📦',
    label: 'Mis Entregas',
    desc: 'Historial de todos los deliverables generados',
    href: '/client-portal/entregas',
    color: '#8B5CF6',
  },
  {
    icon: '📈',
    label: 'Mis Reportes',
    desc: 'Analytics, métricas y performance tracking',
    href: '/client-portal/reportes',
    color: '#6366F1',
  },
  {
    icon: '🎨',
    label: 'Mi Brand Brain',
    desc: 'Perfil de marca, pillars de contenido, voz',
    href: '/client-portal/brand',
    color: '#F97316',
  },
  {
    icon: '⚙️',
    label: 'Mi Configuración',
    desc: 'Perfil, preferencias, equipo, facturación',
    href: '/client-portal/config',
    color: '#10B981',
  },
]

export default function ClientPortalHome() {
  return (
    <div className="px-8 py-8 max-w-5xl">
      <ClientPortalHeader
        title="Mi Portal MIRA"
        subtitle="Gestiona tu marca, entregas, reportes y configuración"
        icon="🏢"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        <StatCard label="Entregas Generadas" value="12" hint="Este mes" />
        <StatCard label="Herramientas Usadas" value="5/7" hint="Brand Briefing, SEO, Content..." />
        <StatCard label="Últimas 30 días" value="2.5h" hint="Tiempo ahorrado con IA" />
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
          {[
            { date: '2026-07-09', action: 'Entregable generado: Brand Briefing', tool: 'Brand Briefing' },
            { date: '2026-07-08', action: 'SEO Audit completado y revisado', tool: 'SEO Audit' },
            { date: '2026-07-07', action: 'Content Pack descargado', tool: 'Content Pack' },
          ].map((item, i) => (
            <div key={i} className="card px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{item.action}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.date}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                {item.tool}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
