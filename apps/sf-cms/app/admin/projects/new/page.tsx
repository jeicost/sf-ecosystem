'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, ShieldAlert } from 'lucide-react'
import { createProject } from '../actions'
import { Button, Card, CardBody, Input, Label, HelpText, InlineMessage } from '@/components/ui'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [newProjectId, setNewProjectId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [formData, setFormData] = useState({ name: '', slug: '', domain: '' })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('name', formData.name)
    fd.append('slug', formData.slug)
    fd.append('domain', formData.domain)

    const result = await createProject(fd)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Reveal-once: this is the only moment the raw key is ever shown again.
    setRevealedKey(result.apiKey ?? null)
    setNewProjectId(result.project?.id ?? null)
    setLoading(false)
  }

  if (revealedKey) {
    return (
      <div className="mx-auto max-w-lg px-8 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Proyecto creado</h1>

        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Copia esta API key ahora — no se volverá a mostrar nunca más.
            </p>
            <code className="mb-3 block break-all rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-800">
              {revealedKey}
            </code>
            <Button
              type="button"
              size="sm"
              variant={copied ? 'secondary' : 'primary'}
              onClick={() => {
                navigator.clipboard.writeText(revealedKey)
                setCopied(true)
              }}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copiada
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copiar
                </>
              )}
            </Button>
          </CardBody>
        </Card>

        <label className="mb-5 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
          />
          Ya la copié y la guardé (ej. en las env vars de Vercel del sitio)
        </label>

        <div className="flex gap-3">
          <Button type="button" disabled={!confirmed} onClick={() => router.push('/admin/projects')}>
            Continuar
          </Button>
          {newProjectId && (
            <Button
              type="button"
              variant="secondary"
              disabled={!confirmed}
              onClick={() => router.push(`/admin/projects/${newProjectId}/brief`)}
            >
              Empezar el brief de esta landing
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          El brief es una conversación por chat que recoge todo lo necesario para que el equipo
          técnico construya la web — no la crea por sí solo.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-8 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Create New Project</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
            disabled={loading}
            placeholder="e.g., My Client Site"
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))
            }
            required
            disabled={loading}
            placeholder="e.g., my-client-site"
          />
          <HelpText>URL-friendly identifier, must be unique</HelpText>
        </div>

        <div>
          <Label htmlFor="domain">Domain (optional)</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData((prev) => ({ ...prev, domain: e.target.value }))}
            disabled={loading}
            placeholder="e.g., example.com"
          />
        </div>

        {error && <InlineMessage kind="error">{error}</InlineMessage>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Project'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
