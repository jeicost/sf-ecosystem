'use client'

import { getTheme } from '@/lib/theme'
import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'
import { AttachmentDropzone } from '@/components/AttachmentDropzone'
import type { Attachment } from '@/lib/attachments'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import OpenInSlidesButton from '@/components/OpenInSlidesButton'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

interface SlideOption {
  index: number // 0-based
  title: string
  layout: string
}

export default function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { locale } = useLocaleContext()
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [slideTarget, setSlideTarget] = useState('') // 1-based; empty = todo el documento
  const [refining, setRefining] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [docTheme, setDocTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => { setDocTheme(getTheme()) }, [])
  const [toolSlug, setToolSlug] = useState<string | null>(null)
  // Estado real de la generación. El visor montaba el iframe a ciegas: si la
  // fila estaba en 'processing' o 'failed', /api/toolkit/export devuelve 400
  // y el usuario veía JSON crudo o un marco en blanco, sin mensaje, sin
  // reintento y sin forma de saber si aquello iba a terminar alguna vez.
  const [docStatus, setDocStatus] = useState<'loading' | 'processing' | 'failed' | 'completed' | 'missing'>('loading')
  const [docError, setDocError] = useState<string | null>(null)
  const [stuck, setStuck] = useState(false)
  const [slides, setSlides] = useState<SlideOption[]>([])
  // Adjuntos que acompañan a la SIGUIENTE instrucción de refinado (2026-08-17).
  // El editor no tenía dropzone -- solo Quick Actions y Business Reports -- así
  // que no había forma de darle al refinado un PDF, un deck viejo o una foto:
  // el CEO se lo pidió en texto y acabó en un error de parseo. El clientId sale
  // de la propia fila del documento (no del cliente activo en localStorage)
  // porque la subida guarda en brand-assets/{clientId}/documents/ y la ruta de
  // refine solo acepta adjuntos que cuelguen del cliente dueño del documento.
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [docClientId, setDocClientId] = useState<string | null>(null)
  const [canvaState, setCanvaState] = useState<'idle' | 'loading'>('idle')
  const [canvaError, setCanvaError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // El autoscroll lo gestiona ChatThread.

  // Carga tool_slug + lista de slides del result_data (se refresca tras cada refine)
  useEffect(() => {
    let cancelled = false
    async function loadDoc() {
      const { data } = await createClient()
        .from('generation_queue')
        .select('tool_slug, result_data, status, error_message, created_at, client_id')
        .eq('id', id)
        .single()
      if (cancelled) return
      if (!data) { setDocStatus('missing'); return }
      setDocClientId((data.client_id as string) || null)

      const status = String(data.status)
      setDocStatus(
        status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'processing'
      )
      setDocError((data.error_message as string) || null)
      // "Colgado": mismo umbral que app/api/quick-actions/retry/route.ts (10
      // min). Si Vercel mata la función a los 300 s, el catch de la ruta no
      // llega a ejecutarse y la fila se queda en 'processing' para siempre —
      // indistinguible de una generación en curso salvo por el tiempo.
      if (status !== 'completed' && status !== 'failed' && data.created_at) {
        setStuck(Date.now() - new Date(data.created_at as string).getTime() > 10 * 60 * 1000)
      } else {
        setStuck(false)
      }

      setToolSlug(data.tool_slug as string)
      const result = (data.result_data || {}) as Record<string, unknown>
      const rawSlides = Array.isArray(result.slides) ? (result.slides as Record<string, unknown>[]) : []
      setSlides(
        rawSlides.map((s, i) => ({
          index: i,
          title: typeof s?.title === 'string' ? s.title : '',
          layout: typeof s?.layout === 'string' ? s.layout : '',
        }))
      )
    }
    loadDoc()
    // Mientras esté generando, refrescar cada 5 s para pasar a 'completed' y
    // montar el iframe (y para detectar el caso "colgado"). Se detiene en
    // cuanto termina: el listado tenía un polling que no paraba nunca cuando
    // una fila se quedaba atascada en 'processing'.
    const poll =
      docStatus === 'processing' || docStatus === 'loading'
        ? setInterval(loadDoc, 5000)
        : null
    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
    }
  }, [id, iframeKey, docStatus])

  const isDeck = toolSlug === 'doc-deck'

  async function handleOpenInCanva() {
    setCanvaState('loading')
    setCanvaError(null)
    try {
      const res = await fetch('/api/export/canva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_id: id }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 409 || json?.error === 'canva_not_connected') {
        setCanvaError(t('docs.canva-not-connected', locale))
      } else if (res.status === 503) {
        setCanvaError(t('docs.canva-coming-soon', locale))
      } else if (!res.ok || !json?.editUrl) {
        setCanvaError(json?.error || t('docs.canva-send-failed', locale))
      } else {
        window.open(json.editUrl, '_blank', 'noopener')
      }
    } catch {
      setCanvaError(t('docs.server-error', locale))
    } finally {
      setCanvaState('idle')
    }
  }

  async function handleRefine(text: string) {
    const instruction = text.trim()
    if (!instruction || refining) return
    const slideNum = parseInt(slideTarget, 10)
    const hasSlideTarget = Number.isInteger(slideNum) && slideNum >= 1
    // Se congela la lista de adjuntos de ESTE turno: el usuario puede seguir
    // soltando ficheros mientras el modelo trabaja y esos serán del siguiente.
    const turnAttachments = attachments
    setMessages((m) => [
      ...m,
      {
        role: 'user',
        content:
          (hasSlideTarget ? `[Slide ${slideNum}] ${instruction}` : instruction) +
          (turnAttachments.length ? `\n📎 ${turnAttachments.map((a) => a.name).join(', ')}` : ''),
      },
    ])
    setRefining(true)
    try {
      const res = await fetch('/api/documents/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queue_id: id,
          instruction,
          ...(hasSlideTarget ? { slide_index: slideNum - 1 } : {}),
          // Mismo shape que Quick Actions (QuickActionButton → /api/quick-actions):
          // los metadatos del adjunto, nunca el fichero; el servidor lo baja
          // del bucket por `path`.
          ...(turnAttachments.length ? { attachments: turnAttachments } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setMessages((m) => [...m, { role: 'assistant', content: `✅ ${t('docs.change-applied', locale)}` }])
      // El adjunto era para este cambio: se limpia solo cuando se ha aplicado.
      // Si falla se conserva para poder reintentar sin volver a subirlo.
      setAttachments((current) => current.filter((a) => !turnAttachments.includes(a)))
      setIframeKey((k) => k + 1)
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `❌ ${e instanceof Error ? e.message : t('docs.change-failed', locale)}` },
      ])
    } finally {
      setRefining(false)
    }
  }

  function handlePrint() {
    iframeRef.current?.contentWindow?.print()
  }

  function handlePresent() {
    iframeRef.current?.requestFullscreen?.()
  }

  return (
    <div className="flex flex-col h-screen bg-page">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line shrink-0 gap-2">
        <Link href="/documents" className="text-sm text-ink-secondary hover:text-ink transition-colors shrink-0">
          {t('docs.back-to-documents', locale)}
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              chatOpen ? 'bg-amber-500 text-black font-medium' : 'bg-surface text-ink hover:bg-surface-hover'
            }`}
          >
            ✨ {t('docs.refine', locale)}
          </button>
          <button
            onClick={handlePresent}
            className="text-sm px-3 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors"
          >
            🎬 {t('docs.present', locale)}
          </button>
          <button
            onClick={handlePrint}
            className="text-sm px-3 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors"
          >
            🖨️ {t('docs.print-pdf', locale)}
          </button>
          <button
            onClick={() => setDocTheme(docTheme === 'dark' ? 'light' : 'dark')}
            className="text-sm px-3 py-1.5 rounded bg-surface-hover text-ink hover:opacity-80 transition-colors"
            title="Document theme (light/dark)"
          >
            {docTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <a
            href={`/api/toolkit/export?queue_id=${id}&theme=${docTheme}`}
            className="text-sm px-3 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors"
          >
            📥 HTML
          </a>
          {isDeck && (
            <a
              href={`/api/toolkit/export?queue_id=${id}&format=pptx&theme=${docTheme}`}
              className="text-sm px-3 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors"
            >
              📥 PPTX
            </a>
          )}
          {isDeck && (
            <button
              onClick={handleOpenInCanva}
              disabled={canvaState === 'loading'}
              className="text-sm px-3 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {canvaState === 'loading' ? `⏳ ${t('docs.sending-to-canva', locale)}` : `🎨 ${t('docs.open-in-canva', locale)}`}
            </button>
          )}
          {/* Google Slides — el botón existía solo en dos informes del toolkit; el
              editor de decks, que es donde el CEO lo buscó, solo tenía Canva (503 sin
              credenciales). Ahora está aquí, con estado real: deshabilitado con motivo
              si no hay PPTX, y aviso claro si el Drive del cliente no está conectado. */}
          {isDeck && (
            <OpenInSlidesButton
              queueId={id}
              artifact="deck"
              theme={docTheme}
              className="text-sm px-3 py-1.5 rounded bg-surface text-ink hover:bg-surface-hover transition-colors disabled:opacity-50"
            />
          )}
        </div>
      </div>
      {canvaError && (
        <p className="px-4 py-1.5 text-xs text-amber-600 border-b border-line" role="alert">
          {canvaError}
        </p>
      )}

      <div className="flex flex-1 min-h-0">
        {docStatus === 'completed' ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={`/api/toolkit/export?queue_id=${id}&inline=1&theme=${docTheme}`}
            className="flex-1 w-full border-0"
            title={t('docs.document', locale)}
            allow="fullscreen"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-3">
              {docStatus === 'loading' && (
                <p className="text-sm text-ink-secondary">Loading…</p>
              )}

              {docStatus === 'processing' && !stuck && (
                <>
                  <p className="text-2xl">✨</p>
                  <p className="text-sm font-semibold text-ink">Still generating</p>
                  <p className="text-xs text-ink-secondary">
                    A full document takes a couple of minutes. This page refreshes on its own —
                    you can leave and come back.
                  </p>
                </>
              )}

              {docStatus === 'processing' && stuck && (
                <>
                  <p className="text-2xl">⏱️</p>
                  <p className="text-sm font-semibold text-ink">This one got stuck</p>
                  <p className="text-xs text-ink-secondary">
                    It has been running for over 10 minutes, which means the generation was cut off
                    before it could finish. Nothing was charged twice — start a new one, ideally with
                    a narrower topic.
                  </p>
                  <a href="/documents" className="inline-block text-xs px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                    Back to Documents
                  </a>
                </>
              )}

              {docStatus === 'failed' && (
                <>
                  <p className="text-2xl">⚠️</p>
                  <p className="text-sm font-semibold text-ink">This document failed to generate</p>
                  {docError && (
                    <p className="text-xs text-ink-tertiary font-mono break-words bg-surface border border-line rounded p-2">
                      {docError}
                    </p>
                  )}
                  <a href="/documents" className="inline-block text-xs px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                    Try again
                  </a>
                </>
              )}

              {docStatus === 'missing' && (
                <>
                  <p className="text-2xl">🔍</p>
                  <p className="text-sm font-semibold text-ink">Document not found</p>
                  <p className="text-xs text-ink-secondary">
                    It may belong to a different client than the one selected.
                  </p>
                  <a href="/documents" className="inline-block text-xs px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors">
                    Back to Documents
                  </a>
                </>
              )}
            </div>
          </div>
        )}

        {chatOpen && (
          <div className="w-80 border-l border-line flex flex-col bg-card">
            <div className="px-4 py-3 border-b border-line">
              <p className="text-ink text-sm font-semibold">{t('docs.refine-document', locale)}</p>
              <p className="text-ink-tertiary text-xs mt-0.5">
                {t('docs.refine-hint', locale)}
              </p>
            </div>
            <ChatThread
              className="flex-1 min-h-0"
              chatKey={`doc-refine:${id}`}
              messages={messages}
              isLoading={refining}
              thinkingLabel="Applying your changes…"
            />
            <div className="p-3 border-t border-line space-y-2">
              {slides.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-ink-tertiary text-[11px] shrink-0">{t('docs.slide-to-edit', locale)}</label>
                  <select
                    value={slideTarget}
                    onChange={(e) => setSlideTarget(e.target.value)}
                    disabled={refining}
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-page border border-line text-ink text-xs focus:border-amber-500 outline-none"
                  >
                    <option value="">{t('docs.whole-document', locale)}</option>
                    {slides.map((s) => (
                      <option key={s.index} value={String(s.index + 1)}>
                        {s.index + 1}. {s.title || s.layout || t('docs.slide', locale)}
                        {s.layout ? ` · ${s.layout}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Adjuntos que viajan con la instrucción (PDF, imagen, texto,
                  DOCX, PPTX). Mismo componente que Quick Actions; el prefix
                  'documents' los separa en el bucket. */}
              <AttachmentDropzone
                clientId={docClientId}
                attachments={attachments}
                onChange={setAttachments}
                prefix="documents"
                disabled={refining || !docClientId}
                driveEnabled
              />
            </div>

            {/* Composer compartido (2026-08-24): era un <input> de una línea en
                el que Enter enviaba sin Shift+Enter posible, así que una
                instrucción de dos frases no se podía ni escribir. */}
            <ChatComposer
              chatKey={`doc-refine:${id}`}
              onSend={(text) => handleRefine(text)}
              isLoading={refining}
              allowAttachments={false}
              accent="#F59E0B"
              hideHints
              placeholder={t('docs.instruction-placeholder', locale)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
