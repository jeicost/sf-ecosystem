'use client'

import { useCallback, useRef, useState } from 'react'
import { AGENT_DISPLAY_NAMES } from '@/lib/agent-meta'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  feedback?: 'helpful' | 'not_helpful'
}

export interface UseAgentChatOptions {
  role: string
  clientId: string
  projectId?: string | null
  autonomy?: 'always_ask' | 'full_auto'
  locale?: 'es' | 'en'
  // Nombre a usar en el feedback 👍/👎 (agent_interactions.agent_name) — solo
  // necesario para roles que no viven en AGENT_METADATA (p.ej. el chat de
  // departamento `dept:<slug>`), para que coincida con el agentName que
  // app/api/agent/route.ts ya usa al loguear esa misma conversación.
  agentDisplayName?: string
}

export function useAgentChat({ role, clientId, projectId, autonomy, locale = 'es', agentDisplayName }: UseAgentChatOptions) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    setError(null)
    setIsLoading(true)

    // Historial multi-turno: los últimos 20 mensajes ANTERIORES a este viajan
    // al servidor — sin esto cada mensaje iba solo y el agente no recordaba
    // nada de la propia conversación.
    const history = messages
      .slice(-20)
      .map(({ role: r, content }) => ({ role: r, content }))

    setMessages((prev) => [...prev, { role: 'user', content: message }])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          message,
          history,
          clientId,
          projectId: projectId || undefined,
          includeBrandBrain: true,
          autonomy,
          locale,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response stream')

      let assistantMessage = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        setMessages((prev) => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]

          if (lastMsg && lastMsg.role === 'assistant') {
            updated[updated.length - 1] = {
              ...lastMsg,
              content: assistantMessage,
            }
          } else {
            updated.push({ role: 'assistant', content: assistantMessage })
          }

          return updated
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `❌ Error: ${err.message}` },
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }, [role, clientId, autonomy, projectId, locale, messages])

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  // Feedback (👍/👎) on a completed assistant message — needs the preceding
  // user message as the "query" half of the pair. Optimistic: marks the
  // message locally right away, logs server-side, never blocks the UI on
  // failure (it's feedback, not a critical action).
  const sendFeedback = useCallback(
    async (messageIndex: number, outcome: 'helpful' | 'not_helpful', note?: string) => {
      setMessages((prev) => {
        const updated = [...prev]
        const msg = updated[messageIndex]
        if (msg && msg.role === 'assistant') updated[messageIndex] = { ...msg, feedback: outcome }
        return updated
      })

      const userMsg = messages
        .slice(0, messageIndex)
        .reverse()
        .find((m) => m.role === 'user')
      const assistantMsg = messages[messageIndex]
      if (!userMsg || !assistantMsg) return

      try {
        await fetch('/api/agent-interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            agent_name: agentDisplayName ?? AGENT_DISPLAY_NAMES[role] ?? role,
            user_query: userMsg.content,
            agent_response: assistantMsg.content,
            outcome,
            user_feedback: note,
          }),
        })
      } catch { /* feedback failures should never disrupt the chat */ }
    },
    [messages, clientId, role, agentDisplayName]
  )

  return { messages, isLoading, error, sendMessage, cancel, sendFeedback }
}
