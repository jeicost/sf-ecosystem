'use client'

import { use, useEffect, useState, useRef } from 'react'
import { getTheme } from '@/lib/theme'
import Link from 'next/link'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import OpenInSlidesButton from '@/components/OpenInSlidesButton'

export default function ToolkitReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { locale } = useLocaleContext()
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
      setRefineMsg(data?.error || t('toolkit.report.refine-error-default', locale))
    }
  }
  const [queueMsg, setQueueMsg] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // F4: PPTX → Google Slides editable en el Drive del cliente. Vive en
  // components/OpenInSlidesButton (estados, Drive KO, reintento); aquí solo
  // se decide qué deck: en vista Presentación, el deck que se está viendo.

  // Portadas al materializar. El endpoint soportaba with_covers desde el
  // principio y la UI nunca lo mandaba: el flujo "mensual → cola" jamás
  // generó una sola imagen, en silencio (hallazgo del 17-ago). Apagado por
  // defecto: generar hasta 8 imágenes cuesta dinero y debe ser una decisión.
  const [withCovers, setWithCovers] = useState(false)

  // F4: materializar las captions del mes a la Cola de Aprobación
  const sendToQueue = async () => {
    setQueueState('sending')
    setQueueMsg(null)
    const res = await fetch('/api/toolkit/monthly-to-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queue_id: id, with_covers: withCovers }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.success) {
      setQueueState('sent')
      setQueueMsg(
        data.already
          ? t('toolkit.report.queue-already', locale)
          : data.message || t('toolkit.report.queue-sent-count', locale).replace('{n}', String(data.sent))
      )
    } else {
      setQueueState('error')
      setQueueMsg(data?.error || t('toolkit.report.queue-error-default', locale))
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
      if (res && !res.ok) setFbMsg((await res.json().catch(() => null))?.error || t('toolkit.report.generic-error-fallback', locale))
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
      setFbMsg((await res?.json().catch(() => null))?.error || t('toolkit.report.generic-error-fallback', locale))
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
        setDriveMsg(data?.error || t('toolkit.report.drive-error-default', locale))
        return
      }
      setDriveState('saved')
      if (data.driveUrl) window.open(data.driveUrl, '_blank', 'noopener')
    } catch {
      setDriveState('error')
      setDriveMsg(t('toolkit.report.connection-error', locale))
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
          setErrorMsg(body?.error || t('toolkit.report.http-error', locale).replace('{status}', String(res.status)))
          setStatus('error')
        }
        controller.abort()
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          setErrorMsg(t('toolkit.report.connection-error', locale))
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
          {t('toolkit.report.back-link', locale)}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefineOpen((v) => !v)}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${refineOpen ? 'bg-ink text-page font-medium' : 'bg-surface-hover text-ink hover:opacity-80'}`}
            title={t('toolkit.report.refine-tooltip', locale)}
          >
            {t('toolkit.report.refine-button', locale)}
          </button>
          <button
            onClick={() => setDocTheme(docTheme === 'dark' ? 'light' : 'dark')}
            className="text-sm px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            title={t('toolkit.report.theme-tooltip', locale)}
          >
            {docTheme === 'dark' ? t('toolkit.report.theme-dark', locale) : t('toolkit.report.theme-light', locale)}
          </button>
          <button
            onClick={() => setMode(mode === 'deck' ? 'report' : 'deck')}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              mode === 'deck' ? 'bg-ink text-page font-medium' : 'bg-surface-hover text-ink hover:opacity-80'
            }`}
          >
            🎬 {mode === 'deck' ? t('toolkit.report.view-report', locale) : t('toolkit.report.presentation-mode', locale)}
          </button>
          {mode === 'deck' && (
            <button
              onClick={() => iframeRef.current?.requestFullscreen?.()}
              className="text-sm px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            >
              {t('toolkit.report.fullscreen', locale)}
            </button>
          )}
          <a
            href={`/api/toolkit/export?queue_id=${id}${mode === 'deck' ? '&template=deck' : ''}&theme=${docTheme}`}
            className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
          >
            {t('toolkit.download-html', locale)}
          </a>
          {toolSlug === 'brand-book' && (
            <a
              href={`/api/toolkit/export?queue_id=${id}&format=voice-guide`}
              className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
              title={t('toolkit.report.voice-guide-tooltip', locale)}
            >
              {t('toolkit.report.voice-guide-button', locale)}
            </a>
          )}
          {/* Cualquier informe completado tiene deck (el de la vista
              Presentación); el botón decide solo si se pinta y por qué no. */}
          <OpenInSlidesButton
            queueId={id}
            artifact={mode === 'deck' ? 'deck' : undefined}
            theme={docTheme}
          />
          {toolSlug === 'monthly-content-system' && (<>
            {/* El deck PPTX bueno del mensual (?format=monthly-deck) solo era
                alcanzable vía Google Slides; este enlace lo hace descargable. */}
            <a
              href={`/api/toolkit/export?queue_id=${id}&format=monthly-deck`}
              className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
              title="Monthly content deck (PowerPoint)"
            >
              Download PPTX
            </a>
            <label className="flex items-center gap-1.5 text-xs text-ink-secondary cursor-pointer select-none">
              <input type="checkbox" checked={withCovers} onChange={(e) => setWithCovers(e.target.checked)} className="accent-current" />
              Generate covers (max 8)
            </label>
            <button
              onClick={sendToQueue}
              disabled={queueState === 'sending' || queueState === 'sent'}
              className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60"
              title={t('toolkit.report.queue-tooltip', locale)}
            >
              {queueState === 'sending' ? t('toolkit.report.queue-sending', locale) : queueState === 'sent' ? t('toolkit.report.queue-done', locale) : t('toolkit.report.queue-send', locale)}
            </button>
          </>)}
          <button
            onClick={saveToDrive}
            disabled={driveState === 'saving' || driveState === 'saved'}
            className="text-sm px-4 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-60"
          >
            {driveState === 'saving' ? t('toolkit.report.drive-saving', locale) : driveState === 'saved' ? t('toolkit.report.drive-saved', locale) : t('toolkit.report.drive-save', locale)}
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
            placeholder={t('toolkit.report.refine-placeholder', locale)}
            className="flex-1 min-w-[260px] px-3 py-1.5 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs"
          />
          <button
            onClick={runRefine}
            disabled={refineState === 'working' || !refineText.trim()}
            className="text-xs px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-50"
          >
            {refineState === 'working' ? t('toolkit.report.refine-working', locale) : t('toolkit.report.refine-apply', locale)}
          </button>
          {refineState === 'error' && refineMsg && <span className="text-xs text-amber-400">{refineMsg}</span>}
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
          <span className="text-xs text-ink-tertiary">{t('toolkit.report.feedback-prompt', locale)}</span>
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
                placeholder={t('toolkit.report.feedback-note-placeholder', locale)}
                className="flex-1 min-w-[220px] px-3 py-1.5 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-xs"
              />
              <button
                onClick={sendNote}
                disabled={fbState === 'sending'}
                className="text-xs px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors disabled:opacity-50"
              >
                {fbState === 'sending' ? t('toolkit.report.feedback-sending', locale) : t('toolkit.report.feedback-send', locale)}
              </button>
            </>
          )}
          {fbState === 'error' && fbMsg && <span className="text-xs text-amber-400">{fbMsg}</span>}
        </div>
      )}
      {fbState === 'sent' && (
        <div className="px-4 py-2 border-b border-line bg-page shrink-0 text-xs text-emerald-400">
          {t('toolkit.report.feedback-thanks', locale)}
        </div>
      )}
      {status === 'error' ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-ink font-medium mb-1">{t('toolkit.report.load-error-title', locale)}</p>
            <p className="text-sm text-ink-tertiary mb-4">{errorMsg}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              className="text-sm px-4 py-2 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            >
              {t('toolkit.report.retry', locale)}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative">
          {status === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-page">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-line border-t-ink rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-ink-tertiary">{t('toolkit.report.loading', locale)}</p>
              </div>
            </div>
          )}
          {status === 'ready' && (
            <iframe
              ref={iframeRef}
              src={src}
              className="absolute inset-0 w-full h-full border-0"
              title={t('toolkit.report.iframe-title', locale)}
              allow="fullscreen"
            />
          )}
        </div>
      )}
    </div>
  )
}
