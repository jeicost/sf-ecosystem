'use client'

import { useState, useCallback } from 'react'

export interface MediaItem {
  id: string
  project_id: string
  filename: string
  url: string
  mime_type: string | null
  size_bytes: number | null
  alt_text: string | null
  created_at: string
}

export function useMedia(projectId: string) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(
    async (file: File): Promise<MediaItem | null> => {
      setLoading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('project_id', projectId)

        const response = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Upload failed')
        }

        const newMedia = await response.json()
        setMedia(prev => [newMedia, ...prev])
        return newMedia
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [projectId]
  )

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/media?project_id=${projectId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch media')
      }

      const { media: items } = await response.json()
      setMedia(items || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  return {
    media,
    loading,
    error,
    uploadFile,
    fetchMedia,
  }
}
