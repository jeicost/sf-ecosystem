'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'community-growth-blueprint',
  icon: '👥',
  title: 'Community Growth Blueprint',
  subtitle: 'Plan de crecimiento de comunidad a 90 días',
  timing: '2-4 min',
  brandBrainNote: 'Brand Brain cargado — el blueprint usa los pilares y audiencias de tu marca',
  submitButtonColor: '#60A5FA',
  submitButtonText: 'Generar Blueprint',
  fields: [
    {
      name: 'current_size',
      label: 'TAMAÑO ACTUAL DE LA COMUNIDAD',
      type: 'text',
      placeholder: 'Ej: 1200 miembros',
      required: true,
    },
    {
      name: 'goal',
      label: 'OBJETIVO A 90 DÍAS',
      type: 'text',
      placeholder: 'Ej: 5000 miembros activos',
      required: true,
    },
    {
      name: 'channels',
      label: 'CANALES',
      type: 'text',
      placeholder: 'Ej: Instagram, Discord, Newsletter',
      required: true,
    },
    {
      name: 'pillars',
      label: 'PILARES DE CONTENIDO',
      type: 'textarea',
      placeholder: 'Ej: Educación, Behind the scenes, Comunidad, Producto',
      required: false,
    },
  ],
}

export default function CommunityGrowthBlueprintPage() {
  const handleGenerate = async (formData: Record<string, unknown>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'community-growth-blueprint',
        input_data: formData,
      }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to generate')
    }

    return await res.json()
  }

  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} />
}
