import { useCallback, useRef, useState } from 'react'
import { BrainChatMessage } from '@/lib/types/brain'

export interface UseBrainChatOptions {
  clientId: string
  onProposalDetected?: (proposal: { section: string; value: string; reason: string }) => void
}

export function useBrainChat({ clientId, onProposalDetected }: UseBrainChatOptions) {
  const [messages, setMessages] = useState<BrainChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (
      message: string,
      mode: 'chat' | 'proposal' = 'chat',
      agentId?: string
    ) => {
      setError(null)
      setIsLoading(true)

      // Add user message immediately
      setMessages((prev) => [...prev, { role: 'user', content: message }])

      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/brain/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, message, mode, agentId }),
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

          // Update assistant message as it streams
          setMessages((prev) => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]

            if (lastMsg && lastMsg.role === 'assistant') {
              updated[updated.length - 1] = {
                ...lastMsg,
                content: assistantMessage,
              }
            } else {
              updated.push({
                role: 'assistant',
                content: assistantMessage,
              })
            }
            return updated
          })
        }

        // Parse for proposals
        const proposalMatch = assistantMessage.match(
          /PROPOSAL:\s*(\w+)\s*=\s*(.+?)\nREASON:\s*(.+?)(?=\n|$)/
        )
        if (proposalMatch && onProposalDetected) {
          onProposalDetected({
            section: proposalMatch[1],
            value: proposalMatch[2].trim(),
            reason: proposalMatch[3].trim(),
          })
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Error: ${err.message}`,
            },
          ])
        }
      } finally {
        setIsLoading(false)
      }
    },
    [clientId, onProposalDetected]
  )

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    cancel,
    clearMessages,
  }
}
