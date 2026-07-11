'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'seo-audit',
  icon: '🔍',
  title: 'SEO Audit',
  subtitle: 'Salsa Burgers',
  timing: '30-40 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#F87171',
  submitButtonText: 'Generar SEO Audit',
  fields: [
    { name: 'url_sitio', label: 'URL DEL SITIO', type: 'text', placeholder: 'https://salsaburgers.com', required: true },
    { name: 'palabras_clave', label: 'PALABRAS CLAVE OBJETIVO', type: 'textarea', placeholder: 'burgers Bangkok\nwagyu delivery\nthailand premium beef', hint: 'Una por línea', required: true },
    { name: 'competidores', label: 'TOP 3 COMPETIDORES', type: 'textarea', placeholder: 'competitor1.com\ncompetitor2.com\ncompetitor3.com', required: true },
    { name: 'ubicacion', label: 'UBICACIÓN OBJETIVO', type: 'text', placeholder: 'Bangkok, Thailand', required: true },
    { name: 'tipo_audit', label: 'TIPO DE AUDITORÍA', type: 'select', options: [{ value: 'full', label: 'Full Audit' }, { value: 'competitive', label: 'Competitive Analysis' }, { value: 'technical', label: 'Technical Only' }], required: true },
    { name: 'trafico_historico', label: 'HISTORIAL DE TRÁFICO / OBJETIVOS', type: 'textarea', placeholder: 'Tráfico actual, objetivos...' },
  ],
}

export default function SEOAuditPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'seo-audit', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ SEO audit generado.</p>} />
}
