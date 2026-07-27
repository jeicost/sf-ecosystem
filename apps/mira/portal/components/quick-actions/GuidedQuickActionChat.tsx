'use client'

import { useEffect, useRef, useState } from 'react'
import { Paperclip, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import { uploadFilesToBucket } from '@/lib/attachments-client'
import type { Attachment } from '@/lib/attachments'
import type { QuickActionDef } from '@/lib/quick-actions/registry'

interface ChatMessage {
  role: 'user' | 'bot'
  text: string
  chips?: string[]
  attachments?: string[]
}

interface GuidedQuickActionChatProps {
  action: QuickActionDef
  clientId: string | null
  projectId: string | null
  onSubmitted: (actionId: string, fields: Record<string, unknown>) => void
}

// Modo "Cuéntamelo": chat guiado que rellena el formulario conversacionalmente.
// Fork ligero del front del chat de onboarding (burbujas + chips + clip). El
// historial canónico (conversation) es opaco — lo devuelve el servidor.
export function GuidedQuickActionChat({ action, clientId, projectId, onSubmitted }: GuidedQuickActionChatProps) {
  const { locale } = useLocaleContext()
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: 'bot', text: t('qa.chat.intro', locale).replace('{action}', t(action.titleKey, locale)) },
  ])
  const [conversation, setConversation] = useState<unknown[]>([])
  const [fields, setFields] = useState<Record<string, unknown>>({})
  const [sessionAttachments, setSessionAttachments] = useState<Attachment[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0 || !clientId) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadFilesToBucket(clientId, files, 'quick-actions')
      setPendingAttachments((prev) => [...prev, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function sendMessage() {
    if ((!input.trim() && pendingAttachments.length === 0) || sending) return
    const userMessage = input.trim()
    const turnAttachments = pendingAttachments
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: userMessage || `(${turnAttachments.length} adjunto(s))`,
        attachments: turnAttachments.map((a) => a.name),
      },
    ])
    setInput('')
    setPendingAttachments([])
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/quick-actions/guided', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          project_id: projectId,
          action_type: action.id,
          locale,
          message: userMessage,
          conversation,
          fields,
          attachments: turnAttachments,
          sessionAttachments,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.error) {
        throw new Error(data?.error || 'Chat failed')
      }

      setConversation(data.conversation ?? [])
      setFields(data.fields ?? {})
      setSessionAttachments((prev) => [...prev, ...turnAttachments])
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: data.botMessage || '…', chips: data.chips?.length ? data.chips : undefined },
      ])

      if (data.status === 'submitted' && data.action_id) {
        // Pequeña pausa para que se lea la despedida antes del handoff al resultado
        setTimeout(() => onSubmitted(data.action_id, data.fields ?? {}), 900)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[420px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-purple-600 text-white px-3.5 py-2 text-sm whitespace-pre-wrap'
                  : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-surface text-ink px-3.5 py-2 text-sm whitespace-pre-wrap'
              }
            >
              {m.text}
              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.attachments.map((name, j) => (
                    <span key={j} className="inline-flex items-center gap-1 text-[11px] opacity-80">
                      <Paperclip size={10} /> {name}
                    </span>
                  ))}
                </div>
              )}
              {m.chips && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.chips.map((chip, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px]"
                    >
                      <CheckCircle2 size={11} /> {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-xs text-ink-secondary pl-1">
            <Loader2 size={13} className="animate-spin" />
            {t('qa.chat.thinking', locale)}
          </div>
        )}
      </div>

      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          {pendingAttachments.map((a, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface text-[11px] text-ink-secondary">
              <Paperclip size={10} /> {a.name}
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-400 pt-1">{error}</p>}

      <div className="flex items-end gap-2 pt-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending}
          className="p-2 rounded-lg bg-surface text-ink-secondary hover:text-ink transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/*,.pdf,.txt,.md,.csv"
          onChange={handleFileSelect}
        />
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder={t('qa.chat.placeholder', locale)}
          rows={1}
          className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-tertiary text-sm resize-none"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
          className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
