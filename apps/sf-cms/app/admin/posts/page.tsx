'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  slug: string
  status: string
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  slug: string
}

function PostsContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project') || ''
  const [posts, setPosts] = useState<Post[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchPosts(selectedProject.id)
    }
  }, [selectedProject])

  async function fetchProjects() {
    try {
      const response = await fetch('/api/admin/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const { projects } = await response.json() as { projects: Project[] }
      setProjects(projects)

      if (projectId && projects.length > 0) {
        const project = projects.find((p) => p.id === projectId)
        if (project) {
          setSelectedProject(project)
          return
        }
      }

      if (projects.length > 0) {
        setSelectedProject(projects[0])
      }

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load projects')
      setLoading(false)
    }
  }

  async function fetchPosts(projId: string) {
    try {
      const response = await fetch(`/api/admin/posts?project_id=${projId}`)
      if (!response.ok) throw new Error('Failed to fetch posts')
      const { posts } = await response.json() as { posts: Post[] }
      setPosts(posts)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load posts')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Posts</h1>
        <p className="text-slate-600 mt-2">Manage blog posts and news articles</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading...</p>
        </div>
      ) : (
        <>
          {projects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find((p) => p.id === e.target.value)
                  if (project) setSelectedProject(project)
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProject && (
            <>
              <div className="flex justify-end mb-6">
                <Link
                  href={`/admin/posts/new?project=${selectedProject.id}`}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Create Post
                </Link>
              </div>

              {posts.length === 0 ? (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
                  <p className="text-slate-600">No posts yet for this project</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition border border-slate-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{post.title}</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Slug: <code className="bg-slate-100 px-2 py-1 rounded">{post.slug}</code>
                          </p>
                          <div className="flex gap-4 mt-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                post.status === 'published'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {post.status}
                            </span>
                            <span className="text-xs text-slate-500">
                              Updated {new Date(post.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/admin/posts/${post.id}/edit?project=${selectedProject.id}`}
                          className="ml-4 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <PostsContent />
    </Suspense>
  )
}
