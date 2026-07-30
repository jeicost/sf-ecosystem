'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, Plus, Copy, Trash2 } from 'lucide-react'
import { sortProjects, pickInitialProject, rememberProject } from '@/lib/project-selection'
import { Button, Card, CardBody, Badge, Select, Label, EmptyState } from '@/components/ui'

interface Page {
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

function PagesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project') || ''
  const [pages, setPages] = useState<Page[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      fetchPages(selectedProject.id)
    }
  }, [selectedProject])

  async function fetchProjects() {
    try {
      const response = await fetch('/api/admin/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      const { projects } = (await response.json()) as { projects: Project[] }
      setProjects(projects)

      const initial = pickInitialProject(projects, projectId)
      if (initial) setSelectedProject(initial)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load projects')
      setLoading(false)
    }
  }

  async function fetchPages(projId: string) {
    try {
      const response = await fetch(`/api/admin/pages?project_id=${projId}`)
      if (!response.ok) throw new Error('Failed to fetch pages')
      const { pages } = (await response.json()) as { pages: Page[] }
      setPages(pages)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load pages')
    }
  }

  async function handleDuplicate(pageId: string) {
    if (!selectedProject) return
    try {
      const response = await fetch(`/api/admin/pages/${pageId}/duplicate`, { method: 'POST' })
      if (!response.ok) throw new Error('Failed to duplicate page')
      await fetchPages(selectedProject.id)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to duplicate page')
    }
  }

  async function handleDelete(pageId: string, title: string) {
    if (!selectedProject) return
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete page')
      await fetchPages(selectedProject.id)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to delete page')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Pages</h1>
        <p className="mt-1 text-sm text-slate-500">Gestiona las páginas y secciones de contenido.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Cargando…</p>
      ) : (
        <>
          {projects.length > 0 && (
            <div className="mb-6 max-w-xs">
              <Label htmlFor="project-select">Select Project</Label>
              <Select
                id="project-select"
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find((p) => p.id === e.target.value)
                  if (project) {
                    setSelectedProject(project)
                    rememberProject(project.id)
                  }
                }}
              >
                {sortProjects(projects).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {selectedProject && (
            <>
              <div className="mb-6 flex justify-end">
                <Link href={`/admin/pages/new?project=${selectedProject.id}`}>
                  <Button>
                    <Plus className="h-4 w-4" />
                    Create Page
                  </Button>
                </Link>
              </div>

              {pages.length === 0 ? (
                <EmptyState icon={<FileText className="h-8 w-8" />} title="No pages yet for this project" />
              ) : (
                <div className="grid gap-4">
                  {pages.map((page) => (
                    <Card key={page.id}>
                      <CardBody className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-slate-900">{page.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Slug: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{page.slug}</code>
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <Badge tone={page.status === 'published' ? 'success' : 'warning'}>{page.status}</Badge>
                            <span className="text-xs text-slate-400">
                              Updated {new Date(page.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <Link href={`/admin/pages/${page.id}/edit?project=${selectedProject.id}`}>
                            <Button size="sm">Edit</Button>
                          </Link>
                          <Button variant="secondary" size="sm" title="Duplicate as draft" onClick={() => handleDuplicate(page.id)}>
                            <Copy className="h-3.5 w-3.5" />
                            Duplicate
                          </Button>
                          <Button variant="destructive" size="sm" title="Delete page" onClick={() => handleDelete(page.id, page.title)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
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

export default function PagesPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-slate-500">Loading…</p>}>
      <PagesContent />
    </Suspense>
  )
}
