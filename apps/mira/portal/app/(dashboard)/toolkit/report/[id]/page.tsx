'use client'

import { use, useState, useRef } from 'react'
import Link from 'next/link'

export default function ToolkitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mode, setMode] = useState<'report' | 'deck'>('report')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const src =
    mode === 'deck'
      ? `/api/toolkit/export?queue_id=${id}&inline=1&template=deck`
      : `/api/toolkit/export?queue_id=${id}&inline=1`

  return (
    <div className="flex flex-col h-screen bg-[#1A1A1A]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#1A1A1A] shrink-0 gap-2">
        <Link
          href="/toolkit"
          className="text-sm text-white/60 hover:text-white transition-colors shrink-0"
        >
          ← Volver al Toolkit
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'deck' ? 'report' : 'deck')}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              mode === 'deck' ? 'bg-white text-black font-medium' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            🎬 {mode === 'deck' ? 'Ver informe' : 'Modo presentación'}
          </button>
          {mode === 'deck' && (
            <button
              onClick={() => iframeRef.current?.requestFullscreen?.()}
              className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              ⛶ Pantalla completa
            </button>
          )}
          <a
            href={`/api/toolkit/export?queue_id=${id}${mode === 'deck' ? '&template=deck' : ''}`}
            className="text-sm px-4 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            📥 Descargar HTML
          </a>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        className="flex-1 w-full border-0"
        title="Reporte"
        allow="fullscreen"
      />
    </div>
  )
}
