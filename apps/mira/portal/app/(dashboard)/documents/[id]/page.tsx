'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export default function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [slideTarget, setSlideTarget] = useState('') // 1-based; empty = todo el documento
  const [refining, setRefining] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      setMessages((m) => [...m, { role: 'assistant', content: '✅ Cambio aplicado. Recargando documento…' }])
      setIframeKey((k) => k + 1)
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `❌ ${e instanceof Error ? e.message : 'No se pudo aplicar el cambio'}` },
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
    <div className="flex flex-col h-screen bg-[#1A1A1A]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0 gap-2">
        <Link href="/documents" className="text-sm text-white/60 hover:text-white transition-colors shrink-0">
          ← Documentos
        </Link>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setChatOpen((o) => !o)}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              chatOpen ? 'bg-amber-500 text-black font-medium' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            ✨ Refinar
          </button>
          <button
            onClick={handlePresent}
            className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            🎬 Presentar
          </button>
          <button
            onClick={handlePrint}
            className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            🖨️ Imprimir / PDF
          </button>
          <a
            href={`/api/toolkit/export?queue_id=${id}`}
            className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            📥 HTML
          </a>
          <a
            href={`/api/toolkit/export?queue_id=${id}&format=pptx`}
            className="text-sm px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            📥 PPTX
          </a>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={`/api/toolkit/export?queue_id=${id}&inline=1`}
          className="flex-1 w-full border-0"
          title="Documento"
          allow="fullscreen"
        />

        {chatOpen && (
          <div className="w-80 border-l border-white/10 flex flex-col bg-[#111]">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white text-sm font-semibold">Refinar documento</p>
              <p className="text-white/40 text-xs mt-0.5">
                Pide cambios: &quot;añade una sección de precios&quot;, &quot;acorta el resumen&quot;…
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-white/30 text-xs text-center mt-8">
                  Escribe una instrucción y el documento se actualizará conservando el diseño.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${
                    m.role === 'user' ? 'bg-amber-500/15 text-amber-100 ml-6' : 'bg-white/5 text-white/70 mr-6'
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {refining && (
                <div className="text-xs rounded-lg px-3 py-2 bg-white/5 text-white/50 mr-6 animate-pulse">
                  Aplicando cambios…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-white/40 text-[11px] shrink-0">Slide a editar</label>
                <input
                  type="number"
                  min={1}
                  value={slideTarget}
                  onChange={(e) => setSlideTarget(e.target.value)}
                  placeholder="Todo el documento"
                  disabled={refining}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none placeholder:text-white/25"
                />
                {slideTarget && (
                  <button
                    onClick={() => setSlideTarget('')}
                    className="text-white/40 hover:text-white text-xs px-1"
                    title="Editar todo el documento"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  placeholder="Tu instrucción…"
                  disabled={refining}
                  className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:border-amber-500 outline-none"
                />
                <button
                  onClick={handleRefine}
                  disabled={refining || !input.trim()}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-white/10 disabled:text-white/30 text-black text-xs font-semibold transition"
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
