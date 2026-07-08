import { useCallback, useState } from 'react'

interface SaveVersionOptions {
  clientId: string
  changeSummary: string
  triggeredBy: 'user' | 'agent' | 'system'
  triggeredByAgentId?: string
}

export function useBrainVersions() {
  const [isSaving, setIsSaving] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveVersion = useCallback(async (options: SaveVersionOptions) => {
    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/brain/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save version')
      }

      const data = await response.json()
      return data.version
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [])

  const rollbackToVersion = useCallback(async (clientId: string, versionNumber: number) => {
    setError(null)
    setIsRollingBack(true)

    try {
      const response = await fetch('/api/brain/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, versionNumber }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to rollback')
      }

      const data = await response.json()
      return data.version
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    } finally {
      setIsRollingBack(false)
    }
  }, [])

  return {
    saveVersion,
    rollbackToVersion,
    isSaving,
    isRollingBack,
    error,
  }
}
