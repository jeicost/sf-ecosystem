'use client'

import { use, useEffect, useState, useRef } from 'react'
import { getTheme } from '@/lib/theme'
import Link from 'next/link'

export default function ToolkitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mode, setMode] = useState<'report' | 'deck'>('report')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [driveState, setDriveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [driveMsg, setDriveMsg] = useState<string | null>(null)
  const [fbOutcome, setFbOutcome] = useState<'helpful' | 'not_helpful' | null>(null)
  const [fbNote, setFbNote] = useState('')
  const [fbState, setFbState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [fbMsg, setFbMsg] = useState<string | null>(null)
  const [toolSlug, setToolSlug] = useState<string | null>(null)
  // P3: tema del documento — arranca con el tema del portal, conmutable
  const [docTheme, setDocTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => { setDocTheme(getTheme()) }, [])
  const [slidesState, setSlidesState] = useState<'idle' | 'creating' | 'done' | 'error'>('idle')
  const [slidesMsg, setSlidesMsg] = useState<string | null>(null)
  const [queueState, setQueueState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  // P3: Refinar el informe con una instrucción (misma ruta que los documentos)
  const [refineOpen, setRefineOpen] = useState(false)
  const [refineText, setRefineText] = useState('')
  const [refineState, setRefineState] = useState<'idle' | 'working' | 'error'>('idle')
  const [refineMsg, setRefineMsg] = useState<string | null>(null)

  const runRefine = async () => {
    if (!refineText.trim() || refineState === 'working') return
    setRefineState('working')
    setRefineMsg(null)
    const res = await fetch('/api/documents/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: id, instruction: refineText.trim() }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok) {
      setRefineState('idle')
      setRefineText('')
      setRefineOpen(false)
      setRetryKey((k) => k + 1) // recargar el informe revisado
    } else {
      setRefineState('error')
      setRefineMsg(data?.error || 'No se pudo refinar')
    }
  }
  const [queueMsg, setQueueMsg] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // F4: PPTX → Google Slides editable en el Drive del cliente
  const createSlides = async () => {
    setSlidesState('creating')
    setSlidesMsg(null)
    const res = await fetch('/api/toolkit/export-slides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: id }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.success) {
      setSlidesState('done')
      if (data.driveUrl) window.open(data.driveUrl, '_blank', 'noopener')
    } else {
      setSlidesState('error')
      setSlidesMsg(data?.error || 'No se pudo crear la presentación')
    }
  }

  // F4: materializar las captions del mes a la Cola de Aprobación
  const sendToQueue = async () => {
    setQueueState('sending')
    setQueueMsg(null)
    const res = await fetch('/api/toolkit/monthly-to-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: id }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.success) {
      setQueueState('sent')
      setQueueMsg(data.already ? 'Ya estaban en la Cola — no se duplican.' : data.message || `${data.sent} enviadas`)
    } else {
      setQueueState('error')
      setQueueMsg(data?.error || 'No se pudo enviar a la Cola')
    }
  }

  // El Voice Guide A4 solo existe en brand-book — el slug llega del status
  useEffect(() => {
    fetch(`/api/toolkit/status?queue_id=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setToolSlug(d?.tool_slug ?? null))
      .catch(() => {})
  }, [id])

  // B4: feedback al "diseñador de documentos" — la nota se reinyecta en la
  // siguiente generación de este mismo tool para este cliente.
  const sendFeedback = async (outcome: 'helpful' | 'not_helpful') => {
    setFbOutcome(outcome)
    if (outcome === 'helpful') {
      setFbState('sending')
      const res = await fetch('/api/document-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: id, outcome }),
      }).catch(() => null)
      setFbState(res?.ok ? 'sent' : 'error')
      if (res && !res.ok) setFbMsg((await res.json().catch(() => null))?.error || 'Error')
    }
  }

  const sendNote = async () => {
    setFbState('sending')
    const res = await fetch('/api/document-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: id, outcome: 'not_helpful', note: fbNote }),
    }).catch(() => null)
    if (res?.ok) setFbState('sent')
    else {
      setFbState('error')
      setFbMsg((await res?.json().catch(() => null))?.error || 'Error')
    }
  }

  // B3: los informes del Toolkit ganan export directo al Drive del cliente
  // (antes solo Descargar HTML; la ruta ya soportaba queue_id).
  const saveToDrive = async () => {
    setDriveState('saving')
    setDriveMsg(null)
    try {
      const res = await fetch('/api/export/google-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: id, theme: docTheme }),
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
      ? `/api/toolkit/export?queue_id=${id}&inline=1&template=deck&theme=${docTheme}`
      : `/api/toolkit/export?queue_id=${id}&inline=1&theme=${docTheme}`

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
          ← Volver a Business Reports
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefineOpen((v) => !v)}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${refineOpen ? 'bg-ink text-page font-medium' : 'bg-surface-hover text-ink hover:opacity-80'}`}
            title="Regenerar el informe con una instrucción"
          >
            ✨ Refinar
          </button>
          <button
            onClick={() => setDocTheme(docTheme === 'dark' ? 'light' : 'dark')}
            className="text-sm px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            title="Tema del documento (claro/oscuro)"
          >
            {docTheme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
          </button>
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
            href={`/api/toolkit/export?queue_id=${id}${mode === 'deck' ? '&template=deck' : ''}&theme=${docTheme}`}
            className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
          >
            📥 Descargar HTML
          </a>
          {toolSlug === 'brand-book' && (
            <a
              href={`/api/toolkit/export?queue_id=${id}&format=voice-guide`}
              className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
              title="One-pager A4 de la guía de voz, listo para imprimir"
            >
              📄 Voice Guide A4
            </a>
          )}
          {(toolSlug === 'monthly-content-system' || toolSlug === 'brand-book') && (
            <button
              onClick={createSlides}
              disabled={slidesState === 'creating' || slidesState === 'done'}
              className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60"
              title="Crea una presentación de Google Slides editable en el Drive del cliente"
            >
              {slidesState === 'creating' ? '⏳ Creando Slides…' : slidesState === 'done' ? '✓ Slides en Drive' : '📊 Crear Google Slides'}
            </button>
          )}
          {toolSlug === 'monthly-content-system' && (
            <button
              onClick={sendToQueue}
              disabled={queueState === 'sending' || queueState === 'sent'}
              className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60"
              title="Materializa las captions del mes en la Cola de Aprobación con su fecha"
            >
              {queueState === 'sending' ? '⏳ Enviando…' : queueState === 'sent' ? '✓ En la Cola' : '📤 Enviar captions a la Cola'}
            </button>
          )}
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
      {refineOpen && (
        <div className="px-4 py-2 border-b border-line bg-page shrink-0 flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runRefine()}
            placeholder="Ej.: acorta el resumen ejecutivo y haz el plan más accionable"
            className="flex-1 min-w-[260px] px-3 py-1.5 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs"
          />
          <button
            onClick={runRefine}
            disabled={refineState === 'working' || !refineText.trim()}
            className="text-xs px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-50"
          >
            {refineState === 'working' ? '⏳ Refinando…' : 'Aplicar'}
          </button>
          {refineState === 'error' && refineMsg && <span className="text-xs text-amber-400">{refineMsg}</span>}
        </div>
      )}
      {slidesState === 'error' && slidesMsg && (
        <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          {slidesMsg}
        </div>
      )}
      {queueMsg && (
        <div className={`px-4 py-2 text-xs border-b shrink-0 ${queueState === 'error' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
          {queueMsg}
        </div>
      )}
      {/* Feedback al diseñador de documentos */}
      {status === 'ready' && fbState !== 'sent' && (
        <div className="px-4 py-2 border-b border-line bg-page shrink-0 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-ink-tertiary">¿Cómo mejorarías este documento?</span>
          <button
            onClick={() => sendFeedback('helpful')}
            className={`text-sm px-2 py-1 rounded transition-colors ${fbOutcome === 'helpful' ? 'bg-emerald-500/20' : 'hover:bg-surface-hover'}`}
          >👍</button>
          <button
            onClick={() => sendFeedback('not_helpful')}
            className={`text-sm px-2 py-1 rounded transition-colors ${fbOutcome === 'not_helpful' ? 'bg-red-500/20' : 'hover:bg-surface-hover'}`}
          >👎</button>
          {fbOutcome === 'not_helpful' && (
            <>
              <input
                type="text"
                value={fbNote}
                onChange={(e) => setFbNote(e.target.value)}
                placeholder="¿Qué cambiarías? (se usará en la próxima generación)"
                className="flex-1 min-w-[220px] px-3 py-1.5 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs"
              />
              <button
                onClick={sendNote}
                disabled={fbState === 'sending'}
                className="text-xs px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-50"
              >
                {fbState === 'sending' ? 'Enviando…' : 'Enviar'}
              </button>
            </>
          )}
          {fbState === 'error' && fbMsg && <span className="text-xs text-amber-400">{fbMsg}</span>}
        </div>
      )}
      {fbState === 'sent' && (
        <div className="px-4 py-2 border-b border-line bg-page shrink-0 text-xs text-emerald-400">
          ✓ Gracias — tu feedback se usará en la próxima generación.
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
