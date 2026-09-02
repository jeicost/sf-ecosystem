'use client'

import { useEffect, useRef, useState } from 'react'
import { Paperclip, X, Loader2, FileText, Image as ImageIcon, HardDrive } from 'lucide-react'
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
  /**
   * Botón «Desde Drive»: adjuntar documentos ya sincronizados del Drive del
   * cliente (agent_documents) sin re-subirlos. Opt-in — hoy lo enciende el
   * editor de documentos (nota del CEO de julio).
   */
  driveEnabled?: boolean
}

interface DriveFileRow {
  id: string
  title: string | null
  original_filename: string | null
  file_mime_type: string | null
  file_size: number | null
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
  driveEnabled = false,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { locale } = useLocaleContext()

  // ── Picker de Drive ──
  const [driveOpen, setDriveOpen] = useState(false)
  const [driveFiles, setDriveFiles] = useState<DriveFileRow[] | null>(null)
  const [driveQuery, setDriveQuery] = useState('')
  const [driveBusy, setDriveBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!driveOpen || !clientId || driveFiles !== null) return
    fetch(`/api/attachments/drive-files?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setDriveFiles(Array.isArray(json?.files) ? json.files : []))
      .catch(() => setDriveFiles([]))
  }, [driveOpen, clientId, driveFiles])

  const attachFromDrive = async (docId: string) => {
    if (!clientId || driveBusy) return
    setDriveBusy(docId)
    setError(null)
    try {
      const res = await fetch('/api/attachments/from-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, docId }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.attachment) throw new Error(json?.error || t('qa.drive-error', locale))
      onChange([...attachments, json.attachment as Attachment])
      setDriveOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('qa.drive-error', locale))
    } finally {
      setDriveBusy(null)
    }
  }

  const visibleDriveFiles = (driveFiles ?? [])
    .filter((f) => !imagesOnly || String(f.file_mime_type || '').startsWith('image/'))
    .filter((f) => {
      const q = driveQuery.trim().toLowerCase()
      if (!q) return true
      return `${f.title || ''} ${f.original_filename || ''}`.toLowerCase().includes(q)
    })

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
        {driveEnabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation() // el contenedor abre el file input
              if (!disabled) setDriveOpen(true)
            }}
            className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-ink-secondary hover:text-ink hover:bg-surface transition-colors"
          >
            <HardDrive size={13} />
            {t('qa.attach-drive', locale)}
          </button>
        )}
      </div>

      {driveEnabled && driveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDriveOpen(false)}>
          <div
            className="w-full max-w-lg max-h-[70vh] flex flex-col rounded-xl border border-line bg-card p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{t('qa.drive-modal-title', locale)}</h3>
              <button type="button" onClick={() => setDriveOpen(false)} className="text-ink-tertiary hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              value={driveQuery}
              onChange={(e) => setDriveQuery(e.target.value)}
              placeholder={t('qa.drive-search', locale)}
              className="mb-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-purple-500"
            />
            <div className="min-h-[120px] flex-1 space-y-1 overflow-y-auto">
              {driveFiles === null ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin text-ink-tertiary" />
                </div>
              ) : visibleDriveFiles.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-ink-tertiary">{t('qa.drive-empty', locale)}</p>
              ) : (
                visibleDriveFiles.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => attachFromDrive(f.id)}
                    disabled={driveBusy !== null}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface disabled:opacity-60"
                  >
                    {driveBusy === f.id ? (
                      <Loader2 size={14} className="animate-spin flex-shrink-0 text-ink-tertiary" />
                    ) : String(f.file_mime_type || '').startsWith('image/') ? (
                      <ImageIcon size={14} className="flex-shrink-0 text-ink-tertiary" />
                    ) : (
                      <FileText size={14} className="flex-shrink-0 text-ink-tertiary" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                      {f.title || f.original_filename}
                    </span>
                    {f.file_size ? (
                      <span className="flex-shrink-0 font-mono text-[10px] text-ink-tertiary">
                        {(f.file_size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
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
