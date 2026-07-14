'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { BrandbookResult } from '../brandbook/brandbook-result'

const TOOL_CONFIG: ToolConfig = {
  slug: 'brandbook-content-system',
  icon: '📚',
  title: 'Brandbook + Content System',
  subtitle: 'Salsa Burgers',
  timing: '30-40 min',
  brandBrainNote: 'Brand Brain cargado — identidad y contenido pre-rellenados',
  submitButtonColor: '#8B5CF6',
  submitButtonText: 'Generar Brandbook',
  fields: [
    {
      name: 'brand_name',
      label: 'NOMBRE DE LA MARCA',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'industria',
      label: 'INDUSTRIA / SECTOR',
      type: 'text',
      placeholder: 'Ej: F&B, Restauración, Ecommerce',
      required: true,
    },
    {
      name: 'target_audience',
      label: 'DESCRIPCIÓN AUDIENCIA OBJETIVO',
      type: 'textarea',
      placeholder: 'Quién es tu cliente ideal en detalle.',
      required: true,
    },
    {
      name: 'brand_mission',
      label: 'MISIÓN DE LA MARCA',
      type: 'textarea',
      placeholder: 'El propósito y visión de tu marca.',
      required: true,
    },
    {
      name: 'tone_personality',
      label: 'TONO Y PERSONALIDAD',
      type: 'textarea',
      placeholder: 'Cómo habla tu marca. Adjetivos, características, arquetipos...',
      required: true,
    },
    {
      name: 'content_buckets',
      label: 'TEMÁTICAS DE CONTENIDO (BUCKETS)',
      type: 'textarea',
      placeholder: 'Uno por línea. 4-6 temas principales alrededor de los que gira tu contenido.',
      hint: 'Ej: recetas, historias de clientes, tips de nutrición, behind-the-scenes',
      required: true,
    },
    {
      name: 'visual_guidelines',
      label: 'GUÍA VISUAL Y DISEÑO',
      type: 'textarea',
      placeholder: 'Colores, tipografía, estilo fotográfico, elementos gráficos...',
      required: true,
    },
    {
      name: 'ejemplos_referencia',
      label: 'MARCAS DE REFERENCIA',
      type: 'textarea',
      placeholder: 'Marcas cuyo estilo te inspira (para tone, visual, contenido).',
    },
  ],
}

export default function BrandBookPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brandbook-content-system',
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
      resultComponent={BrandbookResult}
    />
  )
}

