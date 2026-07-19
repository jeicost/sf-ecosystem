'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'marketing-campaign-generator',
  icon: '📣',
  title: 'Marketing Campaign Generator',
  subtitle: 'Campaña de 30 días con presupuesto y canales',
  timing: '2-4 min',
  brandBrainNote: 'Brand Brain cargado — la campaña usa los pilares y tono de tu marca',
  submitButtonColor: '#F87171',
  submitButtonText: 'Generar Campaña',
  fields: [
    {
      name: 'audience',
      label: 'AUDIENCIA OBJETIVO',
      type: 'text',
      placeholder: 'Ej: Foodies 25-45 en Bangkok',
      required: true,
    },
    {
      name: 'budget',
      label: 'PRESUPUESTO (€)',
      type: 'text',
      placeholder: 'Ej: 10000',
      required: true,
    },
    {
      name: 'channels',
      label: 'CANALES',
      type: 'text',
      placeholder: 'Ej: Instagram, Email, SEO',
      required: true,
    },
    {
      name: 'objective',
      label: 'OBJETIVO DE LA CAMPAÑA',
      type: 'textarea',
      placeholder: 'Ej: Aumentar reservas un 20% durante el lanzamiento del nuevo menú',
      required: true,
    },
  ],
}

export default function MarketingCampaignGeneratorPage() {
  const handleGenerate = async (formData: Record<string, unknown>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'marketing-campaign-generator',
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
