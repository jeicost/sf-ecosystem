'use client'
import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'brandbook-content-system',
  icon: '📚',
  title: 'Brandbook Content System',
  subtitle: 'Salsa Burgers',
  timing: '30-40 min',
  brandBrainNote: 'Brand Brain cargado — campos pre-rellenados',
  submitButtonColor: '#8B5CF6',
  submitButtonText: 'Generar Brandbook Content System',
  fields: [
    { name: 'brand_name', label: 'NOMBRE DE MARCA', type: 'text', placeholder: 'Salsa Burgers', required: true },
    { name: 'industria', label: 'INDUSTRIA', type: 'text', placeholder: 'F&B - Premium Burgers', required: true },
    { name: 'target_audience', label: 'TARGET AUDIENCE', type: 'textarea', placeholder: 'Expats, premium consumers, food enthusiasts in Bangkok...', required: true },
    { name: 'brand_mission', label: 'BRAND MISSION', type: 'textarea', placeholder: 'To deliver world-class wagyu burger experience...', required: true },
    { name: 'tone_personality', label: 'BRAND PERSONALITY / TONE', type: 'textarea', placeholder: 'Premium, casual, approachable, fun...', required: true },
    { name: 'content_buckets', label: 'MAIN CONTENT THEMES / BUCKETS', type: 'textarea', placeholder: 'House of Flavors\nThe SALSA Ritual\nFlavor Personalities\nBuilt for Delivery\nSocial Proof', hint: 'Uno por línea', required: true },
    { name: 'visual_guidelines', label: 'VISUAL / DESIGN GUIDELINES', type: 'textarea', placeholder: 'Color palette, typography, imagery style...' },
    { name: 'referencias', label: 'REFERENCE BRANDS (OPCIONAL)', type: 'textarea', placeholder: 'Brand inspiration: Shake Shack, Five Guys...' },
  ],
}

export default function BrandbookContentSystemPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_slug: 'brandbook-content-system', input_data: formData }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed')
    return res.json()
  }
  return <ToolRunnerPage config={TOOL_CONFIG} onGenerate={handleGenerate} resultComponent={<p className="text-sm text-gray-400">✓ Brandbook content system generado.</p>} />
}
