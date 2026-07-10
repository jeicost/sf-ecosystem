'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function ActionPlanPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ToolkitToolPage
      icon="🎯"
      name="Action Plan 90d"
      description="Plan operacional de 90 días con objetivos, hitos, KPIs y recursos asignados. Alineado con tu estrategia y presupuesto."
      color="#F59E0B"
      estimatedTime="25-30 minutos"
      outputFormat="Plan PDF de 20+ páginas + Gantt chart + Excel tracking"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Generar Plan 90 Días</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Objetivo Principal (Ej: 50% MRR growth)
              </label>
              <input
                type="text"
                placeholder="Ej: Aumentar revenue mensual recurrente..."
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Recursos disponibles (equipo)
              </label>
              <input
                type="number"
                placeholder="Ej: 5"
                min="1"
                max="50"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Presupuesto estimado (USD)
              </label>
              <input
                type="number"
                placeholder="Ej: 50000"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <button
            onClick={() => setIsGenerating(true)}
            disabled={isGenerating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando plan...' : 'Generar Action Plan'}
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#F59E0B' }}>
                Estructura del Plan
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>📍 <strong>Mes 1:</strong> Foundational Phase</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }} >Hitos: Setup, auditoría, quick wins (proyección: 15% improvement)</p>
                <p className="mt-3">📍 <strong>Mes 2:</strong> Acceleration Phase</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Hitos: Scaling, optimization, integrations (proyección: 35% improvement)</p>
                <p className="mt-3">📍 <strong>Mes 3:</strong> Optimization Phase</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Hitos: Fine-tuning, ROI validation, handoff (proyección: 50% improvement)</p>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#F59E0B' }}>
                KPIs Objetivo
              </p>
              <div className="space-y-2 text-sm text-white">
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Revenue Growth</span>
                  <span style={{ color: '#FBBF24' }}>+50%</span>
                </div>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>CAC Reduction</span>
                  <span style={{ color: '#FBBF24' }}>-30%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Customer Satisfaction</span>
                  <span style={{ color: '#FBBF24' }}>9+/10</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
