'use client'

import { getTheme } from '@/lib/theme'
import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

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
  const [input, setInput] = useState('')
  const [slideTarget, setSlideTarget] = useState('') // 1-based; empty = todo el documento
  const [refining, setRefining] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [docTheme, setDocTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => { setDocTheme(getTheme()) }, [])
  const [toolSlug, setToolSlug] = useState<string | null>(null)
  const [slides, setSlides] = useState<SlideOption[]>([])
  const [canvaState, setCanvaState] = useState<'idle' | 'loading'>('idle')
  const [canvaError, setCanvaError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Carga tool_slug + lista de slides del result_data (se refresca tras cada refine)
  useEffect(() => {
    let cancelled = false
    async function loadDoc() {
      const { data } = await createClient()
        .from('generation_queue')
        .select('tool_slug, result_data')
        .eq('id', id)
        .single()
      if (cancelled || !data) return
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
    return () => {
      cancelled = true
    }
  }, [id, iframeKey])

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

  async function handleRefine() {
    const instruction = input.trim()
    if (!instruction || refining) return
    const slideNum = parseInt(slideTarget, 10)
    const hasSlideTarget = Number.isInteger(slideNum) && slideNum >= 1
    setInput('')
    setMessages((m) => [
      ...m,
      { role: 'user', content: hasSlideTarget ? `[Slide ${slideNum}] ${instruction}` : instruction },
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
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setMessages((m) => [...m, { role: 'assistant', content: `✅ ${t('docs.change-applied', locale)}` }])
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
            title="Tema del documento (claro/oscuro)"
          >
            {docTheme === 'dark' ? '🌙 Oscuro' : '☀️ Claro'}
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
        </div>
      </div>
      {canvaError && (
        <p className="px-4 py-1.5 text-xs text-amber-600 border-b border-line" role="alert">
          {canvaError}
        </p>
      )}

      <div className="flex flex-1 min-h-0">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={`/api/toolkit/export?queue_id=${id}&inline=1&theme=${docTheme}`}
          className="flex-1 w-full border-0"
          title={t('docs.document', locale)}
          allow="fullscreen"
        />

        {chatOpen && (
          <div className="w-80 border-l border-line flex flex-col bg-card">
            <div className="px-4 py-3 border-b border-line">
              <p className="text-ink text-sm font-semibold">{t('docs.refine-document', locale)}</p>
              <p className="text-ink-tertiary text-xs mt-0.5">
                {t('docs.refine-hint', locale)}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-ink-muted text-xs text-center mt-8">
                  {t('docs.refine-empty', locale)}
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${
                    m.role === 'user' ? 'bg-amber-500/15 text-ink ml-6' : 'bg-surface text-ink-secondary mr-6'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {refining && (
                <div className="text-xs rounded-lg px-3 py-2 bg-surface text-ink-tertiary mr-6 animate-pulse">
                  {t('docs.applying-changes', locale)}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
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
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  placeholder={t('docs.instruction-placeholder', locale)}
                  disabled={refining}
                  className="flex-1 px-3 py-2 rounded-lg bg-page border border-line text-ink text-xs focus:border-amber-500 outline-none"
                />
                <button
                  onClick={handleRefine}
                  disabled={refining || !input.trim()}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-surface disabled:text-ink-muted text-black text-xs font-semibold transition"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
