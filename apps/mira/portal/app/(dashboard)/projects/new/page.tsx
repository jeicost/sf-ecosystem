'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectManagement } from '@/lib/hooks/useProjectManagement'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject, loading, error } = useProjectManagement()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const project = await createProject({ name, description })
    if (project) {
      router.push(`/projects/${project.slug}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="mb-8">
        <Link href="/home" className="text-purple-400 hover:text-purple-300 text-sm mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-white">Create New Project</h1>
        <p className="text-gray-400 mt-2">Start a new project and begin managing your agents</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-8 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Project Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Startup, Production Site"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: Describe what this project is for"
            rows={4}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <Link
            href="/home"
            className="flex-1 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
