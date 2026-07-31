import { useState, useMemo } from 'react'
import { createBrowserSupabaseClient } from '@sf/supabase'
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
    createBrowserSupabaseClient(
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

      // Creación SERVER-SIDE (POST /api/projects): el insert directo desde el
      // navegador nunca funcionó — mira_users vacía rompía el FK de user_id y
      // la RLS de mira_projects bloquea el insert con anon key. La ruta
      // auto-provisiona mira_users y resuelve colisiones de slug.
      const clientId =
        getStoredClientId() || (authUser.user_metadata?.client_id as string | undefined) || null

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          slug: input.slug,
          description: input.description,
          clientId,
        }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok || !payload?.project) {
        throw new Error(payload?.error || 'Failed to create project')
      }
      const projectData = payload.project as Project

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
