'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Loader2, Check, AlertCircle, X } from 'lucide-react'
import { useAgentChat } from '@/lib/hooks/useAgentChat'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface AgentWorkspaceProps {
  role: string
  agentName: string
  agentEmoji: string
  color: string
  gradient: string
  title: string
  description: string
  placeholder: string
  quickPrompts: Array<{ label: string; prompt: string }>
}

export default function AgentWorkspace({
  role,
  agentName,
  agentEmoji,
  color,
  gradient,
  title,
  description,
  placeholder,
  quickPrompts,
}: AgentWorkspaceProps) {
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()

  const { messages, isLoading, sendMessage, cancel } = useAgentChat({
    role,
    clientId: activeClient?.id || '',
  })

  // Load documents on mount
  useEffect(() => {
    if (!activeClient?.id) return
    const loadDocuments = async () => {
      try {
        const res = await fetch(`/api/agent/${role}/documents?clientId=${activeClient.id}`)
        if (res.ok) {
          const { data } = await res.json()
          setDocuments(data || [])
        }
      } catch (err) {
        console.error('Failed to load documents:', err)
      }
    }
    loadDocuments()
  }, [activeClient?.id, role])

  // El autoscroll ahora lo gestiona ChatThread (y a diferencia de este, no
  // arrastra al usuario al final si ha subido a leer mientras el modelo
  // escribe).

  const handleSendMessage = async (message: string) => {
    setShowQuickPrompts(false)
    await sendMessage(message)
  }

  const handleQuickPrompt = async (prompt: string) => {
    setShowQuickPrompts(false)
    await sendMessage(prompt)
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeClient?.id) return

    setUploading(true)
    setDocError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', activeClient.id)

      const res = await fetch(`/api/agent/${role}/upload-document`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || t('agent-workspace.upload-error-fallback', locale))
      }

      const { data: newDoc } = await res.json()
      setDocuments([...documents, newDoc])

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setDocError(err instanceof Error ? err.message : t('agent-workspace.upload-failed-fallback', locale))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border border-line rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-line bg-surface">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{agentEmoji}</span>
          <div>
            <h3 className="font-semibold text-ink">{agentName}</h3>
            <p className="text-xs text-ink-tertiary">
              {title}
            </p>
          </div>
        </div>
        <p className="text-xs text-ink-muted">
          {description}
        </p>
      </div>

      {/* Hilo migrado a components/chat (2026-08-06): markdown real, autoscroll
          que respeta al usuario y opciones clicables. Se conserva a propósito
          el composer propio de abajo con su botón de subida: aquí el fichero
          va a la BIBLIOTECA del agente (agent_documents, conocimiento
          persistente), que es una función distinta de adjuntar una imagen a un
          mensaje concreto — cambiarlo por el composer compartido habría
          eliminado esa función sin pedirlo nadie. */}
      <ChatThread
        messages={messages}
        isLoading={isLoading}
        chatKey={`agent-workspace:${role}`}
        onSelectOption={(opt) => handleQuickPrompt(opt)}
        emptyState={
          showQuickPrompts ? (
            <div className="flex flex-col h-full items-center justify-center text-center space-y-4">
              <div className="text-4xl">{agentEmoji}</div>
              <div>
                <p className="text-sm text-ink font-medium mb-1">{title}</p>
                <p className="text-xs text-ink-secondary">{placeholder}</p>
              </div>

              {quickPrompts.length > 0 && (
                <div className="mt-6 grid gap-2 w-full max-w-sm">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-2">
                    {t('agent-workspace.quick-prompts-label', locale)}
                  </p>
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickPrompt(qp.prompt)}
                      disabled={isLoading}
                      className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={{ background: `${color}15`, color: color, border: `1px solid ${color}30` }}
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null
        }
      />

      {/* Documents Section */}
      {documents.length > 0 && (
        <div className="px-4 py-3 border-t border-line bg-surface">
          <button
            onClick={() => setShowDocuments(!showDocuments)}
            className="text-xs font-medium text-ink flex items-center gap-2 mb-2 hover:text-ink-secondary"
          >
            {t('agent-workspace.documents-count', locale).replace('{count}', String(documents.length))} {showDocuments ? '▼' : '▶'}
          </button>
          {showDocuments && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 bg-surface-hover rounded text-xs">
                  <div className="flex-1">
                    <p className="text-ink truncate">{doc.original_filename}</p>
                    <p className="text-ink-tertiary">{doc.document_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.analysis_status === 'completed' && (
                      <Check size={14} className="text-green-400" />
                    )}
                    {doc.analysis_status === 'processing' && (
                      <Loader2 size={14} className="text-blue-400 animate-spin" />
                    )}
                    {doc.analysis_status === 'failed' && (
                      <AlertCircle size={14} className="text-red-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subida a la BIBLIOTECA del agente (agent_documents, conocimiento
          persistente). Es una función distinta de adjuntar una imagen a un
          mensaje suelto, así que se mantiene aparte del composer. */}
      <div className="px-4 pt-3 space-y-2 bg-surface">
        {docError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
            <AlertCircle size={14} />
            {docError}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-hover px-2.5 py-1 text-[11px] text-ink-secondary transition-colors hover:border-ink-muted hover:text-ink disabled:opacity-50"
          title={t('agent-workspace.upload-tooltip', locale)}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {t('agent-workspace.upload-tooltip', locale)}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleDocumentUpload}
          disabled={uploading}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp"
        />
      </div>

      {/* Composer compartido (2026-08-24): era un <input> de una línea, sin
          historial, sin Shift+Enter y sin poder parar la generación. */}
      <ChatComposer
        onSend={(text) => handleSendMessage(text)}
        onCancel={cancel}
        isLoading={isLoading}
        allowAttachments={false}
        accent={color}
        chatKey={`agent-workspace:${role}`}
        placeholder={`${placeholder} ${t('agent-workspace.input-hint', locale)}`}
      />
    </div>
  )
}
