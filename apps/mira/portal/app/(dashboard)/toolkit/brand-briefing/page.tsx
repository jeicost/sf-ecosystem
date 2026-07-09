'use client'

import { useState, useRef } from 'react'
import { Play, Copy } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'
import { useToolkitGeneration } from '@/hooks/useToolkitGeneration'

export default function BrandBriefingPage() {
  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')

  const { isGenerating, status, error, startGeneration } = useToolkitGeneration('brand-briefing')

  const handleGenerate = async () => {
    if (!businessName || !industry) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    await startGeneration({
      business_name: businessName,
      industry,
      additional_info: additionalInfo,
    })
  }

  return (
    <ToolkitToolPage
      icon="📋"
      name="Brand Briefing"
      description="Define tu marca en profundidad: misión, valores, audiencia, propuesta de valor y estrategia de posicionamiento"
      color="#8B5CF6"
      estimatedTime="5-10 minutos"
      outputFormat="Documento Brand Briefing PDF + JSON"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Generar Brand Briefing</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Nombre/Descripción de tu negocio
              </label>
              <input
                type="text"
                placeholder="Ej: Startup de SaaS de análisis de datos..."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Industria / Sector
              </label>
              <input
                type="text"
                placeholder="Ej: SaaS, Retail, Fintech..."
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Información adicional
              </label>
              <textarea
                placeholder="Ej: Somos una startup de 3 años, trabajamos con empresas de 50-500 personas..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                rows={3}
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando...' : 'Generar Brand Briefing'}
          </button>
        </div>

        {error && (
          <div className="card px-6 py-4" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {status && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(139,92,246,0.8)' }}>
                Resultado: Misión
              </p>
              <p className="text-sm text-white leading-relaxed mb-4">
                {status.result_data?.mission || 'Democratizar la inteligencia de datos, permitiendo a empresas de cualquier tamaño tomar decisiones basadas en datos sin requerir expertos en ciencia de datos.'}
              </p>
              <button className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                <Copy size={12} />
                Copiar
              </button>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(139,92,246,0.8)' }}>
                Resultado: Valores Clave
              </p>
              <ul className="text-sm text-white space-y-2 mb-4">
                {Array.isArray(status.result_data?.values) ? (
                  status.result_data.values.map((value: string, i: number) => (
                    <li key={i}>• {value}</li>
                  ))
                ) : (
                  <>
                    <li>• Accesibilidad: Democratizar herramientas complejas</li>
                    <li>• Precisión: Datos y análisis confiables</li>
                    <li>• Innovación: Siempre adelante en tecnología</li>
                    <li>• Transparencia: Claro en nuestra comunicación</li>
                  </>
                )}
              </ul>
              <button className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                <Copy size={12} />
                Copiar
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
