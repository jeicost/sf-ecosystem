'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'

function NewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')

  const [projects, setProjects] = useState<{ id: string; name: string; slug: string }[]>([])
  const [formData, setFormData] = useState({
    projectId: projectId || '',
    title: '',
    slug: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const response = await fetch('/api/admin/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const { projects } = await response.json()
      setProjects(projects)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load projects')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.projectId || !formData.title || !formData.slug) {
        setError('All fields are required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: formData.projectId,
          title: formData.title,
          slug: formData.slug,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create page')
      }

      const { id } = await response.json()

      // Redirect to editor
      router.push(
        `/admin/pages/${id}/edit?project=${formData.projectId}`
      )
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/admin/pages"
          className="text-slate-600 hover:text-slate-900 flex items-center gap-1 mb-4"
        >
          ← Back to Pages
        </Link>
        <h1 className="text-4xl font-bold text-slate-900">Create New Page</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project
            </label>
            <select
              value={formData.projectId}
              onChange={(e) =>
                setFormData({ ...formData, projectId: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Homepage"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Page Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="e.g., home"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Page'}
            </button>
            <Link
              href="/admin/pages"
              className="px-6 py-3 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function NewPagePage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <NewPageContent />
    </Suspense>
  )
}
