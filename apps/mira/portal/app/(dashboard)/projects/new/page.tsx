'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useProjectManagement } from '@/lib/hooks/useProjectManagement'
import { useActiveClient } from '@/lib/client-context'

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] })
const FALLBACK_BRAND = '#8B5CF6'

export default function NewProjectPage() {
  const router = useRouter()
  const { activeClient } = useActiveClient()
  const { createProject, loading, error } = useProjectManagement()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const brand = activeClient?.primaryColor || FALLBACK_BRAND

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const project = await createProject({ name, description })
    if (project) router.push(`/projects/${project.slug}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/home" className="mb-6 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
        style={{ color: brand }}>
        <ArrowLeft size={14} /> Volver a Home
      </Link>

      <div className="mb-8">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: brand }}>
          {activeClient?.name ? `Proyecto para ${activeClient.name}` : 'Nuevo proyecto'}
        </p>
        <h1 className={`${syne.className} text-3xl font-extrabold tracking-tight text-ink`}>Crear proyecto</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Una campaña, un lanzamiento, una iniciativa. El proyecto agrupa su memoria,
          sus entregables y su documentación para que los agentes trabajen con contexto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-line bg-surface p-8">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink-secondary">
            Nombre del proyecto *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Lanzamiento web, Campaña de verano"
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink placeholder-ink-tertiary focus:outline-none"
            style={{ borderColor: name ? `${brand}50` : undefined }}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink-secondary">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo del proyecto, alcance, fechas clave…"
            className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-2.5 text-ink placeholder-ink-tertiary focus:outline-none"
            rows={4}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 text-sm text-red-300">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition disabled:opacity-40"
          style={{ background: brand, boxShadow: `0 8px 24px ${brand}35` }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Creando…' : 'Crear proyecto'}
        </button>
      </form>
    </div>
  )
}
