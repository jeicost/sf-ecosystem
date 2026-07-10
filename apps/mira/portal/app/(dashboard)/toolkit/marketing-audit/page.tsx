'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'
import { useToolkitGeneration } from '@/hooks/useToolkitGeneration'

const PLATFORMS_AUDIT = ['Google Ads', 'Facebook Ads', 'Email Marketing', 'Organic Social', 'Partnerships']

export default function MarketingAuditPage() {
  const [platforms, setPlatforms] = useState<string[]>(PLATFORMS_AUDIT)
  const [budget, setBudget] = useState('')
  const { isGenerating, status, error, startGeneration } = useToolkitGeneration('marketing-audit')

  const handleAudit = async () => {
    if (platforms.length === 0) {
      alert('Selecciona al menos una plataforma')
      return
    }
    if (!budget || parseFloat(budget) <= 0) {
      alert('Ingresa un presupuesto válido')
      return
    }
    await startGeneration({ platforms, budget: parseFloat(budget) })
  }

  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

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
                {PLATFORMS_AUDIT.map(platform => (
                  <label key={platform} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="w-4 h-4 cursor-pointer"
                    />
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
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <button
            onClick={handleAudit}
            disabled={isGenerating || platforms.length === 0 || !budget}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating || platforms.length === 0 || !budget ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              opacity: platforms.length === 0 || !budget ? 0.6 : 1,
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Analizando...' : 'Ejecutar Marketing Audit'}
          </button>
        </div>

        {error && (
          <div className="card px-6 py-4" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {status && (
          <div className="card px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#10B981' }}>
              Hallazgos Principales
            </p>
            <div className="space-y-3 text-sm text-white">
              <div>
                <p className="font-medium mb-1">Marketing Efficiency Score: {status.result_data?.efficiency_score || 62}/100</p>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>{status.result_data?.efficiency_insight || 'Oportunidad de mejora: optimizar mix de canales'}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Mejor canal: {status.result_data?.best_channel || 'Email Marketing'} ({status.result_data?.best_channel_roi || '28%'} ROI)</p>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>{status.result_data?.best_channel_recommendation || 'Recomendación: aumentar inversión en segmentación'}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Cuello de botella: {status.result_data?.bottleneck || 'Tasa de conversión web'} ({status.result_data?.bottleneck_rate || '1.8%'})</p>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Vs benchmark industria: {status.result_data?.benchmark_rate || '3.2%'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
