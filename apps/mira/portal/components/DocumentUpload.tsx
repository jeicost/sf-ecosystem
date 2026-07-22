'use client'

import { useState, useEffect } from 'react'
import { useActiveClient } from '@/lib/client-context'
import { Upload, Trash2, File, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface Document {
  id: string
  doc_type: string
  title: string
  description: string | null
  file_size: number
  uploaded_at: string
  original_filename: string
}

export default function DocumentUpload() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [docType, setDocType] = useState('brand-book')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents')
      if (!res.ok) throw new Error('Failed to fetch documents')
      const { data } = await res.json()
      setDocuments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: any) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const file = files[0]
      const fileName = file.name
      const fileSize = file.size
      const fileMimeType = file.type

      // Upload file to Supabase Storage
      const formData = new FormData()
      formData.append('file', file)
      formData.append('docType', docType)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to upload document')
      }

      const { fileUrl, documentId } = await res.json()

      // Save document metadata with real URL
      const metaRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: documentId,
          doc_type: docType,
          title: fileName.replace(/\.[^/.]+$/, ''),
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          file_url: fileUrl,
          file_size: fileSize,
          file_mime_type: fileMimeType,
          original_filename: fileName,
        }),
      })

      if (!metaRes.ok) {
        throw new Error('Failed to save document metadata')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete document')
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(59,130,246,0.8)', letterSpacing: '0.12em' }}>
          DOCUMENTATION
        </p>
        <h1 className="text-2xl font-semibold text-ink tracking-tight">Document Library</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Upload brand documents, handbooks, and reference materials. These guide AI generation.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="card p-4 border-red-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-sm text-ink-secondary mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="card p-4 border-green-500/20 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} style={{ color: '#22C55E' }} />
            <div>
              <p className="font-semibold text-green-400">Upload successful</p>
              <p className="text-sm text-ink-secondary mt-1">Document added to your library</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="card p-8 mb-8 border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 transition-colors"
        onDragOver={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFileUpload(e.dataTransfer.files)
        }}
        style={{ borderColor: isDragging ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.3)' }}
      >
        <div className="text-center">
          <Upload size={40} className="text-purple-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-ink mb-1">Upload Document</h3>
          <p className="text-sm text-ink-secondary mb-4">Drag and drop or click to browse</p>

          <div className="flex gap-3 mb-4">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="px-3 py-2 bg-surface border border-line rounded-lg text-ink text-sm"
            >
              <option value="brand-book">Brand Book</option>
              <option value="handbook">Handbook</option>
              <option value="product-doc">Product Documentation</option>
              <option value="marketing">Marketing Materials</option>
              <option value="other">Other</option>
            </select>

            <label className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer">
              <input
                type="file"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
                className="hidden"
              />
              Choose File
            </label>
          </div>

          {uploading && (
            <div className="flex items-center justify-center gap-2 text-sm text-purple-400">
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div>
        <h2 className="text-lg font-semibold text-ink mb-4">Library ({documents.length} documents)</h2>

        {loading ? (
          <div className="card p-8 text-center">
            <Loader2 size={32} className="animate-spin text-purple-400 mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <div className="card p-8 text-center">
            <File size={40} className="text-ink-tertiary mx-auto mb-3" />
            <p className="text-ink-secondary">No documents yet. Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="card px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors group">
                <div className="flex items-center gap-3 flex-1">
                  <File size={20} className="text-purple-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{doc.title}</p>
                    <div className="flex gap-2 text-xs text-ink-tertiary">
                      <span>{doc.doc_type}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploaded_at)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-lg text-ink-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
