'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function ContentPackPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [contentType, setContentType] = useState('mixed')

  return (
    <ToolkitToolPage
      icon="📝"
      name="Content Pack"
      description="Paquete mensual de contenido listo para publicar: posts, artículos, carousels y videos optimizados para cada plataforma"
      color="#F97316"
      estimatedTime="15-20 minutos"
      outputFormat="20+ piezas de contenido en PDF + Figma editable"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Generar Content Pack</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Tipo de contenido
              </label>
              <select
                value={contentType}
                onChange={e => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="mixed">Mixto (posts + carousels + videos)</option>
                <option value="posts">Solo Posts</option>
                <option value="carousels">Solo Carousels</option>
                <option value="videos">Solo Scripts de Video</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white mb-2">
                Plataformas objetivo
              </label>
              <div className="space-y-2">
                {['Instagram', 'LinkedIn', 'Twitter', 'TikTok'].map(platform => (
                  <label key={platform} className="flex items-center gap-2 text-sm text-white">
                    <input type="checkbox" defaultChecked className="w-4 h-4 cursor-pointer" />
                    {platform}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsGenerating(true)}
            disabled={isGenerating}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              color: 'white',
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Generando contenido...' : 'Generar Content Pack'}
          </button>
        </div>

        {isGenerating && (
          <div className="card px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#F97316' }}>
              Contenido Generado
            </p>
            <div className="space-y-3 text-sm text-white">
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>8 Posts de Instagram</span>
                <span style={{ color: '#FDBA74' }}>✓</span>
              </div>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>6 Carousels para LinkedIn</span>
                <span style={{ color: '#FDBA74' }}>✓</span>
              </div>
              <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>10 Tweets/Threads</span>
                <span style={{ color: '#FDBA74' }}>✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>4 Scripts de video (15-30s)</span>
                <span style={{ color: '#FDBA74' }}>✓</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
