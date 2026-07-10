import { useCallback, useState, useEffect } from 'react'

interface ToolConnectionData {
  toolId: string
  accountEmail?: string
  accountHandle?: string
  authToken?: string
  metadata?: Record<string, any>
}

export function useToolConnections(clientId: string) {
  const [connectedTools, setConnectedTools] = useState<string[]>([])
  const [userSubscriptionPlan, setUserSubscriptionPlan] = useState<'free' | 'scale' | 'enterprise'>(
    'free'
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch connected tools on mount
  useEffect(() => {
    const fetchTools = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/integrations/tools?clientId=${clientId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch tools')
        }

        const data = await response.json()
        setConnectedTools(data.connectedTools || [])
        setUserSubscriptionPlan(data.userSubscriptionPlan || 'free')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (clientId) {
      fetchTools()
    }
  }, [clientId])

  const connectTool = useCallback(
    async (data: ToolConnectionData) => {
      try {
        setError(null)
        const response = await fetch('/api/integrations/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            ...data,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to connect tool')
        }

        setConnectedTools((prev) => [...prev, data.toolId])
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        throw err
      }
    },
    [clientId]
  )

  const disconnectTool = useCallback(
    async (toolId: string) => {
      try {
        setError(null)
        const response = await fetch('/api/integrations/tools', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            toolId,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to disconnect tool')
        }

        setConnectedTools((prev) => prev.filter((id) => id !== toolId))
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        throw err
      }
    },
    [clientId]
  )

  return {
    connectedTools,
    userSubscriptionPlan,
    isLoading,
    error,
    connectTool,
    disconnectTool,
  }
}
