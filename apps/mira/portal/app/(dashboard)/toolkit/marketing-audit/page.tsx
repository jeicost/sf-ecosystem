'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function MarketingAuditPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <ToolkitToolPage
      icon="📊"
      name="Marketing Audit"
      description="Auditoría completa de tu estrategia de marketing: análisis de embudo, canales, conversion rate, ROI por canal y benchmarking"
      color="#10B981"
      estimatedTime="20-25 minutos"
      outputFormat="Reporte de 50+ páginas + Matriz de oportunidades"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Auditar tu Marketing</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Plataformas de marketing en uso
              </label>
              <div className="space-y-2">
                {['Google Ads', 'Facebook Ads', 'Email Marketing', 'Organic Social', 'Partnerships'].map(platform => (
                  <label key={platform} className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                    {platform}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Presupuesto mensual aproximado (USD)
              </label>
              <input
                type="number"
                placeholder="5000"
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
              background: isGenerating ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Analizando...' : 'Ejecutar Marketing Audit'}
          </button>
        </div>

        {isGenerating && (
          <div className="card px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#10B981' }}>
              Hallazgos Principales
            </p>
            <div className="space-y-3 text-sm text-white">
              <div>
                <p className="font-medium mb-1">Marketing Efficiency Score: 62/100</p>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Oportunidad de mejora: optimizar mix de canales</p>
              </div>
              <div>
                <p className="font-medium mb-1">Mejor canal: Email Marketing (28% ROI)</p>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Recomendación: aumentar inversión en segmentación</p>
              </div>
              <div>
                <p className="font-medium mb-1">Cuello de botella: Tasa de conversión web (1.8%)</p>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Vs benchmark industria: 3.2%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
