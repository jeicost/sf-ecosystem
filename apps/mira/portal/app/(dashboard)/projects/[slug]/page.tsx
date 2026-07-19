'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import Link from 'next/link'
import { useProjectManagement } from '@/lib/hooks/useProjectManagement'

type Project = Database['public']['Tables']['mira_projects']['Row']

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { archiveProject } = useProjectManagement()

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  )

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true)
      setError(null)

      try {
        const resolvedParams = await params
        setSlug(resolvedParams.slug)

        const { data, error: fetchError } = await supabase
          .from('mira_projects')
          .select('*')
          .eq('slug', resolvedParams.slug)
          .single()

        if (fetchError) throw fetchError
        setProject(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load project'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params, supabase])

  const handleArchive = async () => {
    if (!project || !confirm('Archive this project? You can restore it later.')) return

    await archiveProject(project.id)
    setProject({ ...project, status: 'archived' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading project...</div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link href="/home" className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block">
          ← Back to Home
        </Link>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error || 'Project not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
      <Link href="/home" className="text-purple-400 hover:text-purple-300 text-sm">
        ← Back to Home
      </Link>

      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">{project.name}</h1>
            <p className="text-gray-400 mt-2">{project.description}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            project.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : project.status === 'paused'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm">Slug</p>
          <p className="text-lg font-mono text-white mt-1">{project.slug}</p>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm">Agents</p>
          <p className="text-lg font-semibold text-white mt-1">{project.agents_count}</p>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <p className="text-gray-400 text-sm">Created</p>
          <p className="text-lg font-medium text-white mt-1">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Trabajar en este proyecto */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Trabajar en este proyecto</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={`/agent/orchestrator?project=${project.id}`}
            className="p-6 bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-lg transition group"
          >
            <p className="text-lg font-semibold text-white group-hover:text-purple-300 transition">
              💬 Chatear con contexto del proyecto
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Habla con los agentes: lo que se decida aquí se guarda en la memoria de este proyecto.
            </p>
          </Link>
          <Link
            href={`/project-memory?project=${project.id}`}
            className="p-6 bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-lg transition group"
          >
            <p className="text-lg font-semibold text-white group-hover:text-purple-300 transition">
              🧠 Memoria del proyecto
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Insights, decisiones y acciones registradas para este proyecto.
            </p>
          </Link>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4 p-6 bg-red-950/20 border border-red-900/30 rounded-lg">
        <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
        <p className="text-gray-400 text-sm">
          {project.status === 'archived'
            ? 'This project is archived. Restore it to make changes.'
            : 'Archive this project to remove it from your active list.'}
        </p>
        <button
          onClick={handleArchive}
          disabled={project.status === 'archived'}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
        >
          {project.status === 'archived' ? 'Project Archived' : 'Archive Project'}
        </button>
      </div>
    </div>
  )
}
