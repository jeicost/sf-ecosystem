'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function CompetitiveAnalysisPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ToolkitToolPage
      icon="🏆"
      name="Competitive Analysis"
      description="Análisis profundo de competidores: posicionamiento, fortalezas, debilidades, pricing, features y oportunidades de diferenciación."
      color="#8B5CF6"
      estimatedTime="20-25 minutos"
      outputFormat="Reporte competitivo PDF + Matriz de posicionamiento"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Analizar Competidores</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Nombres de competidores (separados por comas)
              </label>
              <textarea
                placeholder="Ej: Competitor A, Competitor B, Competitor C"
                className="w-full px-3 py-2 rounded-lg text-sm"
                rows={3}
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Tu industria/categoría
              </label>
              <input
                type="text"
                placeholder="Ej: SaaS de CRM, E-commerce, Fintech"
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
            {isGenerating ? 'Analizando...' : 'Analizar Competencia'}
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Matriz de Posicionamiento
              </p>
              <div style={{ height: '200px', background: 'rgba(139,92,246,0.1)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                <div style={{ height: '40%', width: '20%', background: 'rgba(139,92,246,0.5)', borderRadius: '4px', position: 'relative' }}>
                  <span style={{ position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Competitor A</span>
                </div>
                <div style={{ height: '70%', width: '20%', background: 'rgba(139,92,246,0.8)', borderRadius: '4px', position: 'relative' }}>
                  <span style={{ position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#a78bfa', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Tu empresa</span>
                </div>
                <div style={{ height: '50%', width: '20%', background: 'rgba(139,92,246,0.5)', borderRadius: '4px', position: 'relative' }}>
                  <span style={{ position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Competitor B</span>
                </div>
              </div>
              <p className="text-xs mt-12" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Ejes: Precio (horizontal) vs. Funcionalidad (vertical)
              </p>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Tu Diferenciación
              </p>
              <ul className="text-sm text-white space-y-2">
                <li className="flex gap-2">
                  <span style={{ color: '#c4b5fd' }}>✓</span>
                  <span>Mejor relación precio-funcionalidad (premium features a precio estándar)</span>
                </li>
                <li className="flex gap-2">
                  <span style={{ color: '#c4b5fd' }}>✓</span>
                  <span>Support en español 24/7 (competidores solo en inglés)</span>
                </li>
                <li className="flex gap-2">
                  <span style={{ color: '#c4b5fd' }}>✓</span>
                  <span>Integración nativa con herramientas locales (SAT, CONSAR)</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
