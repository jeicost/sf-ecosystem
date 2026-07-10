'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Download, Copy, Share2 } from 'lucide-react'

export default function BrandBriefingPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <Link href="/toolkit" className="inline-flex items-center gap-1 text-xs font-medium mb-6" style={{ color: 'rgba(139,92,246,0.8)' }}>
        <ArrowLeft size={12} />
        Volver al Toolkit
      </Link>

      <div className="mb-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl">📋</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)' }}>
              Herramienta IA
            </p>
            <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Brand Briefing</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Define tu marca en profundidad: misión, valores, audiencia, propuesta de valor y estrategia de posicionamiento
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        {/* Left: Generate Section */}
        <div className="col-span-2">
          <div className="card px-6 py-5 mb-6">
            <p className="text-sm font-semibold text-white mb-4">Generar Brand Briefing</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-2">
                  Nombre/Descripción de tu negocio
                </label>
                <input
                  type="text"
                  placeholder="Ej: Startup de SaaS de análisis de datos..."
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
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  rows={3}
                  style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
            <button
              onClick={() => setIsGenerating(true)}
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

          {/* Results (Mock) */}
          {isGenerating && (
            <div className="space-y-4">
              <div className="card px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(139,92,246,0.8)' }}>
                  Resultado: Misión
                </p>
                <p className="text-sm text-white leading-relaxed mb-4">
                  Democratizar la inteligencia de datos, permitiendo a empresas de cualquier tamaño tomar decisiones basadas en datos sin requerir expertos en ciencia de datos.
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
                  <li>• Accesibilidad: Democratizar herramientas complejas</li>
                  <li>• Precisión: Datos y análisis confiables</li>
                  <li>• Innovación: Siempre adelante en tecnología</li>
                  <li>• Transparencia: Claro en nuestra comunicación</li>
                </ul>
                <button className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                  <Copy size={12} />
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div>
          <div className="card px-5 py-4 sticky top-8">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'rgba(139,92,246,0.8)' }}>
              Sobre esta Herramienta
            </p>
            <div className="space-y-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <div>
                <p className="font-medium text-white mb-1">Tiempo estimado</p>
                <p>5-10 minutos</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Salida</p>
                <p>Documento Brand Briefing PDF + JSON</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Recursos</p>
                <Link href="#" style={{ color: '#a78bfa' }} className="hover:underline">
                  Ver Guía →
                </Link>
              </div>
            </div>

            {isGenerating && (
              <div className="mt-6 space-y-2">
                <button className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                  <Download size={12} />
                  Descargar PDF
                </button>
                <button className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(139,92,246,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  <Share2 size={12} />
                  Compartir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
