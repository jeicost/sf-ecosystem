'use client'

import { useState } from 'react'
import ToolRunnerPage, { ToolConfig, ToolField } from '@/components/ToolRunnerPage'
import { fetchBrandBrain } from '@/lib/brand-brain'
import { useEffect } from 'react'

const TOOL_CONFIG: ToolConfig = {
  slug: 'action-plan',
  icon: '🎯',
  title: 'Action Plan 30/60/90',
  subtitle: 'Salsa Burgers',
  timing: '20-25 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#FF6B35',
  submitButtonText: 'Generar Action Plan 30/60/90',
  fields: [
    {
      name: 'horizonte',
      label: 'HORIZONTE DEL PLAN',
      type: 'select',
      options: [
        { value: '30', label: 'Plan 30 días' },
        { value: '60', label: 'Plan 60 días' },
        { value: '90', label: 'Plan 90 días' },
      ],
      defaultValue: '90',
      required: true,
    },
    {
      name: 'situacion_actual',
      label: 'SITUACIÓN ACTUAL DE LA EMPRESA',
      type: 'textarea',
      placeholder: 'Ej: 6 meses operando, facturación €40k/mes estancada. Web activa, sin estrategia digital.',
      hint: 'Describe el estado actual más relevante para el plan',
      required: true,
    },
    {
      name: 'reto_principal',
      label: 'PRINCIPAL RETO / OBSTÁCULO AHORA MISMO',
      type: 'textarea',
      placeholder: 'Ej: No conseguimos leads digitales, toda la captación es boca a boca.',
      required: true,
    },
    {
      name: 'areas_prioritarias',
      label: 'AREAS PRIORITARIAS',
      type: 'select',
      options: [
        { value: 'sales', label: 'Ventas / Pipeline' },
        { value: 'marketing', label: 'Marketing / Brand' },
        { value: 'ops', label: 'Operaciones' },
        { value: 'product', label: 'Producto / Servicio' },
        { value: 'team', label: 'Equipo / Recursos' },
      ],
      required: true,
    },
    {
      name: 'objetivos',
      label: 'OBJETIVOS ESPECÍFICOS DEL PERIODO',
      type: 'textarea',
      placeholder: 'Ej: Llegar a 120k de facturación mensual. Abrir 2do local. 500 seguidores activos en IG.',
      required: true,
    },
    {
      name: 'recursos',
      label: 'RECURSOS DISPONIBLES (EQUIPO + BUDGET)',
      type: 'textarea',
      placeholder: 'Ej: Equipo de 3 personas. Budget mensual marketing: €2.000. Sin developer propio.',
      required: true,
    },
    {
      name: 'briefing_url',
      label: 'URL DEL BRAND BRIEFING (OPCIONAL)',
      type: 'text',
      placeholder: 'https://briefing-fawn.vercel.app',
      hint: 'Claude buscará en él para enriquecer el plan',
    },
    {
      name: 'contexto_adicional',
      label: 'CONTEXTO ADICIONAL / DOCUMENTOS',
      type: 'textarea',
      placeholder: 'Pega resultados últimos 3 meses, decisiones ya tomadas, restricciones...',
    },
  ],
}

export default function ActionPlanPage() {
  const [config, setConfig] = useState(TOOL_CONFIG)

  useEffect(() => {
    // Optionally: pre-fill from Brand Brain if available
  }, [])

  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'action-plan',
        input_data: formData,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    const result = await res.json()
    return result
  }

  return (
    <ToolRunnerPage
      config={config}
      onGenerate={handleGenerate}
      resultComponent={ActionPlanResult}
    />
  )
}

function ActionPlanResult({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#FF6B35' }}>
            ⚡ Plan Generado
          </p>
          <p className="text-sm text-gray-400">Tu plan de 90 días está listo para revisar y descargar en PDF.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#FF6B35' }}>
          ⚡ Plan Generado
        </p>
        <h2 className="text-2xl font-semibold text-white">
          {data.horizonte ? `Plan ${data.horizonte} Días` : 'Tu Action Plan'}
        </h2>
        <p className="text-sm text-gray-400 mt-2">{data.overview || 'Tu plan de acción está listo para revisar.'}</p>
      </div>

      {/* Phases */}
      {data.phases && data.phases.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Fases del Plan</h3>
          <div className="space-y-4">
            {data.phases.map((phase: any, idx: number) => (
              <div key={idx} className="border-l-2 border-purple-500 pl-4 pb-4">
                <p className="font-semibold text-white">{phase.name || `Fase ${idx + 1}`}</p>
                <p className="text-sm text-gray-400 mt-1">{phase.description || phase.goals || ''}</p>
                {phase.milestones && (
                  <ul className="mt-2 space-y-1">
                    {phase.milestones.map((m: string, i: number) => (
                      <li key={i} className="text-xs text-gray-500">• {m}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Actions */}
      {data.key_actions && data.key_actions.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Acciones Clave</h3>
          <div className="space-y-3">
            {data.key_actions.map((action: any, idx: number) => (
              <div key={idx} className="flex gap-3 pb-3 border-b border-white/5 last:border-b-0">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-xs text-purple-400">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{action.action || action.title || ''}</p>
                  {action.responsible && (
                    <p className="text-xs text-gray-500 mt-1">Responsable: {action.responsible}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON fallback */}
      {(!data.phases || data.phases.length === 0) && (!data.key_actions || data.key_actions.length === 0) && (
        <div className="card p-6 bg-white/2">
          <p className="text-sm text-gray-400 font-mono">{JSON.stringify(data, null, 2).slice(0, 500)}...</p>
        </div>
      )}
    </div>
  )
}
