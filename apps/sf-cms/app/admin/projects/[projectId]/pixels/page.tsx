'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardBody, Input } from '@/components/ui'
import { PROJECT_PIXEL_FIELDS, type ProjectPixelSettings } from '@/lib/pixels'

interface ProjectResponse {
  project: {
    id: string
    name: string
    slug: string
    settings?: Record<string, unknown> | null
  }
}

/**
 * Pixels site-wide del proyecto — se guardan en projects.settings y los
 * consumen las webs cliente vía GET /api/public/settings en cada build.
 * Ojo: los cambios NO aparecen en la web hasta su siguiente deploy/rebuild
 * (las webs leen esto en build-time, no en runtime).
 */
export default function ProjectPixelsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [projectName, setProjectName] = useState('')
  const [values, setValues] = useState<ProjectPixelSettings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/projects/${projectId}`)
        if (!res.ok) throw new Error('Failed to load project')
        const { project } = (await res.json()) as ProjectResponse
        setProjectName(project.name)
        const settings = (project.settings || {}) as Record<string, unknown>
        const initial: ProjectPixelSettings = {}
        for (const field of PROJECT_PIXEL_FIELDS) {
          const v = settings[field.key]
          if (typeof v === 'string') initial[field.key] = v
        }
        setValues(initial)
      } catch (err) {
        console.error('Error:', err)
        setError('No se pudo cargar el proyecto')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      // Enviar TODAS las claves: string vacío borra la clave en el merge
      // server-side (permite limpiar un pixel), valor la crea/actualiza.
      const settings: Record<string, string> = {}
      for (const field of PROJECT_PIXEL_FIELDS) {
        settings[field.key] = (values[field.key] ?? '').trim()
      }
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Failed to save')
      }
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <Link
        href="/admin/projects"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Proyectos
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Pixels{projectName ? ` — ${projectName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tags de tracking site-wide para la web de este proyecto. La web los lee en su
          siguiente build/deploy — guardar aquí no los publica al instante.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Cargando…</p>
      ) : (
        <Card>
          <CardBody className="space-y-5">
            {PROJECT_PIXEL_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {field.label}
                </label>
                <Input
                  value={values[field.key] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  placeholder={field.placeholder}
                  className="font-mono text-sm"
                />
                {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
              </div>
            ))}

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar pixels'}
              </Button>
              {saved && <span className="text-sm text-green-600">Guardado ✓</span>}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
