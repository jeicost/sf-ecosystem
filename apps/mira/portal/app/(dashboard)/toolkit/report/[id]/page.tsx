'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'

export default function ToolkitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mode, setMode] = useState<'report' | 'deck'>('report')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [driveState, setDriveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [driveMsg, setDriveMsg] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // B3: los informes del Toolkit ganan export directo al Drive del cliente
  // (antes solo Descargar HTML; la ruta ya soportaba queue_id).
  const saveToDrive = async () => {
    setDriveState('saving')
    setDriveMsg(null)
    try {
      const res = await fetch('/api/export/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.success) {
        setDriveState('error')
        setDriveMsg(data?.error || 'No se pudo guardar en Drive')
        return
      }
      setDriveState('saved')
      if (data.driveUrl) window.open(data.driveUrl, '_blank', 'noopener')
    } catch {
      setDriveState('error')
      setDriveMsg('No se pudo conectar con el servidor')
    }
  }

  const src =
    mode === 'deck'
      ? `/api/toolkit/export?queue_id=${id}&inline=1&template=deck`
      : `/api/toolkit/export?queue_id=${id}&inline=1`

  // El iframe no expone errores HTTP: pre-chequeamos cabeceras y abortamos el
  // body para no descargar el informe dos veces.
  useEffect(() => {
    setStatus('loading')
    setErrorMsg(null)
    const controller = new AbortController()
    fetch(src, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        if (res.ok) {
          setStatus('ready')
        } else {
          const body = await res.json().catch(() => null)
          setErrorMsg(body?.error || `Error ${res.status}`)
          setStatus('error')
        }
        controller.abort()
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setErrorMsg('No se pudo conectar con el servidor')
          setStatus('error')
        }
      })
    return () => controller.abort()
  }, [src, retryKey])

  return (
    <div className="flex flex-col h-screen bg-page">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-page shrink-0 gap-2">
        <Link
          href="/toolkit"
          className="text-sm text-ink-secondary hover:text-ink transition-colors shrink-0"
        >
          ← Volver al Toolkit
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'deck' ? 'report' : 'deck')}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              mode === 'deck' ? 'bg-ink text-page font-medium' : 'bg-surface-hover text-ink hover:opacity-80'
            }`}
          >
            🎬 {mode === 'deck' ? 'Ver informe' : 'Modo presentación'}
          </button>
          {mode === 'deck' && (
            <button
              onClick={() => iframeRef.current?.requestFullscreen?.()}
              className="text-sm px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            >
              ⛶ Pantalla completa
            </button>
          )}
          <a
            href={`/api/toolkit/export?queue_id=${id}${mode === 'deck' ? '&template=deck' : ''}`}
            className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
          >
            📥 Descargar HTML
          </a>
          <button
            onClick={saveToDrive}
            disabled={driveState === 'saving' || driveState === 'saved'}
            className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60"
          >
            {driveState === 'saving' ? '⏳ Guardando…' : driveState === 'saved' ? '✓ En tu Drive' : '📂 Guardar en Drive'}
          </button>
        </div>
      </div>
      {driveState === 'error' && driveMsg && (
        <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          {driveMsg}
        </div>
      )}
      {status === 'error' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-ink font-medium mb-1">No se pudo cargar el informe</p>
            <p className="text-sm text-ink-tertiary mb-4">{errorMsg}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="text-sm px-4 py-2 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative">
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-page">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-ink-tertiary">Cargando informe…</p>
              </div>
            </div>
          )}
          {status === 'ready' && (
            <iframe
              ref={iframeRef}
              src={src}
              className="absolute inset-0 w-full h-full border-0"
              title="Reporte"
              allow="fullscreen"
            />
          )}
        </div>
      )}
    </div>
  )
}
