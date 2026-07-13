'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import ToolResultComponent from '@/components/ToolResultComponent'

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
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'competitive-analysis',
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
      resultComponent={CompetitiveAnalysisResult}
    />
  )
}

function CompetitiveAnalysisResult({ data }: { data?: any }) {
  if (!data) {
    return (
      <div className="card p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#EC4899' }}>
            ✓ Competitive Analysis Completo
          </p>
          <p className="text-sm text-gray-400">Tu análisis competitivo está listo con matriz de posicionamiento y oportunidades.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#EC4899' }}>
          ✓ Análisis Competitivo
        </p>
        <h2 className="text-2xl font-semibold text-white">{data.title || 'Análisis de Competencia'}</h2>
        <p className="text-sm text-gray-400 mt-2">{data.summary || 'Tu posición competitiva está mapeada.'}</p>
      </div>

      {/* Competitors */}
      {data.competitors && data.competitors.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Competidores Analizados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.competitors.map((comp: any, idx: number) => (
              <div key={idx} className="border border-white/10 rounded-lg p-4">
                <p className="font-semibold text-white">{comp.name || comp.competitor || `Competidor ${idx + 1}`}</p>
                <p className="text-xs text-gray-500 mt-2">{comp.positioning || comp.description || ''}</p>
                {comp.strengths && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-green-400">Fortalezas:</p>
                    <ul className="text-xs text-gray-400 mt-1 space-y-1">
                      {(Array.isArray(comp.strengths) ? comp.strengths : [comp.strengths]).map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {comp.weaknesses && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-red-400">Debilidades:</p>
                    <ul className="text-xs text-gray-400 mt-1 space-y-1">
                      {(Array.isArray(comp.weaknesses) ? comp.weaknesses : [comp.weaknesses]).map((w: string, i: number) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {data.opportunities && data.opportunities.length > 0 && (
        <div className="card p-6 bg-green-500/5 border-green-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Oportunidades Identificadas</h3>
          <div className="space-y-3">
            {data.opportunities.map((opp: any, idx: number) => (
              <div key={idx} className="pb-3 border-b border-green-500/20 last:border-b-0">
                <p className="text-sm font-medium text-green-400">{opp.opportunity || opp.title || ''}</p>
                {opp.impact && (
                  <p className="text-xs text-gray-400 mt-1">Impacto: {opp.impact}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON fallback */}
      {(!data.competitors || data.competitors.length === 0) && (!data.opportunities || data.opportunities.length === 0) && (
        <div className="card p-6 bg-white/2">
          <p className="text-sm text-gray-400 font-mono">{JSON.stringify(data, null, 2).slice(0, 500)}...</p>
        </div>
      )}
    </div>
  )
}
