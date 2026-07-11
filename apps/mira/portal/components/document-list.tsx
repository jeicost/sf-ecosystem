'use client'

import { useState } from 'react'
import { Trash2, Eye, FileText, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Document {
  id: string
  title: string
  doc_type: string
  file_size: number
  file_mime_type: string
  tags: string[]
  uploaded_at: string
  is_indexed: boolean
}

interface DocumentListProps {
  documents: Document[]
  onDelete: (id: string) => void
  onPreview: (id: string) => void
  isLoading?: boolean
}

const DOC_TYPE_LABELS: Record<string, {label: string, icon: string}> = {
  brand_book: { label: 'Brand Book', icon: '📕' },
  product_docs: { label: 'Product Docs', icon: '📗' },
  handbook: { label: 'Handbook', icon: '📙' },
  guidelines: { label: 'Guidelines', icon: '📋' },
  case_studies: { label: 'Case Studies', icon: '📊' },
  other: { label: 'Otro', icon: '📄' },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

export default function DocumentList({
  documents,
  onDelete,
  onPreview,
  isLoading = false,
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white/3 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          No hay documentos subidos aún
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map(doc => {
        const docTypeInfo = DOC_TYPE_LABELS[doc.doc_type as keyof typeof DOC_TYPE_LABELS] || DOC_TYPE_LABELS.other
        const relativeTime = formatDistanceToNow(new Date(doc.uploaded_at), { locale: es, addSuffix: true })

        return (
          <div
            key={doc.id}
            className="card px-4 py-3 flex items-start justify-between group hover:bg-white/6 transition-all"
          >
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{docTypeInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {docTypeInfo.label} • {formatFileSize(doc.file_size)}
                  </p>
                </div>
                {doc.is_indexed && (
                  <span className="text-[9px] px-2 py-1 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
                    ✓ Indexado
                  </span>
                )}
              </div>

              {/* Tags & Time */}
              {doc.tags.length > 0 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {doc.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      +{doc.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <Calendar size={12} />
                <span>{relativeTime}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="ml-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onPreview(doc.id)}
                className="p-2 rounded-lg hover:bg-white/5 transition-all"
                title="Vista previa"
              >
                <Eye size={14} style={{ color: '#8B5CF6' }} />
              </button>
              <button
                onClick={() => {
                  setDeletingId(doc.id)
                  setTimeout(() => onDelete(doc.id), 300)
                }}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-all"
                title="Eliminar"
              >
                <Trash2 size={14} style={{ color: deletingId === doc.id ? '#EF4444' : 'rgba(255,255,255,0.3)' }} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
