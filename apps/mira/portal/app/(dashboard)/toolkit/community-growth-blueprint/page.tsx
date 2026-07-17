'use client'

import { useState, useRef } from 'react'
import { Play, Loader2 } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'
import { useActiveClient } from '@/lib/client-context'

interface CommunityFormData {
  current_size: string
  goal: string
  channels: string
  pillars: string
}

interface GeneratedBlueprint {
  strategy_summary: string
  month_1_foundation?: any
  engagement_playbook?: any
  metrics?: any
}

export default function CommunityGrowthBlueprintPage() {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBlueprint, setGeneratedBlueprint] = useState<GeneratedBlueprint | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationTime, setGenerationTime] = useState(0)

  const sizeRef = useRef<HTMLInputElement>(null)
  const goalRef = useRef<HTMLInputElement>(null)
  const channelsRef = useRef<HTMLInputElement>(null)
  const pillarsRef = useRef<HTMLInputElement>(null)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      const formData: CommunityFormData = {
        current_size: sizeRef.current?.value || '0',
        goal: goalRef.current?.value || '',
        channels: channelsRef.current?.value || '',
        pillars: pillarsRef.current?.value || '',
      }

      if (!formData.current_size || !formData.goal) {
        setError('Por favor completa todos los campos requeridos')
        setIsGenerating(false)
        return
      }

      const startTime = Date.now()

      const res = await fetch('/api/toolkit/community-blueprint/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          current_size: parseInt(formData.current_size),
          goal: formData.goal,
          channels: formData.channels,
          pillars: formData.pillars,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error generando blueprint')
      }

      setGeneratedBlueprint(data.blueprint)
      setGenerationTime(data.generation_time_ms)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setGeneratedBlueprint(null)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <ToolkitToolPage
      icon="👥"
      name="Community Growth Blueprint"
      description="Estrategia completa de crecimiento de comunidad: análisis de audiencia actual, playbooks de engagement, tácticas de retención, influencer sourcing y roadmap de 90 días."
      color="#8B5CF6"
      estimatedTime="20-30 minutos"
      outputFormat="Growth Blueprint PDF + Influencer sourcing guide + Engagement playbook + Community calendar"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Generar Estrategia de Comunidad</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Tamaño Actual de Comunidad
              </label>
              <input
                ref={sizeRef}
                type="number"
                placeholder="Ej: 500"
                min="10"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Objetivo de Crecimiento (3 meses)
              </label>
              <input
                ref={goalRef}
                type="text"
                placeholder="Ej: 2,000 miembros activos, 10% engagement"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Canales de Comunidad Principales
              </label>
              <input
                ref={channelsRef}
                type="text"
                placeholder="Ej: Slack, Discord, LinkedIn, Telegram, Private community"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                disabled={isGenerating}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Pilares de Contenido de Comunidad
              </label>
              <input
                ref={pillarsRef}
                type="text"
                placeholder="Ej: Education, Networking, Product updates, Behind-the-scenes"
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
                Generar Blueprint
              </>
            )}
          </button>
        </div>

        {generatedBlueprint && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Strategy Summary (Generado por Claude en {generationTime}ms)
              </p>
              <p className="text-sm text-white leading-relaxed">
                {generatedBlueprint.strategy_summary}
              </p>
            </div>

            {generatedBlueprint.month_1_foundation && (
              <div className="card px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                  📅 Month 1 — {generatedBlueprint.month_1_foundation.theme}
                </p>
                <div className="space-y-3 text-sm text-white">
                  <div>
                    <p className="font-medium mb-1">Focus</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>{generatedBlueprint.month_1_foundation.focus}</p>
                  </div>
                  {generatedBlueprint.month_1_foundation.key_initiatives && (
                    <div>
                      <p className="font-medium mb-1">Key Initiatives</p>
                      <ul className="list-disc list-inside text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        {generatedBlueprint.month_1_foundation.key_initiatives.map((init: string, i: number) => (
                          <li key={i}>{init}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {generatedBlueprint.engagement_playbook && (
              <div className="card px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                  Engagement Playbook
                </p>
                <div className="space-y-2 text-sm text-white">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Daily check-ins</span>
                    <span style={{ color: '#C4B5FD' }}>{generatedBlueprint.engagement_playbook.daily_check_ins}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Weekly AMA</span>
                    <span style={{ color: '#C4B5FD' }}>{generatedBlueprint.engagement_playbook.weekly_ama}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>Monthly workshop</span>
                    <span style={{ color: '#C4B5FD' }}>{generatedBlueprint.engagement_playbook.monthly_workshop}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quarterly event</span>
                    <span style={{ color: '#C4B5FD' }}>{generatedBlueprint.engagement_playbook.quarterly_event}</span>
                  </div>
                </div>
              </div>
            )}

            {generatedBlueprint.metrics && (
              <div className="card px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                  Success Metrics (90 Days)
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-white">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Target Members</p>
                    <p className="font-semibold">{generatedBlueprint.metrics.target_members}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Engagement Rate</p>
                    <p className="font-semibold">{(generatedBlueprint.metrics.engagement_rate * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Retention Rate</p>
                    <p className="font-semibold">{(generatedBlueprint.metrics.retention_rate * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Referral Rate</p>
                    <p className="font-semibold">{(generatedBlueprint.metrics.referral_rate * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#22C55E' }}>
                ✓ Blueprint generado con documentación de tu comunidad
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Guardado en tu historial de resultados. Próximo paso: exportar a PDF o compartir con el equipo.
              </p>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
