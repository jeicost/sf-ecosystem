'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Paperclip, Send, Square, X } from 'lucide-react'
import type { Attachment } from '@/lib/attachments'
import { useChatHistory } from '@/lib/hooks/useChatHistory'
import { onComposerLoad } from '@/lib/chat-bus'

interface Props {
  onSend: (message: string, attachments?: Attachment[]) => void
  onCancel?: () => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  /** Cliente activo — necesario para subir adjuntos al bucket correcto */
  clientId?: string
  /** Desactiva el botón de adjuntar (chats que aún no los aceptan) */
  allowAttachments?: boolean
  accent?: string
  /**
   * Identifica ESTE chat. De él cuelgan el historial de ↑/↓, el borrador que
   * sobrevive a la navegación y el puente de "editar mi último mensaje".
   * Dos chats distintos deben pasar claves distintas.
   */
  chatKey?: string
  /** Oculta la línea de atajos de teclado (chats muy estrechos) */
  hideHints?: boolean
}

const MAX_ATTACHMENTS = 5
const MAX_HEIGHT = 320

/**
 * Composer del chat: textarea que crece, adjuntos con vista previa y cancelar.
 *
 * Lo que arregla respecto a lo que había:
 *  · Era un `<input type="text">` de una línea — no se podía escribir un brief
 *    de varias líneas ni ver lo que llevabas escrito.
 *  · No había forma de adjuntar nada en el chat de departamento ni en el del
 *    Brand Brain, y en el de agente las imágenes se rechazaban.
 *  · No se podía cancelar una respuesta a medias, aunque `useAgentChat` ya
 *    exponía `cancel()` desde hace tiempo y nadie lo usaba.
 *  · No había guarda de envío: se podían disparar peticiones concurrentes
 *    pulsando Enter dos veces.
 *
 * ─── PARIDAD CON VS CODE (2026-08-24) ───────────────────────────────────
 * Un chat no es un formulario: se usa a ráfagas, corrigiendo el prompt
 * anterior. Los gestos que la gente ya tiene en los dedos y aquí faltaban:
 *
 *  · ↑ / ↓ recuperan lo que enviaste antes (useChatHistory), como en el
 *    terminal integrado. Solo se activan con el cursor en la primera/última
 *    línea, así que editar un mensaje de varias líneas sigue funcionando.
 *  · Esc detiene la generación en curso; si no hay ninguna, sale del historial
 *    y te devuelve el borrador que estabas escribiendo.
 *  · Cmd/Ctrl+Enter envía también desde dentro de un párrafo largo.
 *  · El borrador se guarda: cambiar de pestaña o recargar ya no lo tira.
 *  · Se puede arrastrar y soltar ficheros sobre el composer.
 */
export default function ChatComposer({
  onSend,
  onCancel,
  isLoading,
  disabled,
  placeholder = 'Type what you need…',
  clientId,
  allowAttachments = true,
  accent = '#A855F7',
  chatKey = 'default',
  hideHints,
}: Props) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const history = useChatHistory(chatKey)
  const draftKey = `mira_chat_draft:${chatKey}`

  const autoGrow = () => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }

  /** Escribe en el input y deja el cursor al final (lo que espera ↑ y editar). */
  const load = (text: string) => {
    setValue(text)
    requestAnimationFrame(() => {
      const el = textRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(text.length, text.length)
      autoGrow()
    })
  }

  // Borrador persistente: irse a otra pestaña del portal a mirar un dato y
  // volver ya no cuesta el mensaje a medio escribir.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(draftKey)
      if (saved) load(saved)
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  useEffect(() => {
    try {
      if (value) window.localStorage.setItem(draftKey, value)
      else window.localStorage.removeItem(draftKey)
    } catch { /* noop */ }
  }, [value, draftKey])

  // "Editar" en un mensaje del hilo lo devuelve aquí.
  useEffect(() => onComposerLoad(chatKey, load), [chatKey])

  useEffect(autoGrow, [value])

  const send = () => {
    const text = value.trim()
    // Guarda real: sin esto, dos Enter seguidos lanzaban dos peticiones.
    if (isLoading || uploading || disabled) return
    if (!text && attachments.length === 0) return
    history.push(text)
    onSend(text, attachments.length ? attachments : undefined)
    setValue('')
    setAttachments([])
    requestAnimationFrame(() => {
      if (textRef.current) textRef.current.style.height = 'auto'
    })
  }

  const handleFiles = async (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : []
    if (!list.length || !clientId) return
    setUploadError(null)

    // Comprobación en cliente ANTES de subir: si el fichero pasa de 4 MB,
    // Vercel corta la petición con un 413 crudo y el usuario no recibe ningún
    // mensaje útil. Mejor decírselo aquí, con el nombre y el tamaño reales.
    const tooBig = list.find((f) => f.size > 4 * 1024 * 1024)
    if (tooBig) {
      setUploadError(
        `"${tooBig.name}" is ${(tooBig.size / 1024 / 1024).toFixed(1)} MB — the limit is 4 MB. Resize it and try again.`
      )
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      list
        .slice(0, MAX_ATTACHMENTS - attachments.length)
        .forEach((f) => form.append('files', f))
      form.append('prefix', 'quick-actions')
      // El endpoint lee clientId del FORM, no de la query string.
      form.append('clientId', clientId)

      const res = await fetch('/api/attachments/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          data.error ||
            (res.status === 413
              ? 'That file is too large. Try one under 4 MB.'
              : `Upload failed (${res.status})`)
        )
      }
      const uploaded: Attachment[] = data.attachments || []
      setAttachments((prev) => [...prev, ...uploaded].slice(0, MAX_ATTACHMENTS))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget

    // Enter envía, Shift+Enter salto de línea — el estándar que todo el mundo
    // espera de un chat. Cmd/Ctrl+Enter envía desde cualquier punto del texto.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
      return
    }

    if (e.key === 'Escape') {
      if (isLoading && onCancel) {
        e.preventDefault()
        onCancel()
      } else if (history.navigating) {
        e.preventDefault()
        history.reset()
        load('')
      }
      return
    }

    // ↑ / ↓ solo capturan cuando no queda texto por encima/por debajo del
    // cursor: dentro de un mensaje de varias líneas siguen moviendo el cursor.
    const caretAtStart = el.selectionStart === el.selectionEnd && !el.value.slice(0, el.selectionStart).includes('\n')
    const caretAtEnd = el.selectionStart === el.selectionEnd && !el.value.slice(el.selectionStart).includes('\n')

    if (e.key === 'ArrowUp' && caretAtStart) {
      const recalled = history.recallPrev(value)
      if (recalled !== null) {
        e.preventDefault()
        load(recalled)
      }
      return
    }
    if (e.key === 'ArrowDown' && caretAtEnd && history.navigating) {
      const recalled = history.recallNext()
      if (recalled !== null) {
        e.preventDefault()
        load(recalled)
      }
    }
  }

  return (
    <div
      className={`border-t bg-card px-4 py-3 transition-colors ${dragging ? 'border-purple-500 bg-purple-500/5' : 'border-line'}`}
      onDragOver={(e) => {
        if (!allowAttachments || !clientId) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (!allowAttachments || !clientId) return
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div
              key={`${a.url}-${i}`}
              className="group relative flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1"
            >
              {a.type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.name} className="h-8 w-8 rounded object-cover" />
              ) : (
                <Paperclip size={12} className="text-ink-tertiary" />
              )}
              <span className="max-w-[140px] truncate text-[11px] text-ink-secondary">{a.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-ink-tertiary hover:text-ink"
                aria-label={`Remove ${a.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="mb-2 text-[11px] text-red-400">{uploadError}</p>}

      <div className="flex items-end gap-2">
        {allowAttachments && clientId && (
          <>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.txt,.md,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || attachments.length >= MAX_ATTACHMENTS}
              title="Attach images or documents (or drop them here)"
              className="shrink-0 rounded-lg border border-line bg-surface p-2 text-ink-tertiary transition-colors hover:text-ink disabled:opacity-40"
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
          </>
        )}

        <textarea
          ref={textRef}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value)
            // Escribir sobre un mensaje recuperado sale del historial: a partir
            // de ahí ↓ ya no debe pisarte lo que estás editando.
            if (history.navigating) history.reset()
          }}
          onPaste={(e) => {
            // Pegar una captura del portapapeles la sube como adjunto, en vez
            // de no hacer nada como hasta ahora.
            const files = Array.from(e.clipboardData.files || [])
            if (files.length && allowAttachments && clientId) {
              e.preventDefault()
              handleFiles(files)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none transition-colors focus:border-ink-muted disabled:opacity-50"
        />

        {isLoading && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            title="Stop generating (Esc)"
            className="shrink-0 rounded-lg border border-line bg-surface p-2 text-ink-secondary transition-colors hover:text-ink"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={isLoading || uploading || disabled || (!value.trim() && attachments.length === 0)}
            className="shrink-0 rounded-lg p-2 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: accent }}
            aria-label="Send"
            title="Send (Enter)"
          >
            <Send size={16} />
          </button>
        )}
      </div>

      {!hideHints && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 px-0.5 text-[10px] text-ink-tertiary">
          <span><Key>Enter</Key> send</span>
          <span><Key>Shift</Key>+<Key>Enter</Key> new line</span>
          {history.size > 0 && <span><Key>↑</Key> last message</span>}
          {isLoading && <span><Key>Esc</Key> stop</span>}
        </p>
      )}
    </div>
  )
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1 py-px font-sans text-[10px] text-ink-secondary">
      {children}
    </kbd>
  )
}
