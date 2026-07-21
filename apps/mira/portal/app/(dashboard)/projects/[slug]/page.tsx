'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import { ArrowLeft, Loader2, Pin } from 'lucide-react'
import { useProjectManagement } from '@/lib/hooks/useProjectManagement'
import { useActiveClient } from '@/lib/client-context'
import { useActiveProject } from '@/lib/project-context'

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] })
const FALLBACK_BRAND = '#8B5CF6'

type Project = Database['public']['Tables']['mira_projects']['Row']

interface MemoryEntry {
  id: string
  title: string
  category: string
  summary: string | null
  created_at: string
  is_pinned: boolean
}

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, setProject] = useState<Project | null>(null)
  const [memory, setMemory] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { archiveProject } = useProjectManagement()
  const { activeClient } = useActiveClient()
  const { setActiveProject } = useActiveProject()

  const brand = activeClient?.primaryColor || FALLBACK_BRAND

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
        const { data, error: fetchError } = await supabase
          .from('mira_projects')
          .select('*')
          .eq('slug', resolvedParams.slug)
          .single()
        if (fetchError) throw fetchError
        setProject(data)

        // Memoria del proyecto (inline)
        const { data: mem } = await supabase
          .from('project_memory')
          .select('id, title, category, summary, created_at, is_pinned')
          .eq('project_id', data.id)
          .eq('is_archived', false)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(6)
        setMemory((mem as MemoryEntry[]) ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [params, supabase])

  // Al entrar al detalle, este proyecto pasa a ser el activo: quick actions y
  // chat escribirán en él. Solo si pertenece al cliente activo y no está archivado.
  useEffect(() => {
    if (!project || project.status === 'archived') return
    if (activeClient?.id && project.client_id && project.client_id !== activeClient.id) return
    setActiveProject({ id: project.id, name: project.name, slug: project.slug, status: project.status })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.status, activeClient?.id])

  const handleArchive = async () => {
    if (!project || !confirm('¿Archivar este proyecto? Podrás restaurarlo después.')) return
    await archiveProject(project.id)
    setProject({ ...project, status: 'archived' })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={18} className="animate-spin text-[#444]" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link href="/home" className="mb-4 inline-block text-sm" style={{ color: brand }}>
          ← Volver a Home
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error || 'Proyecto no encontrado'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
        style={{ color: brand }}>
        <ArrowLeft size={14} /> Volver a Home
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 p-7"
        style={{ background: `linear-gradient(135deg, ${brand}0e 0%, rgba(255,255,255,0.02) 60%)` }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: brand }}>
              Proyecto{activeClient?.name ? ` · ${activeClient.name}` : ''}
            </p>
            <h1 className={`${syne.className} text-3xl font-extrabold tracking-tight text-white`}>{project.name}</h1>
            {project.description && <p className="mt-2 max-w-xl text-sm text-gray-400">{project.description}</p>}
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            project.status === 'active' ? 'bg-green-500/20 text-green-400'
              : project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {project.status === 'active' ? 'Activo' : project.status === 'paused' ? 'Pausado' : 'Archivado'}
          </span>
        </div>
      </div>

      {/* Trabajar en este proyecto */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href={`/agent/orchestrator?project=${project.id}`}
          className="group rounded-2xl border border-white/10 bg-white/3 p-5 transition hover:-translate-y-0.5"
          style={{ boxShadow: `inset 0 3px 0 0 ${brand}` }}>
          <p className="text-sm font-semibold text-white">💬 Chatear con contexto</p>
          <p className="mt-1.5 text-[11px] text-gray-500">
            Lo que se decida aquí se guarda en la memoria de este proyecto.
          </p>
        </Link>
        <Link href="/toolkit"
          className="group rounded-2xl border border-white/10 bg-white/3 p-5 transition hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-white">⚡ Generar entregable</p>
          <p className="mt-1.5 text-[11px] text-gray-500">
            Reportes, documentos y presentaciones con el conocimiento de marca.
          </p>
        </Link>
        <Link href="/integrations"
          className="group rounded-2xl border border-white/10 bg-white/3 p-5 transition hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-white">📂 Carpeta de Drive</p>
          <p className="mt-1.5 text-[11px] text-gray-500">
            Conecta o sincroniza las carpetas del cliente desde Integraciones.
          </p>
        </Link>
      </div>

      {/* Memoria del proyecto */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Memoria del proyecto
          </p>
          <Link href={`/project-memory?project=${project.id}`}
            className="text-[11px] font-medium transition-opacity hover:opacity-80" style={{ color: brand }}>
            Ver toda →
          </Link>
        </div>

        {memory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 py-8 text-center">
            <p className="text-xs text-gray-500">
              Aún no hay memoria. Chatea con los agentes con este proyecto activo y las
              decisiones importantes se guardarán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memory.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 p-4">
                {m.is_pinned && <Pin size={12} className="mt-0.5 shrink-0" style={{ color: brand }} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-white">{m.title}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{ background: `${brand}15`, color: brand }}>
                      {m.category}
                    </span>
                  </div>
                  {m.summary && <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{m.summary}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-gray-600">
                  {new Date(m.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archivar */}
      <div className="flex items-center justify-between rounded-2xl border border-red-900/30 bg-red-950/20 p-5">
        <div>
          <p className="text-sm font-semibold text-red-400">
            {project.status === 'archived' ? 'Proyecto archivado' : 'Archivar proyecto'}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {project.status === 'archived'
              ? 'Este proyecto está archivado.'
              : 'Lo retira de tu lista activa; podrás restaurarlo.'}
          </p>
        </div>
        <button
          onClick={handleArchive}
          disabled={project.status === 'archived'}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:bg-gray-700"
        >
          {project.status === 'archived' ? 'Archivado' : 'Archivar'}
        </button>
      </div>
    </div>
  )
}
