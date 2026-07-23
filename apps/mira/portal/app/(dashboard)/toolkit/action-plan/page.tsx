'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { ActionPlanResult } from './action-plan-result'

const TOOL_CONFIG: ToolConfig = {
  slug: 'action-plan',
  icon: '📅',
  title: 'Action Plan',
  subtitle: 'Salsa Burgers',
  timing: '30-45 min',
  brandBrainNote: 'Brand Brain cargado — objetivos y recursos identificados',
  submitButtonColor: '#34D399',
  submitButtonText: 'Generar Action Plan',
  fields: [
    {
      name: 'objetivo_trimestral',
      label: 'OBJETIVO PRINCIPAL TRIMESTRE',
      type: 'text',
      placeholder: 'Ej: Crecer 50% en leads cualificados',
      required: true,
    },
    {
      name: 'recursos_actuales',
      label: 'RECURSOS DISPONIBLES',
      type: 'textarea',
      placeholder: 'Equipo, presupuesto, herramientas disponibles...',
      required: true,
    },
    {
      name: 'desafios_criticos',
      label: 'DESAFÍOS / BLOQUEADORES',
      type: 'textarea',
      placeholder: 'Qué puede impedirnos lograr los objetivos',
      required: true,
    },
    {
      name: 'metricas_exito',
      label: 'MÉTRICAS DE ÉXITO',
      type: 'textarea',
      placeholder: 'Cómo mediremos si tuvimos éxito. Una por línea.',
      required: true,
    },
    {
      name: 'presupuesto_disponible',
      label: 'PRESUPUESTO DISPONIBLE',
      type: 'textarea',
      placeholder: 'Cifra total y, si lo sabes, cómo se reparte hoy (equipo, herramientas, medios, contingencia). Si no hay presupuesto asignado aún, dilo.',
      required: true,
    },
    {
      name: 'equipo_roles',
      label: 'EQUIPO Y ROLES DISPONIBLES',
      type: 'textarea',
      placeholder: 'Quién ejecuta el plan hoy: roles, dedicación (FTE) y si hay contrataciones previstas.',
      required: true,
    },
  ],
}

export default function ActionPlanPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'action-plan',
        input_data: formData,
        project_id: getStoredProjectId(),
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    return await res.json()
  }

  return (
    <ToolRunnerPage
      config={TOOL_CONFIG}
      onGenerate={handleGenerate}
      resultComponent={ActionPlanResult}
    />
  )
}
