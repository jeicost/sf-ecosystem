'use client'

import { useState, useEffect } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import DocumentUploader from '@/components/document-uploader'
import DocumentList from '@/components/document-list'
import { createClient } from '@/lib/supabase'

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
      setError('No se pudieron cargar los documentos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadComplete = async (file: File) => {
    if (!docTitle.trim()) {
      setError('Por favor ingresa un título para el documento')
      return
    }

    if (!clientId) {
      setError('Cliente no identificado')
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
        throw new Error(data.error || 'Error en upload')
      }

      setDocTitle('')
      setDocTags('')
      setDocType('brand_book')
      setError(null)

      if (clientId) {
        await loadDocuments(clientId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
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
              Client Portal
            </p>
            <h1 className="text-3xl font-semibold text-ink tracking-tight mb-2">Documentación</h1>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Sube documentación de marca, productos y estrategia. Los agentes usarán esta información para generar contenido personalizado.
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
              <p className="font-medium mb-1">💡 Documentación habilitará:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Marketing Campaign Generator usa tu brand book</li>
                <li>Community Blueprint personalizado con tu estrategia</li>
                <li>Agentes generan contenido en tu tono y estilo</li>
              </ul>
            </div>
          </div>

          {/* Upload Form */}
          <div className="card px-6 py-5">
            <p className="text-sm font-semibold text-white mb-4">Subir Nuevo Documento</p>

            <div className="space-y-4">
              {/* Document Type */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="brand_book">📕 Brand Book</option>
                  <option value="product_docs">📗 Product Docs</option>
                  <option value="handbook">📙 Company Handbook</option>
                  <option value="guidelines">📋 Guidelines</option>
                  <option value="case_studies">📊 Case Studies</option>
                  <option value="other">📄 Otro</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Título del Documento</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ej: Brand Book 2026, Product Features v2.0"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-white mb-2">Tags (separados por comas, opcional)</label>
                <input
                  type="text"
                  value={docTags}
                  onChange={(e) => setDocTags(e.target.value)}
                  placeholder="Ej: brand, visual, tone, logo"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'rgba(30,41,59,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Uploader */}
              <DocumentUploader onUploadComplete={handleUploadComplete} />

              {error && (
                <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertCircle size={14} className="mt-0.5" style={{ color: '#EF4444' }} />
                  <p className="text-xs text-white">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div>
          <div className="card px-5 py-4 sticky top-8">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B5CF6' }}>
              Sobre Documentación
            </p>
            <div className="space-y-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <div>
                <p className="font-medium text-white mb-1">Formatos soportados</p>
                <p>PDF, Word (.docx), Texto (.txt)</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Tamaño máximo</p>
                <p>50 MB por archivo</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Indexación automática</p>
                <p>Los docs se indexan para búsqueda semántica al subir</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Privacidad</p>
                <p>Solo tú y tus agentes pueden acceder estos docs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Documentos Actuales</h2>
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