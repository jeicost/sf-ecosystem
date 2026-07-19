import { useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { getStoredClientId } from '@/lib/client-context'

type Project = Database['public']['Tables']['mira_projects']['Row']

interface ProjectInput {
  name: string
  description?: string
  slug?: string
}

export function useProjectManagement() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  )

  const createProject = async (input: ProjectInput): Promise<Project | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const { data: userData, error: userError } = await supabase
        .from('mira_users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single()

      if (userError || !userData) throw new Error('User not found')

      const slug = input.slug || input.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

      // Sub-proyecto del cliente activo: client_id viene del contexto (o metadata)
      const clientId =
        getStoredClientId() || (authUser.user_metadata?.client_id as string | undefined) || null

      const { data: projectData, error: projectError } = await supabase
        .from('mira_projects')
        .insert([
          {
            user_id: userData.id,
            client_id: clientId,
            name: input.name,
            slug,
            description: input.description,
            status: 'active',
            agents_count: 0,
          },
        ])
        .select('*')
        .single()

      if (projectError) throw projectError

      // NOTE: no insert into mira_project_access — that table maps users→clients
      // (its project_id FK points to clients.id) and is managed at the client level.
      return projectData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (
    projectId: string,
    updates: Partial<ProjectInput>
  ): Promise<Project | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('mira_projects')
        .update(updates)
        .eq('id', projectId)
        .select('*')
        .single()

      if (projectError) throw projectError
      return projectData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('mira_projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  const archiveProject = async (projectId: string): Promise<Project | null> => {
    return updateProject(projectId, { status: 'archived' } as any)
  }

  return {
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    loading,
    error,
  }
}
