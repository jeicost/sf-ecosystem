'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { ArrowLeft, Download, Share2 } from 'lucide-react'

interface ToolkitToolPageProps {
  icon: string
  name: string
  description: string
  color: string
  estimatedTime: string
  outputFormat: string
  guideUrl?: string
  isGenerating?: boolean
  children?: ReactNode
}

export default function ToolkitToolPage({
  icon,
  name,
  description,
  color,
  estimatedTime,
  outputFormat,
  guideUrl,
  isGenerating = false,
  children,
}: ToolkitToolPageProps) {
  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <Link href="/toolkit" className="inline-flex items-center gap-1 text-xs font-medium mb-6" style={{ color }}>
        <ArrowLeft size={12} />
        Volver a Business Reports
      </Link>

      <div className="mb-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-5xl">{icon}</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color }}>
              Herramienta IA
            </p>
            <h1 className="text-3xl font-semibold text-ink tracking-tight mb-2">{name}</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        {/* Main Content */}
        <div className="col-span-2" id="printable-toolkit-result">
          {children}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card px-5 py-4 sticky top-8">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color }}>
              Sobre esta Herramienta
            </p>
            <div className="space-y-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <div>
                <p className="font-medium text-ink mb-1">Tiempo estimado</p>
                <p>{estimatedTime}</p>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">Salida</p>
                <p>{outputFormat}</p>
              </div>
              {guideUrl && (
                <div>
                  <p className="font-medium text-ink mb-1">Recursos</p>
                  <Link href={guideUrl} style={{ color }} className="hover:underline">
                    Ver Guía →
                  </Link>
                </div>
              )}
            </div>

            {isGenerating && (
              <div className="mt-6 space-y-2">
                <button onClick={() => window.print()} className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: `${color}18`, color }}>
                  <Download size={12} />
                  Descargar PDF
                </button>
                <button className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-surface)', color: 'var(--text-tertiary)' }}>
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
