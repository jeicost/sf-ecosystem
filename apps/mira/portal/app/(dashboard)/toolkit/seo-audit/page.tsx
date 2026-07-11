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
      resultComponent={<SeoAuditResult />}
    />
  )
}

function SeoAuditResult() {
  return (
    <div className="card p-6 space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: '#F87171' }}>
          ✓ SEO Audit Completado
        </p>
        <p className="text-sm text-gray-400">Tu auditoría SEO está lista con análisis de oportunidades y competencia.</p>
      </div>
    </div>
  )
}
