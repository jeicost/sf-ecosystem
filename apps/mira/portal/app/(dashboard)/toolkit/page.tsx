'use client'

import { useState, useEffect } from 'react'
import { Zap, Play, Clock } from 'lucide-react'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

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
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
              Centro de Reportes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {generatedDeliverables.map((deliverable, i) => (
              <div
                key={deliverable.id || i}
                className="card overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              >
                {/* Banner con gradiente + icono grande + Live badge */}
                <div
                  className="relative h-40 flex items-center justify-center text-7xl overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${deliverable.color || '#8B5CF6'}40 0%, ${deliverable.color || '#8B5CF6'}15 100%)`,
                  }}
                >
                  <div className="opacity-80 group-hover:opacity-100 transition-opacity">{deliverable.icon}</div>
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.25)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }}>
                    Live
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: `${deliverable.color || '#8B5CF6'}` }}>
                        {deliverable.category || 'Reportable'}
                      </p>
                      <h3 className="text-sm font-semibold text-white">{deliverable.title}</h3>
                    </div>
                  </div>

                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {deliverable.description}
                  </p>

                  {/* Tags */}
                  {deliverable.tags && deliverable.tags.length > 0 && (
                    <div className="flex gap-1.5 mb-4 flex-wrap">
                      {deliverable.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2.5 py-1 rounded-md" style={{ background: `${deliverable.color || '#8B5CF6'}15`, color: `${deliverable.color || '#8B5CF6'}cc` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Version dropdown + View button */}
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white cursor-pointer hover:border-white/20 transition-colors"
                      defaultValue="latest"
                    >
                      <option value="latest">Última versión</option>
                      <option value="v1">v1 (original)</option>
                    </select>
                    <button
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90"
                      style={{
                        background: `${deliverable.color || '#8B5CF6'}`,
                        color: 'white'
                      }}
                    >
                      ↗ Ver WEB
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
