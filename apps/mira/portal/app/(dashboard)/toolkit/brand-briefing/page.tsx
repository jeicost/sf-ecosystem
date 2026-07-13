'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import ToolResultComponent from '@/components/ToolResultComponent'

const TOOL_CONFIG: ToolConfig = {
  slug: 'brand-briefing',
  icon: '💭',
  title: 'Brand Briefing',
  subtitle: 'Salsa Burgers',
  timing: '15-20 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#A78BFA',
  submitButtonText: 'Generar Brand Briefing',
  fields: [
    {
      name: 'nombre_cliente',
      label: 'NOMBRE DEL CLIENTE',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'website_url',
      label: 'URL SITIO WEB',
      type: 'text',
      placeholder: 'https://www.tusitio.com',
      required: true,
    },
    {
      name: 'sector_industria',
      label: 'SECTOR / INDUSTRIA',
      type: 'text',
      placeholder: 'Ej: Restauración, F&B, Ecommerce',
      required: true,
    },
    {
      name: 'color_principal',
      label: 'COLOR PRINCIPAL DE MARCA',
      type: 'color',
      required: true,
    },
    {
      name: 'audiencia_objetivo',
      label: 'DESCRIPCIÓN AUDIENCIA OBJETIVO',
      type: 'textarea',
      placeholder: 'Describe quién es tu cliente ideal: edad, intereses, comportamiento...',
      required: true,
    },
    {
      name: 'pilares_contenido',
      label: 'PILARES DE CONTENIDO',
      type: 'textarea',
      placeholder: 'Uno por línea. Ej:\n- Recetas y técnicas\n- Historias de marca\n- Educación sobre ingredientes',
      hint: 'Mínimo 5-7 pilares',
      required: true,
    },
    {
      name: 'contexto_adicional',
      label: 'CONTEXTO ADICIONAL',
      type: 'textarea',
      placeholder: 'Información extra: competencia, diferenciadores, restricciones...',
    },
  ],
}

export default function BrandBriefingPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brand-briefing',
        input_data: formData,
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
      resultComponent={BrandBriefingResult}
    />
  )
}

function BrandBriefingResult({ data }: { data?: any }) {
  return <ToolResultComponent slug="brand-briefing" data={data} />
}
