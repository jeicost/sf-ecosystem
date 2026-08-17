'use client'

import { useRef, useState } from 'react'
import { Paperclip, X, Loader2, FileText, Image as ImageIcon } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { uploadFilesToBucket } from '@/lib/attachments-client'
import type { Attachment } from '@/lib/attachments'

interface AttachmentDropzoneProps {
  clientId: string | null
  attachments: Attachment[]
  onChange: (attachments: Attachment[]) => void
  /** Restringe a imágenes (p.ej. editar_imagen_visual, donde la imagen origen ES el adjunto) */
  imagesOnly?: boolean
  disabled?: boolean
  /**
   * Carpeta dentro de brand-assets/{clientId}/ donde se guardan. Por defecto
   * 'quick-actions' (el primer sitio que montó este componente); el editor de
   * documentos usa 'documents'. Tiene que estar en ALLOWED_PREFIXES de
   * app/api/attachments/upload o el servidor lo cambia a 'assets' en silencio.
   */
  prefix?: 'quick-actions' | 'business-reports' | 'onboarding' | 'documents' | 'assets'
}

// Lo que se puede subir. Tiene que coincidir con isAllowedMime() en
// app/api/attachments/upload/route.ts: DOCX y PPTX entraron el 2026-08-17
// (el CEO intentó adjuntar una presentación y el servidor devolvía 415).
const ACCEPT_ALL = 'image/*,.pdf,.txt,.md,.csv,.docx,.pptx'

export function AttachmentDropzone({
  clientId,
  attachments,
  onChange,
  imagesOnly = false,
  disabled = false,
  prefix = 'quick-actions',
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { locale } = useLocaleContext()

  const handleFiles = async (files: File[]) => {
    if (!clientId || files.length === 0 || disabled) return
    const accepted = imagesOnly ? files.filter((f) => f.type.startsWith('image/')) : files
    if (accepted.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadFilesToBucket(clientId, accepted, prefix)
      onChange([...attachments, ...uploaded])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(Array.from(e.dataTransfer.files))
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer transition-colors text-sm ${
          dragOver ? 'border-purple-400 bg-purple-500/10' : 'border-border text-ink-secondary hover:border-purple-400/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        <span>{t(imagesOnly ? 'qa.attach-image' : 'qa.attach-files', locale)}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple={!imagesOnly}
        hidden
        accept={imagesOnly ? 'image/*' : ACCEPT_ALL}
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <span
              key={`${att.url}-${i}`}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface text-xs text-ink-secondary"
            >
              {att.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
              <span className="max-w-[140px] truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                className="hover:text-ink"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
