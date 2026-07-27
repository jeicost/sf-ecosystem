'use client'

import { useState, useEffect } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import DocumentUploader from '@/components/document-uploader'
import DocumentList from '@/components/document-list'
import { createClient } from '@/lib/supabase'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

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

export default function DocumentationPage() {
  const { locale } = useLocaleContext()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [docType, setDocType] = useState('brand_book')
  const [docTitle, setDocTitle] = useState('')
  const [docTags, setDocTags] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const db = createClient()
        const { data: { user } } = await db.auth.getUser()
        if (!user) return

        const meta = user.user_metadata || {}
        let cId = meta.client_id

        if (!cId) {
          const { data: access } = await db
            .from('mira_project_access')
            .select('project_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()
          cId = access?.project_id
        }

        setClientId(cId)
        if (cId) {
          loadDocuments(cId)
        }
      } catch (error) {
        console.error('Error fetching client ID:', error)
      }
    }

    fetchClientId()
  }, [])

  const loadDocuments = async (cId: string) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/client/documentation?client_id=${cId}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (err) {
      console.error('Error loading documents:', err)
      setError(t('portal.docs.load-error', locale))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadComplete = async (file: File) => {
    if (!docTitle.trim()) {
      setError(t('portal.docs.title-required', locale))
      return
    }

    if (!clientId) {
      setError(t('portal.docs.client-not-identified', locale))
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('client_id', clientId)
      formData.append('title', docTitle)
      formData.append('doc_type', docType)
      formData.append('tags', docTags)

      const res = await fetch('/api/client/documentation/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('portal.docs.upload-error', locale))
      }

      setDocTitle('')
      setDocTags('')
      setDocType('brand_book')
      setError(null)

      if (clientId) {
        await loadDocuments(clientId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('portal.docs.unknown-error', locale))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/client/documentation/${id}`, {
        method: 'DELETE',
      })
      if (res.ok && clientId) {
        await loadDocuments(clientId)
      }
    } catch (err) {
      console.error('Error deleting document:', err)
    }
  }

  const handlePreview = (id: string) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      window.open(`/api/client/documentation/${id}/preview`, '_blank')
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(139,92,246,0.8)' }}>
              {t('portal.docs.eyebrow', locale)}
            </p>
            <h1 className="text-3xl font-semibold text-ink tracking-tight mb-2">{t('portal.docs.title', locale)}</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              {t('portal.docs.subtitle', locale)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="col-span-2 space-y-6">
          {/* Warnings */}
          <div className="p-4 rounded-lg flex gap-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <AlertCircle size={16} className="mt-0.5" style={{ color: '#3B82F6' }} />
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <p className="font-medium mb-1">💡 {t('portal.docs.enables-title', locale)}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t('portal.docs.enables-1', locale)}</li>
                <li>{t('portal.docs.enables-2', locale)}</li>
                <li>{t('portal.docs.enables-3', locale)}</li>
              </ul>
            </div>
          </div>

          {/* Upload Form */}
          <div className="card px-6 py-5">
            <p className="text-sm font-semibold text-ink mb-4">{t('portal.docs.upload-new', locale)}</p>

            <div className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-xs font-medium text-ink mb-2">{t('portal.docs.doc-type', locale)}</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                >
                  <option value="brand_book">📕 {t('portal.docs.type-brand-book', locale)}</option>
                  <option value="product_docs">📗 {t('portal.docs.type-product-docs', locale)}</option>
                  <option value="handbook">📙 {t('portal.docs.type-handbook', locale)}</option>
                  <option value="guidelines">📋 {t('portal.docs.type-guidelines', locale)}</option>
                  <option value="case_studies">📊 {t('portal.docs.type-case-studies', locale)}</option>
                  <option value="other">📄 {t('portal.docs.type-other', locale)}</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-ink mb-2">{t('portal.docs.doc-title', locale)}</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder={t('portal.docs.doc-title-placeholder', locale)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-ink mb-2">{t('portal.docs.tags-label', locale)}</label>
                <input
                  type="text"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  placeholder={t('portal.docs.tags-placeholder', locale)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                />
              </div>

              {/* Uploader */}
              <DocumentUploader onUploadComplete={handleUploadComplete} />

              {error && (
                <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={14} className="mt-0.5" style={{ color: '#EF4444' }} />
                  <p className="text-xs text-ink">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div>
          <div className="card px-5 py-4 sticky top-8">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
              {t('portal.docs.about', locale)}
            </p>
            <div className="space-y-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <div>
                <p className="font-medium text-ink mb-1">{t('portal.docs.formats', locale)}</p>
                <p>{t('portal.docs.formats-value', locale)}</p>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">{t('portal.docs.max-size', locale)}</p>
                <p>{t('portal.docs.max-size-value', locale)}</p>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">{t('portal.docs.indexing', locale)}</p>
                <p>{t('portal.docs.indexing-value', locale)}</p>
              </div>
              <div>
                <p className="font-medium text-ink mb-1">{t('portal.docs.privacy', locale)}</p>
                <p>{t('portal.docs.privacy-value', locale)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-ink mb-4">{t('portal.docs.current', locale)}</h2>
        <DocumentList
          documents={documents}
          onDelete={handleDelete}
          onPreview={handlePreview}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
