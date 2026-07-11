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
      resultComponent={<ActionPlanResult />}
    />
  )
}

function ActionPlanResult() {
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
