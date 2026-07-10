'use client'

import { useState, useEffect } from 'react'
import { Zap, Play, Clock } from 'lucide-react'

const TOOLKIT_TOOLS = [
  {
    slug: 'brand-briefing',
    icon: '🧠',
    name: 'Brand Briefing',
    description: 'Pack completo de inteligencia de marca: 23 secciones, planes de contenido, Brand Brain JSON y roadmap.',
    time: '~20 min',
    color: '#EC4899',
    href: '/toolkit/brand-briefing'
  },
  {
    slug: 'seo-audit',
    icon: '🔍',
    name: 'Auditoría SEO',
    description: 'Diagnóstico técnico completo: on-page, Core Web Vitals, keywords, content gaps, backlinks y plan de acción prioritizado.',
    time: '~3 min',
    color: '#06B6D4',
    href: '/toolkit/seo-audit'
  },
  {
    slug: 'content-pack',
    icon: '📝',
    name: 'Content Pack',
    description: '15 posts listos para publicar + 10 scripts de Reel/TikTok + estrategia de plataformas.',
    time: '~10 min',
    color: '#8B5CF6',
    href: '/toolkit/content-pack'
  },
  {
    slug: 'marketing-audit',
    icon: '📊',
    name: 'Auditoría de Marketing',
    description: 'Análisis de 6 dimensiones: contenido, canales, conversión, posicionamiento.',
    time: '~4 min',
    color: '#F59E0B',
    href: '/toolkit/marketing-audit'
  },
  {
    slug: 'action-plan',
    icon: '📋',
    name: 'Plan de Acción 30/60/90',
    description: 'Plan de acción específico por semanas con acciones, KPIs, owners y recursos. Bebe del briefing existente.',
    time: '~3 min',
    color: '#10B981',
    href: '/toolkit/action-plan'
  },
  {
    slug: 'investor-deck',
    icon: '💼',
    name: 'Investor Deck',
    description: 'Pitch deck profesional (15-20 slides) con financials, tracción, TAM/SAM/SOM y modelo.',
    time: '~5 min',
    color: '#F87171',
    href: '/toolkit/investor-deck'
  },
  {
    slug: 'competitive-analysis',
    icon: '⚔️',
    name: 'Análisis Competitivo',
    description: 'Mapeo de 5-7 competidores, strengths/weaknesses, pricing, go-to-market y positioning gaps.',
    time: '~7 min',
    color: '#06B6D4',
    href: '/toolkit/competitive-analysis'
  },
  {
    slug: 'brandbook-content-system',
    icon: '📚',
    name: 'Brandbook Content System',
    description: 'Sistema completo de contenidos de marca: guías de tono, templates, arquetipos de personajes, calendarios editoriales y playbooks de contenido por canal.',
    time: '~30 min',
    color: '#8B5CF6',
    href: '/toolkit/brandbook-content-system'
  },
  {
    slug: 'marketing-campaign-generator',
    icon: '📢',
    name: 'Marketing Campaign Generator',
    description: 'Generador de campañas de marketing: estrategia mensual, distribución por canal, KPIs y métricas de éxito.',
    time: '~5 min',
    color: '#EC4899',
    href: '/toolkit/marketing-campaign-generator'
  },
  {
    slug: 'community-growth-blueprint',
    icon: '👥',
    name: 'Community Growth Blueprint',
    description: 'Estrategia de crecimiento comunitario: roadmap de 90 días, playbook de engagement, sourcing de influencers, métricas.',
    time: '~8 min',
    color: '#F59E0B',
    href: '/toolkit/community-growth-blueprint'
  },
]

export default function ToolkitPage() {
  const [generatedDeliverables, setGeneratedDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch delivered results from both generation_queue/deliverables and toolkit_results
    // For now, show as empty — would be connected to Supabase in real implementation
    setLoading(false)
  }, [])

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)', letterSpacing: '0.12em' }}>
          AI AGENCY
        </p>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Toolkit</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Genera reportes, estrategias y documentos en minutos. Personalizado con tu Brand Brain.
        </p>
      </div>

      {/* Centro de reportes — Generated Deliverables */}
      {generatedDeliverables.length > 0 && (
        <>
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
              Centro de Reportes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
            {generatedDeliverables.map((deliverable, i) => (
              <div
                key={deliverable.id || i}
                className="card overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              >
                {/* Banner con gradiente */}
                <div
                  className="h-32 flex items-center justify-center text-5xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${deliverable.color || '#8B5CF6'}33 0%, ${deliverable.color || '#8B5CF6'}11 100%)`,
                  }}
                >
                  {deliverable.icon}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.2)', color: '#22C55E' }}>
                    Live
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: `${deliverable.color || '#8B5CF6'}` }}>
                    {deliverable.category || 'Reportable'}
                  </p>
                  <h3 className="text-sm font-semibold text-white mb-2">{deliverable.title}</h3>
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {deliverable.description}
                  </p>

                  {/* Tags */}
                  {deliverable.tags && deliverable.tags.length > 0 && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {deliverable.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 rounded text-xs font-medium transition-all"
                      style={{
                        background: `${deliverable.color || '#8B5CF6'}`,
                        color: 'white'
                      }}
                    >
                      ↗ Ver Reportable
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Generar nuevo entregable */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-6" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
          Generar Nuevo Entregable
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLKIT_TOOLS.map((tool) => (
            <a
              key={tool.slug}
              href={tool.href}
              className="card p-4 hover:shadow-lg hover:border-white/20 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{tool.icon}</span>
                <span className="text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                  <Clock size={10} className="inline mr-1" />
                  {tool.time}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-white transition-all">{tool.name}</h3>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {tool.description}
              </p>

              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: tool.color }}>
                <span>Generar</span>
                <span>→</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Empty state when no deliverables yet */}
      {generatedDeliverables.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Aún no has generado ningún reportable. Elige una herramienta arriba para empezar.
          </p>
        </div>
      )}
    </div>
  )
}
