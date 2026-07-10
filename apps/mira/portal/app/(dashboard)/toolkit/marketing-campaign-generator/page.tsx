'use client'

import { useState, useRef } from 'react'
import { Play, Loader2 } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'
import { CLIENT_ID } from '@/lib/constants'

interface FormData {
  audience: string
  budget: string
  channels: string
  objective: string
}

interface GeneratedCampaign {
  campaign_overview: string
  week_1?: any
  channel_distribution?: any
  kpis?: any
}

export default function MarketingCampaignGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCampaign, setGeneratedCampaign] = useState<GeneratedCampaign | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationTime, setGenerationTime] = useState(0)

  const audienceRef = useRef<HTMLInputElement>(null)
  const budgetRef = useRef<HTMLInputElement>(null)
  const channelsRef = useRef<HTMLInputElement>(null)
  const objectiveRef = useRef<HTMLInputElement>(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      const formData: FormData = {
        audience: audienceRef.current?.value || '',
        budget: budgetRef.current?.value || '0',
        channels: channelsRef.current?.value || '',
        objective: objectiveRef.current?.value || '',
      }

      if (!formData.audience || !formData.budget || !formData.channels) {
        setError('Por favor completa todos los campos')
        setIsGenerating(false)
        return
      }

      const startTime = Date.now()

      const res = await fetch('/api/toolkit/marketing-campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          audience: formData.audience,
          budget: parseInt(formData.budget),
          channels: formData.channels,
          objective: formData.objective,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error generando campaña')
      }

      setGeneratedCampaign(data.campaign)
      setGenerationTime(data.generation_time_ms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setGeneratedCampaign(null)
    } finally {
      setIsGenerating(false)
    }
  }

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
                ref={audienceRef}
                type="text"
                placeholder="Ej: CTOs de startups series A-B, 25-45 años, Madrid/Barcelona"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Presupuesto (€)
              </label>
              <input
                ref={budgetRef}
                type="number"
                placeholder="Ej: 5000"
                min="100"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Canales Prioritarios (separados por comas)
              </label>
              <input
                ref={channelsRef}
                type="text"
                placeholder="Ej: LinkedIn, Twitter, Email, Blog, Events"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Objetivo Principal (2-3 palabras)
              </label>
              <input
                ref={objectiveRef}
                type="text"
                placeholder="Ej: Awareness, Lead generation, Conversión"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span className="text-xs text-red-400">⚠️ {error}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generando (Claude)...
              </>
            ) : (
              <>
                <Play size={16} />
                Generar Campaña
              </>
            )}
          </button>
        </div>

        {generatedCampaign && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Campaign Overview (Generado por Claude en {generationTime}ms)
              </p>
              <p className="text-sm text-white leading-relaxed">
                {generatedCampaign.campaign_overview}
              </p>
            </div>

            {generatedCampaign.channel_distribution && (
              <div className="card px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                  Channel Distribution
                </p>
                <div className="space-y-2 text-sm text-white">
                  {Object.entries(generatedCampaign.channel_distribution as Record<string, any>).map(([channel, data]) => (
                    <div key={channel} className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div>
                        <p className="font-medium">{channel}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{data.focus}</p>
                      </div>
                      <span style={{ color: '#C4B5FD' }}>{data.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedCampaign.kpis && (
              <div className="card px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                  KPIs & Targets
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-white">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Reach Target</p>
                    <p className="font-semibold">{generatedCampaign.kpis.reach_target?.toLocaleString()} impressions</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Engagement Rate</p>
                    <p className="font-semibold">{(generatedCampaign.kpis.engagement_rate * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Conversion Rate</p>
                    <p className="font-semibold">{(generatedCampaign.kpis.conversion_rate * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>CAC Target</p>
                    <p className="font-semibold">€{generatedCampaign.kpis.cac_target}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#22C55E' }}>
                ✓ Campaign generado con documentación de tu cliente
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Guardado en tu historial de resultados. Próximo paso: exportar a PDF o copiar para implementar.
              </p>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
