'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function InvestorDeckPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ToolkitToolPage
      icon="💼"
      name="Investor Deck"
      description="Presentación de inversión profesional: propuesta de valor, mercado, financieros y proyecciones. Listo para pitching."
      color="#EF4444"
      estimatedTime="30-40 minutos"
      outputFormat="Deck Figma editable (20 slides) + PDF"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Crear Investor Deck</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Ronda de inversión
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="seed">Seed</option>
                <option value="seriesA">Series A</option>
                <option value="seriesB">Series B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Monto buscado (USD)
              </label>
              <input
                type="number"
                placeholder="Ej: 500000"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                TAM (Total Addressable Market) - USD
              </label>
              <input
                type="number"
                placeholder="Ej: 50000000"
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
              background: isGenerating ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando deck...' : 'Crear Investor Deck'}
          </button>
        </div>

        {isGenerating && (
          <div className="card px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#EF4444' }}>
              Estructura de Presentación
            </p>
            <div className="space-y-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>1.</span>
                <span>Cover + Mission</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>2.</span>
                <span>Problem + Market Opportunity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>3.</span>
                <span>Solution + Competitive Advantage</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>4.</span>
                <span>Business Model + GTM Strategy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>5.</span>
                <span>Traction + Key Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>6.</span>
                <span>Team + Experience</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold" style={{ color: '#FCA5A5' }}>7.</span>
                <span>Financial Projections + Ask</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
