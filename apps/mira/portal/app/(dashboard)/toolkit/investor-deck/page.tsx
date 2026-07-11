'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'investor-deck',
  icon: '📈',
  title: 'Investor Deck',
  subtitle: 'Salsa Burgers',
  timing: '60-90 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#34D399',
  submitButtonText: 'Generar Investor Deck',
  fields: [
    { name: 'nombre_empresa', label: 'NOMBRE DE LA EMPRESA', type: 'text', placeholder: 'Salsa Burgers', required: true },
    { name: 'descripcion_breve', label: 'DESCRIPCIÓN BREVE (ONE-LINE PITCH)', type: 'text', placeholder: 'Premium wagyu burgers delivered to Bangkok elite', required: true },
    { name: 'problema', label: 'PROBLEMA QUE RESUELVES', type: 'textarea', placeholder: 'No hay opciones premium de burgers con delivery rápido...', required: true },
    { name: 'tam', label: 'MERCADO TAM', type: 'text', placeholder: 'USD $50M', required: true },
    { name: 'traccion', label: 'TRACTION ACTUAL', type: 'textarea', placeholder: 'Revenue €40k/month, 6 months operating, 500+ orders...', required: true },
    { name: 'equipo', label: 'EQUIPO OVERVIEW', type: 'textarea', placeholder: 'Founder: 10yr F&B experience, CMO: Brand strategy expert...', required: true },
    { name: 'ronda_size', label: 'RONDA DE INVERSIÓN', type: 'text', placeholder: 'USD $500,000', required: true },
    { name: 'uso_fondos', label: 'USO DE FONDOS', type: 'textarea', placeholder: 'Marketing 40%, Operations 35%, Product 25%...', required: true },
  ],
}

export default function InvestorDeckPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'investor-deck', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ Investor deck generado.</p>} />
}
