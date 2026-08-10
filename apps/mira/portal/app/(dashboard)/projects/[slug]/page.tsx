'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { createBrowserSupabaseClient } from '@sf/supabase'
import type { Database } from '@/types/database'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import { ArrowLeft, Loader2, Pin, AlertCircle, FolderOpen } from 'lucide-react'
import { useProjectManagement } from '@/lib/hooks/useProjectManagement'
import { useActiveClient } from '@/lib/client-context'
import { useActiveProject } from '@/lib/project-context'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

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

interface ProjectDeliverable {
  id: string
  tool_slug: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | string
  created_at: string
}

interface DriveFolderRow {
  id: string
  folder_id: string
  folder_name: string | null
  purpose: string
  sync_status: string
  last_synced_at: string | null
  files_synced: number
  project_id?: string | null
}

function deliverableToolMeta(slug: string) {
  const tool = TOOLKIT_TOOLS.find((tl) => tl.slug === slug)
  return {
    icon: tool?.icon || (slug.startsWith('doc-') ? '📄' : '⚡'),
    name:
      tool?.name ||
      slug.replace(/^doc-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }
}

export default function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [project, setProject] = useState<Project | null>(null)
  const [memory, setMemory] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { archiveProject } = useProjectManagement()
  const { activeClient } = useActiveClient()
  const { setActiveProject } = useActiveProject()
  const { locale } = useLocaleContext()

  // Entregables del proyecto
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [deliverablesLoading, setDeliverablesLoading] = useState(true)

  // Carpeta Drive vinculada al proyecto
  const [projectFolders, setProjectFolders] = useState<DriveFolderRow[]>([])
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null)
  const [driveLoading, setDriveLoading] = useState(true)
  const [showLinkForm, setShowLinkForm] = useState(false)
  // P2: la carpeta vinculada puede ser Conocimiento (el cerebro la lee, con
  // scope de proyecto) o Entregables (destino de exportación)
  const [linkPurpose, setLinkPurpose] = useState<'references' | 'deliverables'>('references')
  const [creatingStructure, setCreatingStructure] = useState(false)
  const [folderLink, setFolderLink] = useState('')
  const [linking, setLinking] = useState(false)
  const [driveMessage, setDriveMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const brand = activeClient?.primaryColor || FALLBACK_BRAND

  const supabase = useMemo(() =>
    createBrowserSupabaseClient(
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
        // Filtro de cliente EXPLÍCITO: buscar solo por slug delegaba el
        // aislamiento por completo a RLS (auditoría 2026-08-10). Con el
        // cliente activo resuelto, se acota; sin él (carga inicial), la
        // consulta espera a la siguiente pasada del efecto.
        let query = supabase.from('mira_projects').select('*').eq('slug', resolvedParams.slug)
        if (activeClient?.id) query = query.eq('client_id', activeClient.id)
        const { data, error: fetchError } = await query.single()
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
        setError(err instanceof Error ? err.message : t('projects.load-failed', locale))
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [params, supabase, activeClient?.id])

  // Entregables del proyecto. La ruta puede no existir aún en dev (404) —
  // en ese caso se muestra el empty state sin error.
  useEffect(() => {
    if (!project?.id) return
    let cancelled = false
    const fetchDeliverables = async () => {
      setDeliverablesLoading(true)
      try {
        const res = await fetch(`/api/projects/${project.id}/deliverables`)
        if (cancelled) return
        if (!res.ok) {
          setDeliverables([])
          return
        }
        const json = await res.json().catch(() => null)
        if (cancelled) return
        setDeliverables(Array.isArray(json?.deliverables) ? json.deliverables : [])
      } catch {
        if (!cancelled) setDeliverables([])
      } finally {
        if (!cancelled) setDeliverablesLoading(false)
      }
    }
    fetchDeliverables()
    return () => { cancelled = true }
  }, [project?.id])

  // Carpetas Drive del cliente → nos quedamos con las vinculadas a este proyecto
  const loadDriveFolders = useMemo(() => {
    return async (clientId: string, projectId: string) => {
      try {
        const res = await fetch(
          `/api/brand-brain/drive/folders?clientId=${clientId}&projectId=${projectId}`
        )
        if (!res.ok) return
        const json = await res.json()
        const rows: DriveFolderRow[] = Array.isArray(json?.folders) ? json.folders : []
        // La API devuelve todas las carpetas del cliente; filtramos por proyecto.
        setProjectFolders(rows.filter((f) => f.project_id === projectId))
        if (typeof json?.connected === 'boolean') setDriveConnected(json.connected)
      } catch { /* silencioso */ }
    }
  }, [])

  useEffect(() => {
    const clientId = activeClient?.id || project?.client_id
    if (!project?.id || !clientId) return
    let cancelled = false
    setDriveLoading(true)
    loadDriveFolders(clientId, project.id).finally(() => {
      if (!cancelled) setDriveLoading(false)
    })
    return () => { cancelled = true }
  }, [project?.id, project?.client_id, activeClient?.id, loadDriveFolders])

  const handleLinkFolder = async () => {
    const clientId = activeClient?.id || project?.client_id
    if (!project?.id || !clientId || !folderLink.trim() || linking) return
    setLinking(true)
    setDriveMessage(null)
    try {
      const res = await fetch('/api/brand-brain/drive/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          link: folderLink.trim(),
          purpose: linkPurpose,
          projectId: project.id,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || t('projects.drive-link-error', locale))
      setFolderLink('')
      setShowLinkForm(false)
      setDriveMessage({ type: 'ok', text: t('projects.drive-link-success', locale) })
      await loadDriveFolders(clientId, project.id)
    } catch (e) {
      setDriveMessage({
        type: 'err',
        text: e instanceof Error ? e.message : t('projects.drive-link-error', locale),
      })
    } finally {
      setLinking(false)
    }
  }

  // P2: crea "MIRA — {Proyecto}/(Conocimiento|Entregables)" en el Drive del
  // cliente y registra ambas carpetas vinculadas a este proyecto.
  const handleCreateStructure = async () => {
    const clientId = activeClient?.id || project?.client_id
    if (!project?.id || !clientId || creatingStructure) return
    setCreatingStructure(true)
    setDriveMessage(null)
    try {
      const res = await fetch(`/api/projects/${project.id}/drive-structure`, { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Could not create the structure')
      setDriveMessage({ type: 'ok', text: json?.already ? 'The structure already existed.' : 'Structure created in the client Drive.' })
      await loadDriveFolders(clientId, project.id)
    } catch (e) {
      setDriveMessage({ type: 'err', text: e instanceof Error ? e.message : 'Could not create the structure' })
    } finally {
      setCreatingStructure(false)
    }
  }

  // Al entrar al detalle, este proyecto pasa a ser el activo: quick actions y
  // chat escribirán en él. Solo si pertenece al cliente activo y no está archivado.
  useEffect(() => {
    if (!project || project.status === 'archived') return
    if (activeClient?.id && project.client_id && project.client_id !== activeClient.id) return
    setActiveProject({ id: project.id, name: project.name, slug: project.slug, status: project.status })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, project?.status, activeClient?.id])

  const handleArchive = async () => {
    if (!project || !confirm(t('projects.archive-confirm', locale))) return
    await archiveProject(project.id)
    setProject({ ...project, status: 'archived' })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={18} className="animate-spin text-ink-muted" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link href="/home" className="mb-4 inline-block text-sm" style={{ color: brand }}>
          ← {t('projects.back-home', locale)}
        </Link>
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error || t('projects.not-found', locale)}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <Link href="/home" className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
        style={{ color: brand }}>
        <ArrowLeft size={14} /> {t('projects.back-home', locale)}
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-line p-7"
        style={{ background: `linear-gradient(135deg, ${brand}0e 0%, rgba(255,255,255,0.02) 60%)` }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: brand }}>
              {t('projects.selector-label', locale)}{activeClient?.name ? ` · ${activeClient.name}` : ''}
            </p>
            <h1 className={`${syne.className} text-3xl font-extrabold tracking-tight text-ink`}>{project.name}</h1>
            {project.description && <p className="mt-2 max-w-xl text-sm text-ink-secondary">{project.description}</p>}
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            project.status === 'active' ? 'bg-green-500/20 text-green-400'
              : project.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-surface-hover text-ink-secondary'
          }`}>
            {project.status === 'active' ? t('projects.status.active', locale) : project.status === 'paused' ? t('projects.status.paused', locale) : t('projects.status.archived', locale)}
          </span>
        </div>
      </div>

      {/* Trabajar en este proyecto */}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href={`/agent/orchestrator?project=${project.id}`}
          className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5"
          style={{ boxShadow: `inset 0 3px 0 0 ${brand}` }}>
          <p className="text-sm font-semibold text-ink">💬 {t('projects.work-chat', locale)}</p>
          <p className="mt-1.5 text-[11px] text-ink-tertiary">
            {t('projects.work-chat-desc', locale)}
          </p>
        </Link>
        <Link href="/toolkit"
          className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-ink">⚡ {t('projects.work-deliverable', locale)}</p>
          <p className="mt-1.5 text-[11px] text-ink-tertiary">
            {t('projects.work-deliverable-desc', locale)}
          </p>
        </Link>
        <Link href="/integrations"
          className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-0.5">
          <p className="text-sm font-semibold text-ink">📂 {t('projects.work-drive', locale)}</p>
          <p className="mt-1.5 text-[11px] text-ink-tertiary">
            {t('projects.work-drive-desc', locale)}
          </p>
        </Link>
      </div>

      {/* Entregables del proyecto */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            {t('projects.deliverables', locale)}
          </p>
          <Link href="/toolkit" className="text-[11px] font-medium transition-opacity hover:opacity-80"
            style={{ color: brand }}>
            {t('projects.deliverables-empty-cta', locale)} →
          </Link>
        </div>

        {deliverablesLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-line bg-surface py-8">
            <Loader2 size={16} className="animate-spin text-ink-muted" />
          </div>
        ) : deliverables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface py-8 text-center">
            <p className="text-xs text-ink-tertiary">{t('projects.deliverables-empty', locale)}</p>
            <p className="mt-1 text-[11px] text-ink-tertiary">{t('projects.deliverables-empty-hint', locale)}</p>
            <Link href="/toolkit"
              className="mt-4 inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: brand }}>
              ⚡ {t('projects.deliverables-empty-cta', locale)}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {deliverables.map((d) => {
              const meta = deliverableToolMeta(d.tool_slug)
              const statusKey = ['queued', 'processing', 'completed', 'failed'].includes(d.status)
                ? d.status
                : 'queued'
              const card = (
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:bg-surface-hover">
                  <span className="text-xl leading-none">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{meta.name}</p>
                    <p className="mt-0.5 text-[10px] text-ink-tertiary">
                      {new Date(d.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    d.status === 'completed' ? 'bg-green-500/15 text-green-400'
                      : d.status === 'failed' ? 'bg-red-500/15 text-red-400'
                      : 'bg-blue-500/15 text-blue-300'
                  }`}>
                    {(d.status === 'processing' || d.status === 'queued') && (
                      <Loader2 size={10} className="animate-spin" />
                    )}
                    {d.status === 'failed' && <AlertCircle size={10} />}
                    {d.status === 'completed'
                      ? t('projects.deliverable-view', locale)
                      : t(`projects.deliverable-status.${statusKey}`, locale)}
                  </span>
                </div>
              )
              return d.status === 'completed' ? (
                <Link key={d.id} href={`/toolkit/report/${d.id}`}>{card}</Link>
              ) : (
                <div key={d.id}>{card}</div>
              )
            })}
          </div>
        )}
      </div>

      {/* Carpeta Drive */}
      <div>
        <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          {t('projects.drive-title', locale)}
        </p>

        {driveLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-line bg-surface py-6">
            <Loader2 size={16} className="animate-spin text-ink-muted" />
          </div>
        ) : (
          <div className="space-y-2">
            {projectFolders.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                <FolderOpen size={16} className="shrink-0" style={{ color: brand }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {f.folder_name || f.folder_id}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-tertiary">
                    {f.purpose === 'deliverables' ? '📦 Deliverables — MIRA exports here' : '📚 Knowledge — the brain reads it for this project'}
                    {f.last_synced_at
                      ? ` · ${t('projects.drive-docs-count', locale).replace('{count}', String(f.files_synced))}`
                      : f.purpose === 'deliverables' ? '' : ` · ${t('projects.drive-unsynced', locale)}`}
                  </p>
                </div>
                <a
                  href={`https://drive.google.com/drive/folders/${f.folder_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-surface-hover px-3 py-1.5 text-[10px] font-medium text-ink transition hover:opacity-80"
                >
                  Drive ↗
                </a>
              </div>
            ))}

            {projectFolders.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line bg-surface p-5">
                <p className="text-xs text-ink-tertiary">
                  Connect this project to its folders: <strong>Knowledge</strong> (briefs, docs, references — the brain and the agents read it first when working on this project) and <strong>Deliverables</strong> (this is where MIRA exports).
                </p>
                {driveConnected === false && (
                  <p className="mt-2 text-[11px] text-amber-400/80">
                    {t('projects.drive-not-connected', locale)}{' '}
                    <Link href="/integrations" className="underline">{t('nav.integrations', locale)}</Link>
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleCreateStructure}
                disabled={driveConnected === false || creatingStructure}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: brand }}
              >
                {creatingStructure ? '⏳ Creating…' : '✨ Create standard structure'}
              </button>
              {!showLinkForm ? (
                <button
                  onClick={() => setShowLinkForm(true)}
                  disabled={driveConnected === false}
                  className="rounded-lg bg-surface-hover px-4 py-2 text-xs font-semibold text-ink transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  📂 {t('projects.drive-link-cta', locale)}
                </button>
              ) : (
                <div className="flex w-full flex-col gap-2 md:flex-row">
                  <select
                    value={linkPurpose}
                    onChange={(e) => setLinkPurpose(e.target.value as 'references' | 'deliverables')}
                    className="rounded-lg border border-line bg-page px-3 py-2 text-xs text-ink outline-none focus:border-ink-muted"
                  >
                    <option value="references">📚 Knowledge</option>
                    <option value="deliverables">📦 Deliverables</option>
                  </select>
                  <input
                    value={folderLink}
                    onChange={(e) => setFolderLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLinkFolder()}
                    placeholder={t('projects.drive-link-placeholder', locale)}
                    className="flex-1 rounded-lg border border-line bg-page px-3 py-2 text-xs text-ink outline-none focus:border-ink-muted"
                  />
                  <button
                    onClick={handleLinkFolder}
                    disabled={linking || !folderLink.trim()}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                    style={{ background: brand }}
                  >
                    {linking ? t('projects.drive-linking', locale) : t('projects.drive-link-cta', locale)}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {driveMessage && (
          <p className={`mt-2 text-xs ${driveMessage.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {driveMessage.text}
          </p>
        )}
      </div>

      {/* Memoria del proyecto */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Project memory
          </p>
          <Link href={`/project-memory?project=${project.id}`}
            className="text-[11px] font-medium transition-opacity hover:opacity-80" style={{ color: brand }}>
            View all →
          </Link>
        </div>

        {memory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface py-8 text-center">
            <p className="text-xs text-ink-tertiary">
              No memory yet. Chat with the agents while this project is active and the
              important decisions will be saved here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {memory.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
                {m.is_pinned && <Pin size={12} className="mt-0.5 shrink-0" style={{ color: brand }} />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-ink">{m.title}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide"
                      style={{ background: `${brand}15`, color: brand }}>
                      {m.category}
                    </span>
                  </div>
                  {m.summary && <p className="mt-1 line-clamp-2 text-[11px] text-ink-tertiary">{m.summary}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-ink-tertiary">
                  {new Date(m.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' })}
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
            {project.status === 'archived' ? 'Project archived' : 'Archive project'}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-tertiary">
            {project.status === 'archived'
              ? 'This project is archived.'
              : 'It is removed from your active list; you can restore it later.'}
          </p>
        </div>
        <button
          onClick={handleArchive}
          disabled={project.status === 'archived'}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:bg-card disabled:text-ink-secondary"
        >
          {project.status === 'archived' ? 'Archived' : 'Archive'}
        </button>
      </div>
    </div>
  )
}
