'use client'

import { useCallback, useRef, useState } from 'react'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UseAgentChatOptions {
  role: string
  clientId: string
  autonomy?: 'always_ask' | 'full_auto'
  locale?: 'es' | 'en'
}

export function useAgentChat({ role, clientId, autonomy, locale = 'es' }: UseAgentChatOptions) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    setError(null)
    setIsLoading(true)

    setMessages((prev) => [...prev, { role: 'user', content: message }])

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          message,
          clientId,
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
  }, [role, clientId, autonomy])

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  return { messages, isLoading, error, sendMessage, cancel }
}
