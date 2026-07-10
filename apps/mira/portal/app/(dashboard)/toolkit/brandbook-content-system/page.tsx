'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function BrandbookContentSystemPage() {
  const [isGenerating, setIsGenerating] = useState(false)

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
                Pilares de Contenido (separados por comas)
              </label>
              <input
                type="text"
                placeholder="Ej: Thought Leadership, Case Studies, Educational, Behind-the-Scenes"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Canales de Distribución (separados por comas)
              </label>
              <input
                type="text"
                placeholder="Ej: LinkedIn, Twitter, Blog, Newsletter, Podcast"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              />
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
            onClick={() => setIsGenerating(true)}
            disabled={isGenerating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando sistema...' : 'Crear Brandbook'}
          </button>
        </div>

        {isGenerating && (
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
