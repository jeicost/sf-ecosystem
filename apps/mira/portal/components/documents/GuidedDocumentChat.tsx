'use client'

// Chat que prepara el brief de un documento antes de generarlo.
//
// Sustituye al formulario de 3 campos como camino por defecto: MIRA carga el
// Brand Brain, no pregunta lo que ya sabe, pregunta por los huecos reales
// (incluidos los `data_gaps` que dejaron los documentos anteriores de este
// cliente) y pide el idioma del entregable. Cuando el brief está cerrado,
// llama a /api/documents/generate — el mismo camino de generación de siempre.

import { useEffect, useRef, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'

interface Msg { role: 'user' | 'assistant'; content: string }

interface Props {
  docType: string
  docLabel: string
  clientId: string
  onCancel: () => void
  onSwitchToForm: () => void
}

export default function GuidedDocumentChat({ docType, docLabel, clientId, onCancel, onSwitchToForm }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [conversation, setConversation] = useState<unknown[]>([])
  const [fields, setFields] = useState<Record<string, unknown>>({})
  // Indexado por campo, no una lista: si el modelo corrige un valor debe
  // sustituir al anterior, no añadirse debajo.
  const [captured, setCaptured] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  // Primer turno automático: que MIRA abra la conversación diciendo qué sabe ya
  // y qué necesita, en vez de dejar un campo vacío mirando al usuario.
  useEffect(() => {
    if (started.current) return
    started.current = true
    send(
      `[System] The user just opened the briefing chat for a ${docLabel}. This is NOT the topic — ` +
        'nothing has been briefed yet. Greet them, say in one line what you already know from the brand ' +
        'context, and ask your first questions.',
      true
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function send(text: string, silent = false) {
    if (sending || generating) return
    setError(null)
    if (!silent) setMessages((m) => [...m, { role: 'user', content: text }])
    setSending(true)
    try {
      const res = await fetch('/api/documents/guided', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, doc_type: docType, message: text, conversation, fields }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)

      setConversation(data.conversation ?? [])
      setFields(data.fields ?? {})
      if (data.fields && typeof data.fields === 'object') {
        const next: Record<string, string> = {}
        for (const [k, v] of Object.entries(data.fields as Record<string, unknown>)) {
          const text = v == null ? '' : String(v).trim()
          if (text) next[k.replace(/_/g, ' ')] = text
        }
        setCaptured(next)
      }
      if (data.reply) setMessages((m) => [...m, { role: 'assistant', content: data.reply }])

      if (data.status === 'ready') await generate(data.fields ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  async function generate(finalFields: Record<string, unknown>) {
    setGenerating(true)
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doc_type: docType, client_id: clientId, input_data: finalFields }),
      })
      // El cuerpo puede no ser JSON si la plataforma corta la función (504 con
      // HTML): parsear a ciegas daba un "Unexpected token '<'" en la cara del
      // usuario en vez de un error legible.
      const raw = await res.text()
      let json: Record<string, unknown> = {}
      try { json = JSON.parse(raw) } catch { /* respuesta no-JSON */ }
      if (!res.ok) {
        throw new Error(
          (json.error as string) ||
            (res.status === 504
              ? 'Generation took too long and was cut off. Try a narrower topic.'
              : `Generation failed (${res.status})`)
        )
      }
      window.location.href = `/documents/${json.queue_id}`
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setGenerating(false)
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <div>
            <p className="text-sm font-semibold text-ink">Let&apos;s brief this {docLabel}</p>
            <p className="text-[11px] text-ink-tertiary">
              MIRA already knows your brand — it will only ask for what it&apos;s missing.
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="text-ink-tertiary hover:text-ink transition-colors" title="Close">
          <X size={16} />
        </button>
      </div>

      {Object.keys(captured).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(captured).map(([field, value]) => (
            <span key={field} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
              {field}: {value.length > 60 ? `${value.slice(0, 60)}…` : value}
            </span>
          ))}
        </div>
      )}

      {/* components/chat (2026-08-06): markdown + autoscroll compartidos. */}
      <ChatThread
        chatKey={`doc-guided:${docType}`}
        className="max-h-80"
        messages={messages}
        isLoading={sending || generating}
        thinkingLabel={generating ? 'Generating your document — this takes a couple of minutes…' : 'Thinking…'}
        onSelectOption={(opt) => send(opt)}
      />

      {error && (
        <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">{error}</div>
      )}

      <ChatComposer
        chatKey={`doc-guided:${docType}`}
        onSend={(text) => send(text)}
        isLoading={sending || generating}
        disabled={generating}
        clientId={clientId}
        allowAttachments={false}
        placeholder="Answer here…"
      />

      <button
        onClick={onSwitchToForm}
        disabled={generating}
        className="text-[11px] text-ink-tertiary hover:text-ink transition-colors disabled:opacity-50"
      >
        Prefer the plain form? Use it instead →
      </button>
    </div>
  )
}
