'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Check, Copy, Paperclip, Pencil, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import ChatMarkdown from './ChatMarkdown'
import type { Attachment } from '@/lib/attachments'
import { loadIntoComposer } from '@/lib/chat-bus'

export interface ChatThreadMessage {
  role: 'user' | 'assistant'
  content: string
  attachments?: Attachment[]
  options?: string[]
  feedback?: 'helpful' | 'not_helpful'
}

interface Props {
  messages: ChatThreadMessage[]
  isLoading?: boolean
  /** Mensaje de error del último intento, si lo hubo */
  error?: string | null
  emptyState?: React.ReactNode
  /** Alto del hilo. Por defecto crece con el contenedor. */
  className?: string
  onSelectOption?: (option: string) => void
  onRetry?: () => void
  onFeedback?: (index: number, value: 'helpful' | 'not_helpful') => void
  thinkingLabel?: string
  /** Misma clave que el ChatComposer de al lado: habilita "editar mensaje". */
  chatKey?: string
}

/**
 * Hilo de conversación con autoscroll que respeta al usuario.
 *
 * El autoscroll de aquí resuelve dos cosas que faltaban:
 *  · Los dos chats principales (departamento y /agent/[role]) no tenían NINGÚN
 *    scroll: el contenedor era `overflow-y-auto` de altura fija y a partir del
 *    segundo mensaje ya no veías la respuesta.
 *  · Y el scroll ciego tampoco vale: si estás leyendo hacia arriba mientras el
 *    modelo sigue escribiendo, saltar al final cada token es insoportable. Solo
 *    se sigue el streaming si ya estabas abajo; si no, aparece un botón para
 *    bajar cuando tú quieras.
 */
export default function ChatThread({
  messages,
  isLoading,
  error,
  emptyState,
  className = 'flex-1 min-h-0',
  onSelectOption,
  onRetry,
  onFeedback,
  thinkingLabel = 'Thinking…',
  chatKey,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [stickToBottom, setStickToBottom] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Copiar la respuesta es la acción más frecuente de todas: es contenido que
  // se va a pegar en Instagram, en un email o en un doc. No había forma de
  // hacerlo sin seleccionar a mano y arrastrar sobre las burbujas.
  const copy = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 1500)
    } catch { /* sin permiso de portapapeles no hay nada que hacer */ }
  }

  // "Pegado al final" con margen de 80px: los navegadores no siempre dan un
  // scrollTop exacto y un pixel de diferencia no debe desactivar el seguimiento.
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setStickToBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }

  useEffect(() => {
    if (!stickToBottom) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading, stickToBottom])

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setStickToBottom(true)
  }

  const lastAssistantIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === 'assistant') return i
    return -1
  })()

  return (
    <div className={`relative ${className}`}>
      <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && emptyState}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          const isStreamingThis = isLoading && idx === messages.length - 1 && !isUser
          const showOptions =
            !isUser && !isStreamingThis && idx === lastAssistantIndex && (msg.options?.length ?? 0) > 0

          return (
            <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={
                  isUser
                    ? 'max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-surface-hover text-ink border border-line'
                    : 'max-w-[92%] rounded-2xl rounded-bl-sm px-4 py-2.5 bg-surface text-ink-secondary border border-line'
                }
              >
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {msg.attachments.map((a, i) =>
                      a.type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={a.url}
                          alt={a.name}
                          className="h-20 w-20 rounded-lg object-cover border border-line"
                        />
                      ) : (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full border border-line bg-page px-2 py-0.5 text-[11px] text-ink-tertiary"
                        >
                          <Paperclip size={10} /> {a.name}
                        </span>
                      )
                    )}
                  </div>
                )}

                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                ) : (
                  <ChatMarkdown content={msg.content} />
                )}

                {isStreamingThis && (
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-ink-tertiary" />
                )}
              </div>

              {showOptions && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.options!.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onSelectOption?.(opt)}
                      className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium text-ink-secondary bg-surface border border-line hover:text-ink hover:border-purple-400/40 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {msg.content && !isStreamingThis && (
                <div className={`mt-1 flex items-center gap-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <button
                    type="button"
                    onClick={() => copy(idx, msg.content)}
                    aria-label="Copy message"
                    title="Copy"
                    className="p-1 rounded text-ink-tertiary opacity-40 transition-opacity hover:opacity-100"
                  >
                    {copiedIndex === idx ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>

                  {isUser && chatKey && (
                    <button
                      type="button"
                      onClick={() => loadIntoComposer(chatKey, msg.content)}
                      aria-label="Edit and resend"
                      title="Edit and resend"
                      className="p-1 rounded text-ink-tertiary opacity-40 transition-opacity hover:opacity-100"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              )}

              {!isUser && msg.content && !isStreamingThis && onFeedback && (
                <div className="-mt-1 flex items-center gap-1 px-1">
                  <button
                    type="button"
                    aria-label="Helpful"
                    onClick={() => onFeedback(idx, 'helpful')}
                    className="p-1 rounded transition-opacity hover:opacity-100"
                    style={{
                      opacity: msg.feedback === 'helpful' ? 1 : 0.35,
                      color: msg.feedback === 'helpful' ? '#22C55E' : 'var(--text-secondary)',
                    }}
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Not helpful"
                    onClick={() => onFeedback(idx, 'not_helpful')}
                    className="p-1 rounded transition-opacity hover:opacity-100"
                    style={{
                      opacity: msg.feedback === 'not_helpful' ? 1 : 0.35,
                      color: msg.feedback === 'not_helpful' ? '#EF4444' : 'var(--text-secondary)',
                    }}
                  >
                    <ThumbsDown size={13} />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-ink-tertiary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-tertiary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-ink-tertiary animate-bounce" />
            </span>
            {thinkingLabel}
          </div>
        )}

        {/* Error con reintento: ninguno de los 8 chats lo tenía — un fallo de
            red dejaba un "❌ Error" en el hilo y a reescribir el mensaje. */}
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-300">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1 text-xs text-red-200 hover:bg-red-500/15 transition-colors"
              >
                <RefreshCw size={11} /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      {!stickToBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to latest"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-card p-2 shadow-lg hover:bg-surface-hover transition-colors"
        >
          <ArrowDown size={14} className="text-ink-secondary" />
        </button>
      )}
    </div>
  )
}
