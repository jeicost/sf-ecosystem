'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'competitive-analysis',
  icon: '⚔️',
  title: 'Competitive Analysis',
  subtitle: 'Salsa Burgers',
  timing: '40-50 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#EC4899',
  submitButtonText: 'Generar Competitive Analysis',
  fields: [
    { name: 'competidor_1', label: 'COMPETIDOR 1', type: 'text', placeholder: 'https://competitor1.com o nombre', required: true },
    { name: 'competidor_2', label: 'COMPETIDOR 2', type: 'text', placeholder: 'https://competitor2.com o nombre', required: true },
    { name: 'competidor_3', label: 'COMPETIDOR 3', type: 'text', placeholder: 'https://competitor3.com o nombre', required: true },
    { name: 'proposicion', label: 'TU PROPUESTA DE VALOR ÚNICA', type: 'textarea', placeholder: 'Premium wagyu, 30-min delivery, premium pricing...', required: true },
    { name: 'posicion_mercado', label: 'POSICIÓN DE MERCADO', type: 'select', options: [{ value: 'leader', label: 'Market Leader' }, { value: 'challenger', label: 'Challenger' }, { value: 'niche', label: 'Niche Player' }], required: true },
    { name: 'diferenciadores', label: 'DIFERENCIADORES CLAVE', type: 'textarea', placeholder: 'Quality, Speed, Price, Experience...\nUno por línea', required: true },
    { name: 'precio_posicionamiento', label: 'PRECIO POSICIONAMIENTO vs COMPETENCIA', type: 'text', placeholder: 'Premium +30% vs competitors', required: true },
    { name: 'vulnerabilidades', label: 'VULNERABILIDADES DE COMPETENCIA', type: 'textarea', placeholder: 'Slow delivery, average quality, poor customer service...' },
  ],
}

export default function CompetitiveAnalysisPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'competitive-analysis', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ Competitive analysis generado.</p>} />
}
