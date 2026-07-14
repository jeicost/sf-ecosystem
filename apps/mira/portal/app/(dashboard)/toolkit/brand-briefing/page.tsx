'use client'

import ToolRunnerPage, { ToolConfig } from '@/components/ToolRunnerPage'

const TOOL_CONFIG: ToolConfig = {
  slug: 'brand-briefing',
  icon: '💭',
  title: 'Brand Briefing',
  subtitle: 'Complete brand strategy',
  timing: '20-30 min',
  brandBrainNote: 'Brand Brain cargado — estrategia compilada',
  submitButtonColor: '#A78BFA',
  submitButtonText: 'Generar Brand Briefing',
  fields: [
    {
      name: 'nombre_cliente',
      label: 'NOMBRE DEL CLIENTE',
      type: 'text',
      placeholder: 'Ej: Salsa Burgers',
      required: true,
    },
    {
      name: 'website_url',
      label: 'URL SITIO WEB',
      type: 'text',
      placeholder: 'https://www.salsaburgers.com',
      required: true,
    },
    {
      name: 'sector_industria',
      label: 'SECTOR / INDUSTRIA',
      type: 'text',
      placeholder: 'Ej: F&B Delivery, Premium Burgers',
      required: true,
    },
  ],
}

export default function BrandBriefingPage() {
  const handleGenerate = async (formData: Record<string, any>) => {
    const res = await fetch('/api/toolkit/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool_slug: 'brand-briefing',
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
      resultComponent={BrandBriefingResult}
    />
  )
}

function BrandBriefingResult({ data }: { data?: any }) {
  return (
    <div className="w-full space-y-8">
      <div className="bg-black border-b border-white/10 p-8">
        <h1 className="text-5xl font-black text-white mb-2">BRAND BRIEFING</h1>
        <p className="text-gray-400">Posicionamiento, identidad visual, estrategia de contenido y hoja de ruta 12 meses</p>
      </div>

      <div className="bg-black p-8 space-y-8">
        {data?.brand_identity && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-white/10 bg-white/5 p-4 rounded">
                <div className="text-xs text-gray-400 mb-2">NOMBRE</div>
                <div className="text-lg font-bold text-white">{data.brand_identity.name}</div>
              </div>
              {data.brand_identity.mission && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 mb-2">MISIÓN</div>
                  <div className="text-sm text-gray-300">{data.brand_identity.mission}</div>
                </div>
              )}
              {data.brand_identity.proposition && (
                <div className="border border-white/10 bg-white/5 p-4 rounded">
                  <div className="text-xs text-gray-400 mb-2">PROPOSICIÓN</div>
                  <div className="text-sm text-gray-300">{data.brand_identity.proposition}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {data?.target_audience && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Target Audience</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              <p className="text-gray-300 text-sm">{data.target_audience.description}</p>
            </div>
          </section>
        )}

        {data?.brand_pillars && data.brand_pillars.length > 0 && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Content Pillars</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.brand_pillars.map((pillar: any, idx: number) => (
                <div key={idx} className="border-l-4 border-purple-500 bg-white/5 p-4 rounded-r">
                  <div className="font-bold text-white mb-2">{idx + 1}. {pillar.name}</div>
                  <p className="text-sm text-gray-400">{pillar.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {data?.brand_voice && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Voice</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              {data.brand_voice.tone && <p className="text-sm text-gray-300">{data.brand_voice.tone}</p>}
            </div>
          </section>
        )}

        {data?.visual_identity && (
          <section>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Visual Identity</h2>
            <div className="border border-white/10 bg-white/5 p-4 rounded">
              {data.visual_identity.colors && (
                <div className="space-y-2">
                  {data.visual_identity.colors.map((color: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded border border-white/20" style={{ backgroundColor: color.hex || '#000' }}></div>
                      <div className="text-xs text-gray-400">{color.name} ({color.hex})</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="bg-black border-t border-white/10 p-8 text-center text-xs text-gray-500">
        {data?.generatedAt && <div>Generated {data.generatedAt}</div>}
      </div>
    </div>
  )
}
