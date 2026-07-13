'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import ToolResultComponent from '@/components/ToolResultComponent'

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
      resultComponent={BrandBookResult}
    />
  )
}

function BrandBookResult({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#8B5CF6' }}>
            ✓ Brandbook Generado
          </p>
          <p className="text-sm text-gray-400">Tu brandbook y sistema de contenido está listo con guías visuales y narrativas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#8B5CF6' }}>
          ✓ Sistema de Marca y Contenido
        </p>
        <h2 className="text-2xl font-semibold text-white">{data.title || 'Brandbook'}</h2>
        <p className="text-sm text-gray-400 mt-2">{data.introduction || data.summary || 'Tu guía de marca está lista.'}</p>
      </div>

      {/* Brand Identity */}
      {data.brand_identity && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Identidad de Marca</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-white">Misión</p>
              <p className="text-sm text-gray-400 mt-1">{data.brand_identity.mission || ''}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Valores</p>
              <p className="text-sm text-gray-400 mt-1">{data.brand_identity.values || ''}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Propuesta de Valor</p>
              <p className="text-sm text-gray-400 mt-1">{data.brand_identity.value_proposition || ''}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Pillars */}
      {data.content_pillars && data.content_pillars.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pilares de Contenido</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.content_pillars.map((pillar: any, idx: number) => (
              <div key={idx} className="border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white">{pillar.name || pillar.title || `Pilar ${idx + 1}`}</p>
                <p className="text-xs text-gray-400 mt-2">{pillar.description || pillar.content || ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Guidelines */}
      {data.visual_guidelines && (
        <div className="card p-6 bg-purple-500/5 border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Guías Visuales</h3>
          <p className="text-sm text-gray-400">{data.visual_guidelines}</p>
        </div>
      )}

      {/* Raw JSON fallback */}
      {!data.brand_identity && (!data.content_pillars || data.content_pillars.length === 0) && !data.visual_guidelines && (
        <div className="card p-6 bg-white/2">
          <p className="text-sm text-gray-400 font-mono">{JSON.stringify(data, null, 2).slice(0, 500)}...</p>
        </div>
      )}
    </div>
  )
}
