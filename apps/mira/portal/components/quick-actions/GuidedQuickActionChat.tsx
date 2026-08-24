'use client'

import { useState } from 'react'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
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
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // El autoscroll y los adjuntos los gestiona el par ChatThread/ChatComposer
  // compartido. Este chat tenía su propio textarea sin historial, sin poder
  // parar la generación y sin arrastrar-y-soltar; ahora hereda todo eso.
  async function sendMessage(text: string, turnAttachments: Attachment[] = []) {
    if ((!text.trim() && turnAttachments.length === 0) || sending) return
    const userMessage = text.trim()
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: userMessage || `(${turnAttachments.length} adjunto(s))`,
        attachments: turnAttachments.map((a) => a.name),
      },
    ])
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
      <ChatThread
        className="flex-1 min-h-0"
        chatKey={`qa-guided:${action.id}`}
        messages={messages.map((m) => ({
          role: m.role === 'bot' ? ('assistant' as const) : ('user' as const),
          content: m.text,
          options: m.chips,
        }))}
        isLoading={sending}
        error={error}
        onSelectOption={(chip) => sendMessage(chip)}
      />

      <ChatComposer
        chatKey={`qa-guided:${action.id}`}
        onSend={(text, attachments) => sendMessage(text, attachments ?? [])}
        isLoading={sending}
        clientId={clientId ?? undefined}
        placeholder={t('qa.chat.placeholder', locale)}
      />
    </div>
  )
}
