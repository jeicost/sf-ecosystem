'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'marketing-audit',
  icon: '📊',
  title: 'Marketing Audit',
  subtitle: 'Salsa Burgers',
  timing: '25-35 min',
  brandBrainNote: 'Brand Brain cargado — estrategia anual compilada',
  submitButtonColor: '#60A5FA',
  submitButtonText: 'Generar Marketing Audit',
  fields: [
    {
      name: 'url_sitio',
      label: 'URL DEL SITIO WEB',
      type: 'text',
      placeholder: 'https://www.tusitio.com',
      required: true,
    },
    {
      name: 'canales_actuales',
      label: 'CANALES DE MARKETING ACTUALES',
      type: 'textarea',
      placeholder: 'Uno por línea. Ej:\n- Instagram\n- Email marketing\n- Google Ads\n- SEO orgánico',
      hint: 'Canales que estás usando ahora',
      required: true,
    },
    {
      name: 'presupuesto_anual',
      label: 'PRESUPUESTO ANUAL DE MARKETING',
      type: 'text',
      placeholder: 'Ej: €25.000 o $30.000',
      hint: 'Presupuesto total anual',
      required: true,
    },
    {
      name: 'metricas_clave',
      label: 'MÉTRICAS CLAVE QUE MIDES',
      type: 'textarea',
      placeholder: 'Ej:\n- Tráfico web\n- Tasa de conversión\n- Costo por adquisición\n- ROI',
      required: true,
    },
    {
      name: 'objetivos_trim',
      label: 'OBJETIVOS DEL TRIMESTRE',
      type: 'textarea',
      placeholder: 'Metas específicas para los próximos 3 meses.',
      required: true,
    },
    {
      name: 'competencia_directa',
      label: 'COMPETENCIA DIRECTA',
      type: 'textarea',
      placeholder: 'Nombres o URLs de competidores directos. Uno por línea.',
      required: true,
    },
    {
      name: 'recursos_team',
      label: 'RECURSOS Y EQUIPO',
      type: 'textarea',
      placeholder: 'Ej: 1 social manager, 1 SEO specialist, herramientas disponibles...',
      required: true,
    },
  ],
}

export default function MarketingAuditPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'marketing-audit',
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
      resultComponent={MarketingAuditResult}
    />
  )
}

function MarketingAuditResult({ data }: { data?: any }) {
  const statCards = data?.statCards || [
    { label: 'Brand Identity Score', value: '87/100', description: 'Strong USP and visual identity' },
    { label: 'Conversion Funnel', value: '80/100', description: 'ORDER NOW visible, integrations strong' },
    { label: 'Social Media', value: '35/100', status: 'critical', description: 'Links but no proof' },
    { label: 'Content Marketing', value: '40/100', status: 'critical', description: 'Blog inactive 2+ months' },
    { label: 'Lead Capture', value: '55/100', status: 'warning', description: 'No email or newsletter' },
    { label: 'Local Marketing', value: '70/100', description: 'Active but no GMB link' },
  ]

  const sections = data?.sections || []

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-black border-b border-white/10 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-red-500 font-mono mb-2">STARTUP FACTORY · SF MARKETING AUDIT</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              MARKETING <br /> AUDIT
            </h1>
            <p className="text-gray-400 max-w-2xl text-sm md:text-base">
              Diagnóstico de brand, conversion funnel, social presencia y estrategia digital
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black text-yellow-400 mb-1">
              {data?.overall_score || 68}
            </div>
            <div className="text-xs text-gray-500">{data?.scoreLabel || 'Marketing Health Score'}</div>
            {data?.overall_trend && (
              <div className="text-xs text-green-400 mt-2">{data.overall_trend}</div>
            )}
          </div>
        </div>

        {/* 6 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                card.status === 'critical'
                  ? 'border-red-500/30 bg-red-500/5'
                  : card.status === 'warning'
                    ? 'border-orange-500/30 bg-orange-500/5'
                    : 'border-white/10 bg-white/5'
              }`}
            >
              <div className={`text-lg md:text-2xl font-black mb-1 ${
                card.status === 'critical'
                  ? 'text-red-400'
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
            // 4-CARD SECTIONS (Brand, Funnel, Social, etc)
            if (section.type === 'cards' && section.cards) {
              return (
                <div key={sIdx}>
                  <div className="mb-6">
                    {section.icon && <div className="text-2xl mb-2">{section.icon}</div>}
                    <h2 className="text-2xl font-black text-white uppercase mb-1">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-gray-400">{section.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.cards.map((card: any, cIdx: number) => {
                      const borderColorMap: Record<string, string> = {
                        teal: 'border-teal-500',
                        red: 'border-red-500',
                        orange: 'border-orange-500',
                        green: 'border-green-500',
                      }
                      const borderColor = borderColorMap[card.color_border as string] || 'border-white/20'

                      return (
                        <div key={cIdx} className={`border-l-4 ${borderColor} bg-white/5 p-4 rounded-r`}>
                          <h3 className="font-bold text-white mb-2">+ {card.title}</h3>
                          <p className="text-sm text-gray-400">{card.content}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }

            // E-E-A-T MATRIX
            if (section.type === 'eeat_matrix' && section.dimensions) {
              return (
                <div key={sIdx}>
                  <div className="mb-6">
                    {section.icon && <div className="text-2xl mb-2">{section.icon}</div>}
                    <h2 className="text-2xl font-black text-white uppercase mb-1">{section.title}</h2>
                    {section.description && (
                      <p className="text-sm text-gray-400">{section.description}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {section.dimensions.map((dim: any, dIdx: number) => {
                      const statusColorMap: Record<string, string> = {
                        Strong: 'text-teal-400',
                        Present: 'text-yellow-400',
                        Weak: 'text-orange-400',
                      }
                      const statusColor = statusColorMap[dim.status as string] || 'text-gray-400'

                      return (
                        <div key={dIdx} className="border border-white/10 bg-white/5 p-4 rounded text-center">
                          <div className={`text-lg font-bold mb-2 ${statusColor}`}>{dim.status}</div>
                          <div className="text-sm font-semibold text-white mb-2">{dim.name}</div>
                          {dim.content && (
                            <div className="text-xs text-gray-500">{dim.content}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }

            // Standard findings section
            return (
              <div key={sIdx}>
                <h2 className="text-2xl font-bold text-white uppercase mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {section.findings?.map((finding: any, fIdx: number) => (
                    <div key={fIdx} className="border-l-2 border-yellow-500 bg-white/5 p-4 rounded-r">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="font-bold text-white">{finding.title}</div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                          finding.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          finding.severity === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {finding.severity?.toUpperCase()}
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

      {/* Quick Wins Section */}
      {data?.quickWins && data.quickWins.length > 0 && (
        <div className="bg-black border-t border-white/10 p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white uppercase mb-6 flex items-center gap-2">
            ⚡ Quick Wins
          </h2>
          <div className="space-y-3">
            {data.quickWins.map((action: any, idx: number) => (
              <div key={idx} className="border-l-2 border-yellow-500 bg-white/5 p-4 rounded-lg hover:bg-white/8 transition">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="font-bold text-white">{idx + 1}. {action.title}</div>
                    {action.description && (
                      <p className="text-sm text-gray-400 mt-1">{action.description}</p>
                    )}
                  </div>
                  {action.effort_tag && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-500/20 text-green-400 whitespace-nowrap">
                      {action.effort_tag}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  {action.impact && <div>💰 {action.impact}</div>}
                  {action.effort_hours && <div>⏱️ {action.effort_hours}h</div>}
                  {action.roi_score && <div>ROI: {action.roi_score}/10</div>}
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
