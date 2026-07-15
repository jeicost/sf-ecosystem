'use client'

import { useState } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Section {
  id: string
  type: string
  data: Record<string, any>
}

interface UsePageChatOptions {
  pageId?: string | null
  isNew?: boolean
}

export function usePageChat(options: UsePageChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSections, setCurrentSections] = useState<Section[]>([])
  const [pageId, setPageId] = useState(options.pageId)

  const sendMessage = async (instruction: string) => {
    if (!instruction.trim()) return

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: instruction }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/pages/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction,
          pageId: pageId,
          isNew: options.isNew,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const { sectionsJson, pageIdNew } = await response.json()

      // Update local sections
      setCurrentSections(sectionsJson)

      // If this was a new page, update the pageId for future requests
      if (options.isNew && pageIdNew) {
        setPageId(pageIdNew)
      }

      // Add assistant message
      const assistantMessage = {
        role: 'assistant' as const,
        content: `✅ Page ${options.isNew ? 'created' : 'updated'} with ${sectionsJson.length} section${sectionsJson.length !== 1 ? 's' : ''}`,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      const errorMessage = {
        role: 'assistant' as const,
        content: `❌ Error: ${errorMsg}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    currentSections,
    pageId,
  }
}
