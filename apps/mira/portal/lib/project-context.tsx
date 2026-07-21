'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'

export interface ActiveProject {
  id: string
  name: string
  slug: string
  status: string
}

interface ProjectContextValue {
  activeProject: ActiveProject | null
  projects: ActiveProject[]
  setActiveProject: (p: ActiveProject | null) => void
}

const ProjectContext = createContext<ProjectContextValue>({
  activeProject: null,
  projects: [],
  setActiveProject: () => {},
})

// Namespaced por cliente: al cambiar de empresa no se arrastra el proyecto de otra.
const storageKey = (clientId: string) => `mira_active_project:${clientId}`

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { activeClient } = useActiveClient()
  const [projects, setProjects] = useState<ActiveProject[]>([])
  const [activeProject, setActiveProjectState] = useState<ActiveProject | null>(null)

  useEffect(() => {
    const clientId = activeClient?.id
    if (!clientId) {
      setProjects([])
      setActiveProjectState(null)
      return
    }

    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('mira_projects')
          .select('id, name, slug, status')
          .eq('client_id', clientId)
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
        if (cancelled) return
        const rows: ActiveProject[] = data ?? []
        setProjects(rows)

        // Restaurar selección guardada solo si el proyecto sigue existiendo.
        let stored: ActiveProject | null = null
        try {
          const raw = localStorage.getItem(storageKey(clientId!))
          if (raw) stored = JSON.parse(raw)
        } catch {}
        const match = stored ? rows.find((p) => p.id === stored!.id) : undefined
        setActiveProjectState(match ?? null)
        if (stored && !match) localStorage.removeItem(storageKey(clientId!))
      } catch (error) {
        console.error('Project context error:', error)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeClient?.id])

  function setActiveProject(p: ActiveProject | null) {
    const clientId = activeClient?.id
    if (clientId) {
      if (p) localStorage.setItem(storageKey(clientId), JSON.stringify(p))
      else localStorage.removeItem(storageKey(clientId))
    }
    setActiveProjectState(p)
  }

  return (
    <ProjectContext.Provider value={{ activeProject, projects, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useActiveProject() {
  return useContext(ProjectContext)
}

export function getStoredProjectId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('mira_active_client')
    if (!raw) return null
    const clientId = (JSON.parse(raw) as { id: string }).id
    const p = localStorage.getItem(storageKey(clientId))
    return p ? (JSON.parse(p) as ActiveProject).id : null
  } catch {
    return null
  }
}
