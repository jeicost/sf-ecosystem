'use client'
import { useCallback, useEffect, useState } from 'react'
import type { ImageQuotaStatus } from '@/lib/image-quota'

export interface ToolState {
  id: string
  enabled: boolean
  requested: boolean
}

/**
 * Estado de los módulos de la marca activa: qué tiene abierto, qué ha pedido y
 * cómo va de imágenes. Una sola lectura para toda la sección (/api/tools), para
 * que el candado del menú y el de la tarjeta no puedan discrepar.
 */
export function useClientTools(clientId: string | undefined) {
  const [tools, setTools] = useState<ToolState[]>([])
  const [quota, setQuota] = useState<ImageQuotaStatus | null>(null)
  const [customRequested, setCustomRequested] = useState(false)
  const [isAgency, setIsAgency] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      // Sin marca activa NO se sale de aquí: /api/tools resuelve la marca por la
      // sesión (resolveRequestClient), igual que el resto de rutas. Salir antes
      // dejaba la página en "Loading tools…" para siempre y, peor, pintaba todo
      // el catálogo como bloqueado — al super_admin en el primer render, antes
      // de que el contexto restaure su cliente de localStorage.
      const res = await fetch(clientId ? `/api/tools?clientId=${clientId}` : '/api/tools')
      if (!res.ok) throw new Error('Failed to load tools')
      const data = await res.json()
      setTools(data.tools || [])
      setQuota(data.quota ?? null)
      setCustomRequested(!!data.customRequested)
      setIsAgency(!!data.isAgency)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tools')
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  return { tools, quota, customRequested, isAgency, isLoading, error, reload: load }
}
