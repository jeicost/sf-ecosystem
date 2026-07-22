'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'
import { getStoredProjectId } from '@/lib/project-context'
import { MarketingAuditResult } from './marketing-audit-result'

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
      resultComponent={MarketingAuditResult}
    />
  )
}
