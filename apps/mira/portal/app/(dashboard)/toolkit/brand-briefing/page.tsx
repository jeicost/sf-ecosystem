'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'brand-briefing',
  icon: '💭',
  title: 'Brand Briefing',
  subtitle: 'Salsa Burgers',
  timing: '15-20 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#A78BFA',
  submitButtonText: 'Generar Brand Briefing',
  fields: [
    { name: 'nombre_cliente', label: 'NOMBRE DEL CLIENTE', type: 'text', placeholder: 'Salsa Burgers', required: true },
    { name: 'website_url', label: 'WEBSITE URL', type: 'text', placeholder: 'https://...', hint: 'Claude la insertará para enriquecer contexto', required: true },
    { name: 'sector_industria', label: 'SECTOR / INDUSTRIA', type: 'text', placeholder: 'F&B - Wagyu Burgers - Bangkok', required: true },
    { name: 'color_principal', label: 'COLOR PRINCIPAL', type: 'color', defaultValue: '#FF4500', required: true },
    { name: 'audiencia_objetivo', label: 'AUDIENCIA OBJETIVO', type: 'textarea', placeholder: 'Expats y locales premium...', required: true },
    { name: 'pilares_contenido', label: 'PILARES DE CONTENIDO (UNO POR LÍNEA)', type: 'textarea', placeholder: 'House of Flavors\nThe SALSA Ritual\nFlavor Personalities\nBuilt for Delivery\nSocial Proof', hint: '5-7 pilares', required: true },
    { name: 'contexto_adicional', label: 'CONTEXTO ADICIONAL (OPCIONAL)', type: 'textarea', placeholder: 'Diferenciadores clave...' },
  ],
}

export default function BrandBriefingPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'brand-briefing', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ Brand briefing generado.</p>} />
}
