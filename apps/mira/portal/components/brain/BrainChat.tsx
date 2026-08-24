'use client'

// "Tell MIRA" — chat para meter información al cerebro sin subir documentos ni
// editar campos. Propone cambios concretos y NADA se aplica hasta confirmar.
//
// Cambio 2026-08-05: esta tarjeta ya NO lista las propuestas pendientes.
// Antes era el ÚNICO sitio donde aparecían — incluidas las del sync de Drive,
// que no tienen nada que ver con este chat — y como la tarjeta está plegada
// casi siempre (se auto-abre una sola vez por navegador), las propuestas
// quedaban invisibles y la sensación era que sincronizar Drive no hacía nada.
// Ahora viven en BrainInbox, arriba de la página y siempre visible; aquí solo
// se avisa de que se ha creado una.

import { useEffect, useState } from 'react'
import { useActiveClient } from '@/lib/client-context'
import ChatThread from '@/components/chat/ChatThread'
import ChatComposer from '@/components/chat/ChatComposer'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

const SEEN_KEY = 'mira_brain_chat_seen'

export default function BrainChat({ isAgency }: { isAgency: boolean }) {
  const { activeClient } = useActiveClient()
  const clientId = activeClient?.id
  const [open, setOpen] = useState(false)

  // Se abre sola la primera vez que alguien ve esta tarjeta (por navegador):
  // sin eso no era descubrible, no se distinguía de las demás tarjetas de
  // /brand-brain y casi nadie la encontraba. Solo una vez: a partir de ahí
  // respeta lo que el usuario decida.
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        setOpen(true)
        localStorage.setItem(SEEN_KEY, '1')
      }
    } catch {}
  }, [])

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [sending, setSending] = useState(false)

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || sending || !clientId) return
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setSending(true)
    const res = await fetch('/api/brain/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, messages: next }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    if (res?.ok && data?.reply) {
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
      if (data.proposals?.length) {
        setMessages((m) => [...m, {
          role: 'assistant',
          content: isAgency
            ? '📥 Added to "What MIRA learned" at the top of this page — review it there to write it into the Brand Brain.'
            : '📥 Sent to the agency for review. It appears at the top of this page until they approve it.',
        }])
      }
    } else {
      setMessages((m) => [...m, {
        role: 'assistant',
        content: `⚠️ ${data?.error || 'Could not process that — please try again.'}`,
      }])
    }
    setSending(false)
  }

  return (
    <div
      className="card mb-6 overflow-hidden border-l-4"
      style={{ borderLeftColor: 'rgba(251,191,36,0.7)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💬</span>
          <div>
            <p className="text-sm font-semibold text-ink flex items-center gap-2">
              Tell MIRA
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.7)' }}>
                NO FORMS
              </span>
            </p>
            <p className="text-[11px] text-ink-tertiary">
              Business news? Say it here and the Brain updates — with your confirmation, never on its own.
            </p>
          </div>
        </div>
        <span className="text-xs text-ink-tertiary">{open ? 'Close' : 'Open'}</span>
      </button>

      {open && (
        <div className="border-t border-line">
          {/* components/chat (2026-08-06): antes pintaba `{m.content}` en crudo,
              así que las listas y negritas que devuelve el modelo salían con
              los asteriscos a la vista. */}
          <ChatThread
            chatKey="brain"
            className="max-h-72"
            messages={messages}
            isLoading={sending}
            onSelectOption={(opt) => send(opt)}
            emptyState={
              <p className="text-xs text-ink-tertiary">
                e.g. &laquo;We&apos;re launching a food truck in September&raquo; · &laquo;The set menu goes up to
                €12.90&raquo; · &laquo;Product reels perform twice as well as photos&raquo;
              </p>
            }
          />
          <ChatComposer
            chatKey="brain"
            onSend={(text) => send(text)}
            isLoading={sending}
            clientId={clientId}
            allowAttachments={false}
            placeholder="Tell MIRA something new about the business…"
          />
        </div>
      )}
    </div>
  )
}
