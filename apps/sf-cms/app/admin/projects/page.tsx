'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FolderKanban } from 'lucide-react'
import { Button, Card, CardBody, Badge, Input, EmptyState } from '@/components/ui'

type BriefStatus = 'not_started' | 'in_progress' | 'ready' | 'built'

interface Project {
  id: string
  name: string
  slug: string
  domain?: string
  api_key_last4: string | null
  api_key_hashed: boolean
  vercel_hook_url?: string | null
  created_at: string
  last_deploy?: { status: string; created_at: string } | null
  brief_status?: BriefStatus | null
}

const BRIEF_STATUS_LABEL: Record<BriefStatus, string> = {
  not_started: 'Brief: sin empezar',
  in_progress: 'Brief: en curso',
  ready: 'Brief: listo',
  built: 'Brief: construido',
}

const BRIEF_STATUS_TONE: Record<BriefStatus, 'neutral' | 'info' | 'success' | 'special'> = {
  not_started: 'neutral',
  in_progress: 'info',
  ready: 'success',
  built: 'special',
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
      const { projects } = (await response.json()) as { projects: Project[] }
      setProjects(projects)
      setHookDrafts(Object.fromEntries(projects.map((p) => [p.id, p.vercel_hook_url || ''])))
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
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Los sitios de cliente que administras en SF-CMS.</p>
        </div>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Cargando proyectos…</p>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="Todavía no hay proyectos"
          description="Créalo aquí, o deja que el agente de landings lo registre automáticamente cuando se active la integración con el CMS durante el brief de una nueva landing."
          action={
            <Link href="/admin/projects/new">
              <Button variant="secondary">Crear el primero</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardBody className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{project.name}</h3>
                    {project.last_deploy && (
                      <Badge
                        tone={
                          project.last_deploy.status === 'ok'
                            ? 'success'
                            : project.last_deploy.status === 'failed'
                              ? 'danger'
                              : 'neutral'
                        }
                        title={`Último deploy: ${new Date(project.last_deploy.created_at).toLocaleString()}`}
                      >
                        deploy {project.last_deploy.status}
                      </Badge>
                    )}
                    <Badge tone={BRIEF_STATUS_TONE[(project.brief_status as BriefStatus) || 'not_started']}>
                      {BRIEF_STATUS_LABEL[(project.brief_status as BriefStatus) || 'not_started']}
                    </Badge>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Slug: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{project.slug}</code>
                  </p>
                  {project.domain && (
                    <p className="mt-1 text-sm text-slate-500">
                      Domain:{' '}
                      <a href={`https://${project.domain}`} className="text-accent-600 hover:underline">
                        {project.domain}
                      </a>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    API Key:{' '}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5">
                      {project.api_key_last4 ? `••••${project.api_key_last4}` : '— none —'}
                    </code>
                    {project.api_key_hashed && <span className="ml-1.5">(hashed — solo se muestra al crearla)</span>}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <label className="shrink-0 text-xs font-medium text-slate-500">Deploy Hook</label>
                    <Input
                      value={hookDrafts[project.id] ?? ''}
                      onChange={(e) => setHookDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))}
                      placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                      className="max-w-md py-1 text-xs"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => saveHook(project.id)}
                      disabled={savingHook === project.id}
                    >
                      {savingHook === project.id ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Opcional: pega la URL de un Deploy Hook de Vercel para redeployar el sitio
                    automáticamente cuando se publique una página o post aquí (~1-2 min).
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Link href={`/admin/pages?project=${project.id}`}>
                    <Button size="sm" className="w-full">
                      Manage Pages
                    </Button>
                  </Link>
                  <Link href={`/admin/projects/${project.id}/brief`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Brief de landing
                    </Button>
                  </Link>
                  <Link href={`/admin/projects/${project.id}/pixels`}>
                    <Button variant="secondary" size="sm" className="w-full">
                      Pixels
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
