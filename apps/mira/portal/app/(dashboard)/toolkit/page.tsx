'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const TOOLS = [
  {
    id: 'brand-briefing',
    name: 'Brand Briefing',
    icon: '📋',
    desc: 'Definición de marca en profundidad',
    color: '#8B5CF6',
    href: '/toolkit/brand-briefing',
  },
  {
    id: 'seo-audit',
    name: 'SEO Audit',
    icon: '🔍',
    desc: 'Análisis SEO técnico y estratégico',
    color: '#6366F1',
    href: '/toolkit/seo-audit',
  },
  {
    id: 'content-pack',
    name: 'Content Pack',
    icon: '📝',
    desc: 'Paquete de contenido mensual',
    color: '#F97316',
    href: '/toolkit/content-pack',
  },
  {
    id: 'marketing-audit',
    name: 'Marketing Audit',
    icon: '📊',
    desc: 'Auditoría de estrategia de marketing',
    color: '#10B981',
    href: '/toolkit/marketing-audit',
  },
  {
    id: 'action-plan',
    name: 'Action Plan 90d',
    icon: '🎯',
    desc: 'Plan de acción 90 días',
    color: '#F59E0B',
    href: '/toolkit/action-plan',
  },
  {
    id: 'investor-deck',
    name: 'Investor Deck',
    icon: '💼',
    desc: 'Presentación para inversores',
    color: '#EF4444',
    href: '/toolkit/investor-deck',
  },
  {
    id: 'competitive-analysis',
    name: 'Competitive Analysis',
    icon: '🏆',
    desc: 'Análisis competitivo y posicionamiento',
    color: '#8B5CF6',
    href: '/toolkit/competitive-analysis',
  },
]

export default function ToolkitPage() {
  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-10">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)' }}>
          Toolkit
        </p>
        <h1 className="text-3xl font-semibold text-white tracking-tight">
          7 Herramientas de IA
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Explora cada herramienta, ejecuta proyectos y descarga resultados
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {TOOLS.map(tool => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group relative flex flex-col rounded-2xl p-6 overflow-hidden transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = `${tool.color}35`
              el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${tool.color}18`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'rgba(255,255,255,0.08)'
              el.style.boxShadow = 'none'
            }}
          >
            <div className="h-px w-full mb-4 opacity-40 group-hover:opacity-100 transition-opacity"
              style={{ background: `linear-gradient(90deg, transparent 5%, ${tool.color}cc 50%, transparent 95%)` }} />

            <div className="text-4xl mb-3">{tool.icon}</div>
            <p className="text-lg font-semibold text-white mb-1">{tool.name}</p>
            <p className="text-[13px] flex-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{tool.desc}</p>

            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Explorar</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" style={{ color: tool.color }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
