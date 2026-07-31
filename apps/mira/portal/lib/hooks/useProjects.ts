'use client'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserSupabaseClient } from '@sf/supabase'
import { useActiveClient, getStoredClientId } from '@/lib/client-context'

interface MiraUser {
  id: string
  company_name: string
  email: string
  subscription_tier: string
  subscription_status: string
}

interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  agents_count: number
  created_at: string
}

// Proyectos del cliente activo (mismo criterio que /api/home/overview):
// mira_projects filtrado por client_id, sin archivados, más recientes primero.
export function useProjects() {
  const { activeClient } = useActiveClient()
  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<MiraUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() =>
    createBrowserSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  )

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          if (!cancelled) setError('Not authenticated')
          return
        }

        // Perfil best-effort (lo muestra DashboardLayout); no bloquea los proyectos.
        const { data: userData } = await supabase
          .from('mira_users')
          .select('id, company_name, email, subscription_tier, subscription_status')
          .eq('auth_id', authUser.id)
          .maybeSingle()
        if (!cancelled && userData) setUser(userData as MiraUser)

        const clientId = activeClient?.id ?? getStoredClientId()
        if (!clientId) {
          if (!cancelled) setProjects([])
          return
        }

        const { data: projectsData, error: projectsError } = await supabase
          .from('mira_projects')
          .select('id, name, slug, description, status, agents_count, created_at')
          .eq('client_id', clientId)
          .neq('status', 'archived')
          .order('created_at', { ascending: false })

        if (projectsError) throw projectsError
        if (!cancelled) setProjects(projectsData || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch projects'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [supabase, activeClient?.id])

  return { projects, user, loading, error }
}
