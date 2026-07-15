import { useEffect, useState } from 'react'
import { useActiveClient } from '@/lib/client-context'

export interface DepartmentStats {
  leads?: number
  proposals?: number
  posts?: number
  audits?: number
  trends?: number
  [key: string]: number | undefined
}

export function useDepartmentStats(dept: string) {
  const { activeClient } = useActiveClient()
  const [stats, setStats] = useState<DepartmentStats>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeClient?.id) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/department-stats?clientId=${activeClient.id}&dept=${dept}`)
        if (!res.ok) throw new Error('Failed to fetch stats')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error(`Failed to fetch ${dept} stats:`, err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [activeClient?.id, dept])

  return { stats, loading, error }
}
