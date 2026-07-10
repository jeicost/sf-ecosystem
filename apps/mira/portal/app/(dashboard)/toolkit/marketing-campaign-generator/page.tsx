'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function MarketingCampaignGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ToolkitToolPage
      icon="📊"
      name="Marketing Campaign Generator"
      description="Genera tu estrategia de marketing completa: plan de 30 días, canales óptimos, calendarios editoriales, KPIs y tácticas de engagement."
      color="#8B5CF6"
      estimatedTime="15-20 minutos"
      outputFormat="Plan de campaña PDF + Calendar Excel + Brief de contenido"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Generar Plan de Campaña</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Público Objetivo
              </label>
              <input
                type="text"
                placeholder="Ej: CTOs de startups series A-B, 25-45 años, Madrid/Barcelona"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Presupuesto (€)
              </label>
              <input
                type="number"
                placeholder="Ej: 5000"
                min="100"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Canales Prioritarios (separados por comas)
              </label>
              <input
                type="text"
                placeholder="Ej: LinkedIn, Twitter, Email, Blog, Events"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Objetivo Principal (2-3 palabras)
              </label>
              <input
                type="text"
                placeholder="Ej: Awareness, Lead generation, Conversión"
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
              background: isGenerating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando campaña...' : 'Generar Campaña'}
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Plan de Campaña — 30 Días
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>📅 <strong>Semana 1-2:</strong> Awareness & Reach — Posicionar mensaje, build audience</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>LinkedIn posts + Twitter threads + Email launch + Blog pillar article</p>
                <p className="mt-3">💬 <strong>Semana 2-3:</strong> Engagement & Consideration — Deepen conversation</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Webinar invitation + case studies + social proof + FAQ content</p>
                <p className="mt-3">🎯 <strong>Semana 3-4:</strong> Conversion & Action — Call-to-action fuerte</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Limited offer + demo booking + community event + newsletter exclusive</p>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Distribución por Canal
              </p>
              <div className="space-y-2 text-sm text-white">
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>LinkedIn</span>
                  <span style={{ color: '#C4B5FD' }}>35% presupuesto</span>
                </div>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Email</span>
                  <span style={{ color: '#C4B5FD' }}>25% presupuesto</span>
                </div>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Content + SEO</span>
                  <span style={{ color: '#C4B5FD' }}>20% presupuesto</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Events + Community</span>
                  <span style={{ color: '#C4B5FD' }}>20% presupuesto</span>
                </div>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                KPIs & Success Metrics
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>📈 Reach: 50,000+ impressions</p>
                <p>💬 Engagement: 5%+ rate (likes, comments, shares)</p>
                <p>🔗 Click-through: 2%+ CTR</p>
                <p>📧 Conversion: 0.5%+ to demo/trial</p>
                <p>💰 CAC target: €50-75 per lead</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
