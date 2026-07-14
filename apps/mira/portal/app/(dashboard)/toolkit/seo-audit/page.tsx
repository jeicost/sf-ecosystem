'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'seo-audit',
  icon: '🔍',
  title: 'SEO Audit',
  subtitle: 'Salsa Burgers',
  timing: '30-40 min',
  brandBrainNote: 'Brand Brain cargado — análisis previo completado',
  submitButtonColor: '#F87171',
  submitButtonText: 'Generar SEO Audit',
  fields: [
    {
      name: 'url_sitio',
      label: 'URL DEL SITIO A AUDITAR',
      type: 'text',
      placeholder: 'https://www.tusitio.com',
      required: true,
    },
    {
      name: 'palabras_clave_objetivo',
      label: 'PALABRAS CLAVE OBJETIVO',
      type: 'textarea',
      placeholder: 'Una por línea. Ej:\n- recetas fáciles\n- cocina casera\n- comida rápida saludable',
      hint: 'Las palabras que quieres rankear',
      required: true,
    },
    {
      name: 'competidores_top_3',
      label: 'COMPETIDORES TOP 3',
      type: 'textarea',
      placeholder: 'Sitios de competencia a analizar. Uno por línea.',
      hint: 'URLs o nombres de competidores',
      required: true,
    },
    {
      name: 'ubicacion_objetivo',
      label: 'UBICACIÓN OBJETIVO',
      type: 'text',
      placeholder: 'Ej: España, Madrid, América Latina',
      hint: 'Geografía del SEO local',
      required: true,
    },
    {
      name: 'audito_tipo',
      label: 'TIPO DE AUDITORÍA',
      type: 'select',
      options: [
        { value: 'full', label: 'Auditoría Completa' },
        { value: 'competitive', label: 'Análisis Competitivo' },
        { value: 'technical', label: 'Solo Técnico' },
      ],
      required: true,
    },
    {
      name: 'historial_trafico',
      label: 'HISTORIAL DE TRÁFICO / METAS',
      type: 'textarea',
      placeholder: 'Tráfico actual, caídas recientes, objetivos de crecimiento...',
    },
  ],
}

export default function SeoAuditPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'seo-audit',
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
      resultComponent={SeoAuditResult}
    />
  )
}

function SeoAuditResult({ data }: { data?: any }) {
  const statCards = data?.statCards || [
    { label: 'Style Chars (Ideal <60)', value: '69', status: 'warning', description: 'Title truncates in SERPs' },
    { label: 'Imágenes con Alt Text', value: '20/20', status: 'perfect', description: 'All images described' },
    { label: 'Schema Types Activos', value: '5', status: 'good', description: 'Restaurant, Rating, etc' },
    { label: 'Hreflang Tags EN/TH', value: '0', status: 'critical', description: 'No multilingual setup' },
  ]

  const sections = data?.sections || []

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-red-500 font-mono mb-2">STARTUP FACTORY · SF DIGITAL AUDIT</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              SEO AUDIT <br /> SALSA BURGERS
            </h1>
            <p className="text-gray-400 max-w-2xl text-sm md:text-base">
              Análisis completo de posicionamiento orgánico, arquitectura técnica y oportunidades de crecimiento
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black text-yellow-400 mb-1">
              {data?.overall_score || 62}
            </div>
            <div className="text-xs text-gray-500">{data?.scoreLabel || 'SEO Health Score'}</div>
            {data?.overall_trend && (
              <div className="text-xs text-green-400 mt-2">{data.overall_trend}</div>
            )}
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((card: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                card.status === 'critical'
                  ? 'border-red-500/30 bg-red-500/5'
                  : card.status === 'perfect'
                    ? 'border-green-500/30 bg-green-500/5'
                    : card.status === 'warning'
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-white/10 bg-white/5'
              }`}
            >
              <div className={`text-lg md:text-2xl font-black mb-1 ${
                card.status === 'critical'
                  ? 'text-red-400'
                  : card.status === 'perfect'
                    ? 'text-green-400'
                    : card.status === 'warning'
                      ? 'text-orange-400'
                      : 'text-blue-400'
              }`}>
                {card.value}
              </div>
              <div className="text-xs text-gray-400 font-semibold">{card.label}</div>
              {card.description && (
                <div className="text-xs text-gray-500 mt-1">{card.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Sections */}
      {sections.length > 0 && (
        <div className="bg-black p-6 md:p-8 space-y-8">
          {sections.map((section: any, sIdx: number) => {
            // ON-PAGE SEO TABLE
            if (section.type === 'table' && section.elements) {
              return (
                <div key={sIdx}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-white uppercase mb-1">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-gray-400">{section.description}</p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-white/30">
                          <th className="text-left py-3 px-4 text-white font-bold">Element</th>
                          <th className="text-left py-3 px-4 text-white font-bold">Status</th>
                          <th className="text-left py-3 px-4 text-white font-bold">Analysis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.elements.map((elem: any, eIdx: number) => (
                          <tr key={eIdx} className="border-b border-white/15 hover:bg-white/5 transition">
                            <td className="py-3 px-4 text-white font-semibold">{elem.element}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                elem.status === 'critical' ? 'bg-red-500/20 text-red-400' :
                                elem.status === 'falta' ? 'bg-red-500/20 text-red-400' :
                                elem.status === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                                elem.status === 'perfect' ? 'bg-green-500/20 text-green-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {elem.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-xs">{elem.analysis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }

            // SCHEMA MARKUP CARDS
            if (section.type === 'schema_cards' && section.schemas) {
              return (
                <div key={sIdx}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-white uppercase mb-1">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-gray-400">{section.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {section.schemas.map((schema: any, schIdx: number) => (
                      <div
                        key={schIdx}
                        className={`p-4 rounded-lg border ${
                          schema.status === 'active'
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-red-500/30 bg-red-500/5'
                        }`}
                      >
                        <div className={`font-bold mb-2 ${
                          schema.status === 'active' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {'●'} {schema.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {schema.status === 'active' ? schema.impact : schema.opportunity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            // KEYWORDS TABLE
            if (section.type === 'table' && section.keywords) {
              return (
                <div key={sIdx}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-white uppercase mb-1">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-gray-400">{section.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.keywords.map((kw: any, kwIdx: number) => (
                      <div key={kwIdx} className="border border-white/10 bg-white/5 p-4 rounded">
                        <div className="font-bold text-white mb-2">{kw.keyword}</div>
                        <div className="text-xs text-gray-400 space-y-1">
                          {kw.volume && <div>Volume: <span className="text-yellow-400">{kw.volume}</span></div>}
                          {kw.intent && <div>Intent: <span className="text-blue-400">{kw.intent}</span></div>}
                          {kw.priority && <div>Priority: <span className="text-green-400">{kw.priority}</span></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            // BLOG & CONTENIDO ASSESSMENT
            if (section.type === 'table' && section.assessment) {
              return (
                <div key={sIdx}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-white uppercase mb-1">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-gray-400">{section.description}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {section.assessment.map((item: any, aIdx: number) => (
                      <div key={aIdx} className="border-l-2 border-yellow-500 bg-white/5 p-4 rounded-r">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="font-bold text-white">{item.element}</div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            item.status === 'desactualizado' ? 'bg-orange-500/20 text-orange-400' :
                            item.status === 'falta' ? 'bg-red-500/20 text-red-400' :
                            item.status === 'mejorable' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {item.status?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                        {item.recommendation && (
                          <div className="text-xs text-blue-400 italic">Recommendation: {item.recommendation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            // Standard findings
            return (
              <div key={sIdx}>
                <h2 className="text-2xl font-bold text-white uppercase mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.findings?.map((finding: any, fIdx: number) => (
                    <div key={fIdx} className="border-l-2 border-blue-500 bg-white/5 p-4 rounded-r">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="font-bold text-white">{finding.title}</div>
                        <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                          finding.severity === 'CRÍTICO' ? 'bg-red-500/20 text-red-400' :
                          finding.severity === 'ALTO' ? 'bg-orange-500/20 text-orange-400' :
                          finding.severity === 'MEDIO' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{finding.description}</p>
                      {finding.impact && (
                        <div className="text-xs text-red-400 mt-2">Impact: {finding.impact}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Actions / Plan de Acción */}
      {data?.actions && data.actions.length > 0 && (
        <div className="bg-black border-t border-white/10 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white uppercase mb-6">Plan de Acción</h2>
          <div className="space-y-3">
            {data.actions.map((action: any, idx: number) => (
              <div key={idx} className="border border-white/10 bg-white/5 p-4 rounded-lg hover:bg-white/8 transition">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="font-bold text-white">{idx + 1}. {action.title}</div>
                    {action.description && (
                      <p className="text-sm text-gray-400 mt-1">{action.description}</p>
                    )}
                  </div>
                  {action.priority && (
                    <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${
                      action.priority === 'CRÍTICO' ? 'bg-red-500/20 text-red-400' :
                      action.priority === 'ALTO' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {action.priority}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  {action.impact && <div>📊 {action.impact}</div>}
                  {action.effort && <div>⏱️ {action.effort}</div>}
                  {action.owner && <div>👤 {action.owner}</div>}
                  {action.expected_roi && <div>ROI: {action.expected_roi}/10</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-black border-t border-white/10 p-6 md:p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}
