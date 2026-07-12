'use client'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'

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

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [user, setUser] = useState<MiraUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  )

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('mira_users')
          .select('id, company_name, email, subscription_tier, subscription_status')
          .eq('auth_id', authUser.id)
          .single()

        if (userError || !userData) {
          setError('User not found in mira_users')
          setLoading(false)
          return
        }

        setUser(userData as MiraUser)

        const isAdmin = authUser.user_metadata?.plan === 'admin'

        let query = supabase
          .from('mira_projects')
          .select('id, name, slug, description, status, agents_count, created_at')

        if (!isAdmin) {
          query = query.eq('user_id', userData.id)
        }

        const { data: projectsData, error: projectsError } = await query

        if (projectsError) throw projectsError
        setProjects(projectsData || [])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch projects'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { projects, user, loading, error }
}
