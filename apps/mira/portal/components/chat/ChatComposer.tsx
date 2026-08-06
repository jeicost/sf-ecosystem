'use client'

import { useRef, useState } from 'react'
import { Loader2, Paperclip, Send, Square, X } from 'lucide-react'
import type { Attachment } from '@/lib/attachments'

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
}

const MAX_ATTACHMENTS = 5

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
}: Props) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const autoGrow = () => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const send = () => {
    const text = value.trim()
    // Guarda real: sin esto, dos Enter seguidos lanzaban dos peticiones.
    if (isLoading || uploading || disabled) return
    if (!text && attachments.length === 0) return
    onSend(text, attachments.length ? attachments : undefined)
    setValue('')
    setAttachments([])
    requestAnimationFrame(() => {
      if (textRef.current) textRef.current.style.height = 'auto'
    })
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !clientId) return
    setUploadError(null)

    // Comprobación en cliente ANTES de subir: si el fichero pasa de 4 MB,
    // Vercel corta la petición con un 413 crudo y el usuario no recibe ningún
    // mensaje útil. Mejor decírselo aquí, con el nombre y el tamaño reales.
    const tooBig = Array.from(files).find((f) => f.size > 4 * 1024 * 1024)
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
      Array.from(files)
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

  return (
    <div className="border-t border-line bg-card px-4 py-3">
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
              title="Attach images or documents"
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
            autoGrow()
          }}
          onKeyDown={(e) => {
            // Enter envía, Shift+Enter salto de línea — el estándar que todo
            // el mundo espera de un chat.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-ink-tertiary outline-none transition-colors focus:border-ink-muted disabled:opacity-50"
        />

        {isLoading && onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            title="Stop generating"
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
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
