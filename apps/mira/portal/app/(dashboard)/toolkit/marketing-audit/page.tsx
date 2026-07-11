'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'marketing-audit',
  icon: '📊',
  title: 'Marketing Audit',
  subtitle: 'Salsa Burgers',
  timing: '25-35 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#60A5FA',
  submitButtonText: 'Generar Marketing Audit',
  fields: [
    { name: 'url_sitio', label: 'URL DEL SITIO', type: 'text', placeholder: 'https://salsaburgers.com', required: true },
    { name: 'canales', label: 'CANALES ACTUALES', type: 'textarea', placeholder: 'Social Media (Instagram, Facebook)\nEmail\nGoogle Ads\nWeb', required: true },
    { name: 'presupuesto', label: 'PRESUPUESTO ANUAL MARKETING', type: 'text', placeholder: 'EUR €24,000', required: true },
    { name: 'metricas', label: 'MÉTRICAS CLAVE', type: 'textarea', placeholder: 'MRR, CAC, LTV, Conversion Rate...', required: true },
    { name: 'objetivos_trim', label: 'OBJETIVOS TRIMESTRAL', type: 'textarea', placeholder: '50% revenue growth, 500 new followers...', required: true },
    { name: 'competencia', label: 'COMPETENCIA DIRECTA', type: 'textarea', placeholder: 'Competitor 1, Competitor 2, Competitor 3...', required: true },
    { name: 'recursos_team', label: 'RECURSOS / TEAM', type: 'textarea', placeholder: 'Team de 3 personas. Sin developer propio...' },
  ],
}

export default function MarketingAuditPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'marketing-audit', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ Marketing audit generado.</p>} />
}
