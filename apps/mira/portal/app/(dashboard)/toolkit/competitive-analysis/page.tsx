'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { CompetitiveAnalysisResult } from './competitive-analysis-result'

const TOOL_CONFIG: ToolConfig = {
  slug: 'competitive-analysis',
  icon: '⚔️',
  title: 'Competitive Analysis',
  subtitle: 'Salsa Burgers',
  timing: '40-50 min',
  brandBrainNote: 'Brand Brain cargado — posición de mercado analizada',
  submitButtonColor: '#EC4899',
  submitButtonText: 'Generar Competitive Analysis',
  fields: [
    {
      name: 'competidor_1',
      label: 'COMPETIDOR PRINCIPAL',
      type: 'text',
      placeholder: 'Nombre o URL del competidor más fuerte',
      required: true,
    },
    {
      name: 'competidor_2',
      label: 'COMPETIDOR SECUNDARIO',
      type: 'text',
      placeholder: 'Otro competidor importante',
      required: true,
    },
    {
      name: 'competidor_3',
      label: 'COMPETIDOR TERCIARIO',
      type: 'text',
      placeholder: 'Competidor emergente o niche',
      required: true,
    },
    {
      name: 'tu_proposicion',
      label: 'TU PROPUESTA DE VALOR ÚNICA',
      type: 'textarea',
      placeholder: 'Qué te diferencia de la competencia.',
      required: true,
    },
    {
      name: 'mercado_posicion',
      label: 'POSICIÓN EN EL MERCADO',
      type: 'select',
      options: [
        { value: 'leader', label: 'Líder de Mercado' },
        { value: 'challenger', label: 'Retador / Emergente' },
        { value: 'niche', label: 'Nicho Especializado' },
      ],
      required: true,
    },
    {
      name: 'diferenciadores',
      label: 'DIFERENCIADORES CLAVE',
      type: 'textarea',
      placeholder: 'Uno por línea. Qué hace tu empresa distinta.',
      hint: 'Mínimo 3-5 diferenciadores',
      required: true,
    },
    {
      name: 'precio_posicionamiento',
      label: 'POSICIONAMIENTO DE PRECIO',
      type: 'text',
      placeholder: 'Ej: Premium 20% vs competencia o Económico 30% por debajo',
      required: true,
    },
    {
      name: 'vulnerabilidades_competencia',
      label: 'VULNERABILIDADES DE LA COMPETENCIA',
      type: 'textarea',
      placeholder: 'Debilidades de tus competidores que puedes explotar. Uno por línea.',
      required: true,
    },
  ],
}

export default function CompetitiveAnalysisPage() {
  const handleGenerate = async (formData: Record<string, any>, attachments?: any[]) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'competitive-analysis',
        input_data: formData,
        attachments,
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
      resultComponent={CompetitiveAnalysisResult}
    />
  )
}
