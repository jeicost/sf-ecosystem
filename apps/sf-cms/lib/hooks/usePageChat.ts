'use client'

import { useState, useCallback } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Section {
  id: string
  type: string
  data: Record<string, unknown>
}

export function usePageChat({ pageId, isNew }: { pageId: string; isNew: boolean }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentSections, setCurrentSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(
    async (instruction: string) => {
      try {
        setIsLoading(true)
        setMessages((prev) => [...prev, { role: 'user', content: instruction }])

        const response = await fetch(`/api/admin/pages/${pageId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instruction }),
        })

        if (!response.ok) {
          const error = await response.json()
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `Error: ${error.error || 'Failed to process request'}`,
            },
          ])
          return
        }

        const data = await response.json()
        setCurrentSections(data.sections_json)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Updated ${data.sections_json.length} section(s) — review the preview and click Save to persist ✓`,
          },
        ])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [pageId]
  )

  return { messages, isLoading, sendMessage, currentSections }
}
