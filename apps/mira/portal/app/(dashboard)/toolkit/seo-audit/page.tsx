'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Copy } from 'lucide-react'
import ToolkitToolPage from '@/components/toolkit-tool-page'

export default function SEOAuditPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [url, setUrl] = useState('')

  return (
    <ToolkitToolPage
      icon="🔍"
      name="SEO Audit"
      description="Análisis técnico y estratégico de tu sitio web: on-page SEO, velocidad, indexabilidad, backlinks y oportunidades de posicionamiento"
      color="#6366F1"
      estimatedTime="10-15 minutos"
      outputFormat="Reporte SEO PDF + JSON + CSV"
      isGenerating={isGenerating}
    >
      <div className="space-y-4">
        <div className="card px-6 py-5">
          <p className="text-sm font-semibold text-white mb-4">Auditar tu Website</p>
          <div>
            <label className="block text-xs font-medium text-white mb-2">
              URL del sitio
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://tudominio.com"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <p className="text-xs mt-3 mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Analizaremos: estructura de sitio, velocidad, etiquetas meta, backlinks, palabras clave y recomendaciones de mejora
          </p>
          <button
            onClick={() => setIsGenerating(true)}
            disabled={isGenerating || !url}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: isGenerating || !url ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: 'white',
              opacity: !url ? 0.6 : 1,
            }}
          >
            <Play size={16} />
            {isGenerating ? 'Analizando...' : 'Ejecutar Auditoría SEO'}
          </button>
        </div>

        {isGenerating && (
          <div className="space-y-4">
            <div className="card px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6366F1' }}>
                  Score SEO
                </p>
                <p className="text-2xl font-bold text-white">78/100</p>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(99,102,241,0.2)' }}>
                <div className="h-2 rounded-full" style={{ background: '#6366F1', width: '78%' }} />
              </div>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6366F1' }}>
                Hallazgos Críticos
              </p>
              <ul className="text-sm text-white space-y-2 mb-4">
                <li>🔴 Falta meta description en 12 páginas</li>
                <li>🟠 Velocidad LCP: 3.2s (objetivo: &lt;2.5s)</li>
                <li>🟠 Mobile: 5 errores de viewport</li>
                <li>🟡 Enlaces rotos: 3 encontrados</li>
              </ul>
              <button className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                <Copy size={12} />
                Copiar
              </button>
            </div>

            <div className="card px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6366F1' }}>
                Recomendaciones Top 3
              </p>
              <ol className="text-sm text-white space-y-2 mb-4">
                <li className="flex gap-2">
                  <span>1.</span>
                  <span>Optimizar imágenes (ahorrará ~200ms en LCP)</span>
                </li>
                <li className="flex gap-2">
                  <span>2.</span>
                  <span>Añadir meta descriptions a todas las páginas</span>
                </li>
                <li className="flex gap-2">
                  <span>3.</span>
                  <span>Implementar lazy loading en imágenes below-the-fold</span>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </ToolkitToolPage>
  )
}
