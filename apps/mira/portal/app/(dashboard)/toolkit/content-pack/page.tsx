'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'content-pack',
  icon: '📝',
  title: 'Content Pack',
  subtitle: 'Salsa Burgers',
  timing: '45-60 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#FBBF24',
  submitButtonText: 'Generar Content Pack',
  fields: [
    { name: 'tema_principal', label: 'TEMA PRINCIPAL', type: 'text', placeholder: 'Eg: "The art of wagyu burgers"', required: true },
    { name: 'formatos', label: 'FORMATOS DESEADOS', type: 'select', options: [{ value: 'blog', label: 'Blog Posts' }, { value: 'social', label: 'Social Media' }, { value: 'video', label: 'Video Scripts' }, { value: 'whitepaper', label: 'Whitepapers' }], required: true },
    { name: 'frecuencia', label: 'FRECUENCIA', type: 'select', options: [{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'weekly', label: 'Weekly' }], required: true },
    { name: 'audiencia', label: 'AUDIENCIA DESCRIPTION', type: 'textarea', placeholder: 'Expats, premium consumers, food enthusiasts...', required: true },
    { name: 'tono_voz', label: 'TONO DE VOZ', type: 'select', options: [{ value: 'professional', label: 'Professional' }, { value: 'casual', label: 'Casual' }, { value: 'humorous', label: 'Humorous' }, { value: 'educational', label: 'Educational' }], required: true },
    { name: 'casos_uso', label: 'CASOS DE USO / ESCENARIOS', type: 'textarea', placeholder: 'How to choose wagyu, delivery tips...', required: true },
    { name: 'palabras_clave', label: 'PALABRAS CLAVE', type: 'textarea', placeholder: 'burgers\nwagyu\ndelivery\npremium beef', hint: 'Una por línea' },
  ],
}

export default function ContentPackPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'content-pack', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ Content pack generado.</p>} />
}
