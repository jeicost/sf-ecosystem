'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  slug: string
  domain?: string
  api_key: string
  vercel_hook_url?: string | null
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hookDrafts, setHookDrafts] = useState<Record<string, string>>({})
  const [savingHook, setSavingHook] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const response = await fetch('/api/admin/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const { projects } = await response.json() as { projects: Project[] }
      setProjects(projects)
      setHookDrafts(
        Object.fromEntries(projects.map((p) => [p.id, p.vercel_hook_url || '']))
      )
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function saveHook(projectId: string) {
    setSavingHook(projectId)
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vercel_hook_url: hookDrafts[projectId] || null }),
      })
      if (!response.ok) throw new Error('Failed to save deploy hook')
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to save deploy hook')
    } finally {
      setSavingHook(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-2">Manage your client websites</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-600 mb-4">No projects yet</p>
          <p className="text-sm text-slate-500">
            Create one below, or have the landing-builder agent register it automatically
            when CMS integration is enabled during a new landing&apos;s intake
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border border-slate-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{project.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Slug: <code className="bg-slate-100 px-2 py-1 rounded">{project.slug}</code>
                  </p>
                  {project.domain && (
                    <p className="text-sm text-slate-600 mt-1">
                      Domain: <a href={`https://${project.domain}`} className="text-blue-600 hover:underline">{project.domain}</a>
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    API Key: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{project.api_key.slice(0, 16)}...</code>
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-600 shrink-0">
                      Deploy Hook:
                    </label>
                    <input
                      type="text"
                      value={hookDrafts[project.id] ?? ''}
                      onChange={(e) =>
                        setHookDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))
                      }
                      placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                      className="flex-1 max-w-md px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                    <button
                      onClick={() => saveHook(project.id)}
                      disabled={savingHook === project.id}
                      className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded transition disabled:opacity-50"
                    >
                      {savingHook === project.id ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Optional: paste a Vercel Deploy Hook URL to auto-redeploy this project's
                    site whenever a page or post is published here (~1-2 min to go live, no
                    manual redeploy needed).
                  </p>
                </div>

                <Link
                  href={`/admin/pages?project=${project.id}`}
                  className="ml-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
                >
                  Manage Pages
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
