'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import ToolResultComponent from '@/components/ToolResultComponent'

const TOOL_CONFIG: ToolConfig = {
  slug: 'investor-deck',
  icon: '📈',
  title: 'Investor Deck',
  subtitle: 'Salsa Burgers',
  timing: '60-90 min',
  brandBrainNote: 'Brand Brain cargado — datos de empresa integrados',
  submitButtonColor: '#34D399',
  submitButtonText: 'Generar Investor Deck',
  fields: [
    {
      name: 'nombre_empresa',
      label: 'NOMBRE DE LA EMPRESA',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'descripcion_breve',
      label: 'DESCRIPCIÓN BREVE (PITCH DE UNA LÍNEA)',
      type: 'textarea',
      placeholder: 'La propuesta de valor más concisa. Ej: "Comida rápida premium entregada en menos de 20 minutos".',
      required: true,
    },
    {
      name: 'problema_solved',
      label: 'PROBLEMA QUE RESUELVES',
      type: 'textarea',
      placeholder: 'Qué problema del mercado soluciona tu empresa.',
      required: true,
    },
    {
      name: 'mercado_tam',
      label: 'MERCADO TOTAL ALCANZABLE (TAM)',
      type: 'text',
      placeholder: 'Ej: $500M o €400M',
      hint: 'Total Addressable Market en tu segmento',
      required: true,
    },
    {
      name: 'traccion_actual',
      label: 'TRACCIÓN ACTUAL',
      type: 'textarea',
      placeholder: 'Ingresos, usuarios activos, clientes, métricas de crecimiento...',
      required: true,
    },
    {
      name: 'equipo_description',
      label: 'DESCRIPCIÓN DEL EQUIPO',
      type: 'textarea',
      placeholder: 'Fundadores, experiencias clave, especialidades del equipo.',
      required: true,
    },
    {
      name: 'ronda_size',
      label: 'TAMAÑO DE LA RONDA',
      type: 'text',
      placeholder: 'Ej: $500K o €400K',
      hint: 'Cuánto capital buscas',
      required: true,
    },
    {
      name: 'uso_fondos',
      label: 'USO DE FONDOS',
      type: 'textarea',
      placeholder: 'Cómo vas a usar el dinero. Ej: 40% producto, 30% marketing, 20% equipo, 10% ops...',
      required: true,
    },
  ],
}

export default function InvestorDeckPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'investor-deck',
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
      resultComponent={InvestorDeckResult}
    />
  )
}

function InvestorDeckResult({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#34D399' }}>
            ✓ Investor Deck Generado
          </p>
          <p className="text-sm text-gray-400">Tu presentación para inversores está lista con análisis de mercado y financiero.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#34D399' }}>
          ✓ Presentación de Inversión
        </p>
        <h2 className="text-2xl font-semibold text-white">{data.title || 'Deck para Inversores'}</h2>
        <p className="text-sm text-gray-400 mt-2">{data.executive_summary || data.summary || 'Tu presentación está lista.'}</p>
      </div>

      {/* Slides */}
      {data.slides && data.slides.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Diapositivas</h3>
          <div className="space-y-4">
            {data.slides.map((slide: any, idx: number) => (
              <div key={idx} className="border-l-2 border-emerald-500 pl-4">
                <p className="font-semibold text-white">
                  {idx + 1}. {slide.title || slide.name || `Slide ${idx + 1}`}
                </p>
                <p className="text-sm text-gray-400 mt-1">{slide.content || slide.description || ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Opportunity */}
      {data.market_opportunity && (
        <div className="card p-6 bg-emerald-500/5 border-emerald-500/20">
          <h3 className="text-lg font-semibold text-white mb-2">Oportunidad de Mercado</h3>
          <p className="text-sm text-gray-300">{data.market_opportunity}</p>
        </div>
      )}

      {/* Financials */}
      {data.financials && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Proyecciones Financieras</h3>
          <p className="text-sm text-gray-400">{data.financials}</p>
        </div>
      )}

      {/* Raw JSON fallback */}
      {(!data.slides || data.slides.length === 0) && !data.market_opportunity && !data.financials && (
        <div className="card p-6 bg-white/2">
          <p className="text-sm text-gray-400 font-mono">{JSON.stringify(data, null, 2).slice(0, 500)}...</p>
        </div>
      )}
    </div>
  )
}
