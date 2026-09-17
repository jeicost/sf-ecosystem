import { useState, useCallback, useEffect, useRef } from 'react'

interface GenerationStatus {
  queue_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result_data?: Record<string, any>
  error_message?: string
  completed_at?: string
}

export function useToolkitGeneration(toolSlug: string) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [queueId, setQueueId] = useState<string | null>(null)
  const [status, setStatus] = useState<GenerationStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // El intervalo vive en un ref con limpieza al desmontar. Antes se creaba
  // dentro de startGeneration sin ningún cleanup de unmount: si el usuario
  // navegaba a otra página durante la generación, el sondeo seguía golpeando
  // la API cada 2 s hasta 30 minutos — hasta 900 peticiones huérfanas, justo
  // mientras la función serverless está ocupada generando con Opus.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])
  useEffect(() => stopPolling, [stopPolling])

  const startGeneration = useCallback(
    async (inputData: Record<string, any>) => {
      setIsGenerating(true)
      setError(null)
      setStatus(null)

      try {
        const response = await fetch('/api/toolkit/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_slug: toolSlug,
            input_data: inputData,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || 'Generation failed')
          setIsGenerating(false)
          return
        }

        setQueueId(result.queue_id)

        // Poll for status every 2 seconds
        stopPolling()
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/toolkit/generate?queue_id=${result.queue_id}`
            )
            const statusData = await statusResponse.json()

            setStatus(statusData)

            if (statusData.status === 'completed') {
              setIsGenerating(false)
              stopPolling()
            } else if (statusData.status === 'failed') {
              setError(statusData.error_message || 'Generation failed')
              setIsGenerating(false)
              stopPolling()
            }
          } catch (err) {
            console.error('Status check error:', err)
          }
        }, 2000)

        pollRef.current = interval
        // Auto-cleanup after 30 minutes
        setTimeout(stopPolling, 1800000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsGenerating(false)
      }
    },
    [toolSlug]
  )

  return {
    isGenerating,
    queueId,
    status,
    error,
    startGeneration,
  }
}
