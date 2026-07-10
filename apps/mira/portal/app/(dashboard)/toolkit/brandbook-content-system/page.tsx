'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'
import { useToolkitGeneration } from '@/hooks/useToolkitGeneration'

export default function BrandbookContentSystemPage() {
  const { isGenerating, status, error, startGeneration } = useToolkitGeneration('brandbook-content-system')
  const [brandInfo, setBrandInfo] = useState('')
  const [visualRefs, setVisualRefs] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'Twitter/X', 'YouTube'])
  const [pillars, setPillars] = useState('9')

  return (
    <ToolkitToolPage
      icon="📚"
      name="Brandbook Content System"
      description="Sistema completo de contenidos de marca: guías de tono, templates, arquetipos de personajes, calendarios editoriales y playbooks de contenido por canal."
      color="#8B5CF6"
      estimatedTime="30-40 minutos"
      outputFormat="Brandbook PDF de 50+ páginas + Templates Figma + Content Calendar"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Crear Sistema de Contenidos de Marca</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Información de marca
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Se extraerá automáticamente del Brand Brain
              </p>
              <textarea
                value={brandInfo}
                onChange={e => setBrandInfo(e.target.value)}
                placeholder="Resumen adicional de tu marca, diferenciadores clave, target audience"
                className="w-full px-3 py-2 rounded-lg text-sm"
                rows={3}
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Acceso a referencias visuales (Google Drive/Figma)
              </label>
              <input
                type="text"
                value={visualRefs}
                onChange={e => setVisualRefs(e.target.value)}
                placeholder="URLs de Google Drive o Figma con assets de marca"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Canales de Distribución
              </label>
              <div className="space-y-2">
                {['Instagram', 'TikTok', 'LinkedIn', 'Facebook', 'Twitter/X', 'YouTube'].map(platform => (
                  <label key={platform} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platforms.includes(platform)}
                      onChange={() => setPlatforms(prev =>
                        prev.includes(platform)
                          ? prev.filter(p => p !== platform)
                          : [...prev, platform]
                      )}
                      className="w-4 h-4 cursor-pointer"
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Pillares de contenido (número)
              </label>
              <select
                value={pillars}
                onChange={e => setPillars(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              >
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Frecuencia de Publicación (posts/mes)
              </label>
              <input
                type="number"
                placeholder="Ej: 12"
                min="1"
                max="100"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>
          <button
            onClick={async () => {
              if (!brandInfo.trim()) {
                alert('Por favor ingresa información de marca')
                return
              }
              await startGeneration({
                brand_info: brandInfo,
                visual_references: visualRefs,
                platforms,
                pillar_count: parseInt(pillars),
              })
            }}
            disabled={isGenerating || !brandInfo.trim()}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating || !brandInfo.trim() ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
              opacity: !brandInfo.trim() ? 0.6 : 1,
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando sistema...' : 'Crear Brandbook'}
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
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Contenido del Brandbook
              </p>
              <div className="space-y-2 text-sm text-white">
                <p>📖 <strong>Guías de Tono:</strong> Voz, personalidad y lenguaje por audiencia</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Ejemplos: Formal/Casual, Técnico/Accesible, Empático/Directo</p>
                <p className="mt-3">🎨 <strong>Arquetipos de Personajes:</strong> 5-7 buyer personas con características y motivaciones</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Incluye pain points, goals, objections y best channels</p>
                <p className="mt-3">📅 <strong>Calendar Editorial:</strong> Planificación de 3 meses con contenido por canal y pillar</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Incluye plantillas de posts, hashtags y KPIs</p>
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
                Formatos Generados
              </p>
              <div className="space-y-2 text-sm text-white">
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Template Blog Post</span>
                  <span style={{ color: '#C4B5FD' }}>✓ Incluido</span>
                </div>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span>Social Media Templates</span>
                  <span style={{ color: '#C4B5FD' }}>✓ 7 formatos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email Newsletter Template</span>
                  <span style={{ color: '#C4B5FD' }}>✓ Incluido</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
