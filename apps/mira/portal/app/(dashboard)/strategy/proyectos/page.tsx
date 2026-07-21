'use client'

// Proyectos reales del cliente activo (mira_projects) — sustituye el antiguo
// mock estático de "Innovation Portfolio" con horizontes hardcodeados.

import Link from 'next/link'
import { Plus, ArrowRight, Loader2, FolderKanban, AlertCircle } from 'lucide-react'
import AgentWorkspace from '@/components/agent-workspace'
import { useProjects } from '@/lib/hooks/useProjects'
import { useLocale } from '@/lib/use-locale'
import { t } from '@/lib/i18n'

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  paused: 'bg-yellow-500/10 text-yellow-400',
  archived: 'bg-card text-ink-muted',
}

export default function Page() {
  const { projects, loading, error } = useProjects()
  const { locale } = useLocale()

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(34,197,94,0.8)' }}>
            Strategy · Venture
          </p>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">{t('projects.title', locale)}</h1>
          <p className="text-sm mt-1 text-ink-secondary">{t('projects.subtitle', locale)}</p>
        </div>
        <Link href="/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-line px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-white/10">
          <Plus size={13} /> {t('projects.new', locale)}
        </Link>
      </div>

      {/* Estado de carga / error / vacío / lista */}
      {loading ? (
        <div className="mb-8 flex items-center justify-center rounded-2xl bg-card border border-line py-14">
          <Loader2 size={22} className="animate-spin text-ink-muted" />
        </div>
      ) : error ? (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-card p-4">
          <AlertCircle size={18} className="shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">{t('projects.loading-error', locale)}</p>
            <p className="mt-0.5 text-xs text-ink-secondary">{error}</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="mb-8 rounded-2xl border border-dashed border-line bg-card py-10 text-center">
          <FolderKanban size={28} className="mx-auto mb-3 text-ink-muted" />
          <p className="mb-1 text-xs text-ink-secondary">{t('projects.empty', locale)}</p>
          <p className="mb-4 text-[11px] text-ink-muted">{t('projects.empty-hint', locale)}</p>
          <Link href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-line px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-white/10">
            <Plus size={12} /> {t('projects.empty-cta', locale)}
          </Link>
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 rounded-2xl bg-card border border-line p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{p.name}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${STATUS_BADGE[p.status] ?? STATUS_BADGE.active}`}>
                  {t(`projects.status.${p.status}`, locale)}
                </span>
              </div>
              {p.description && (
                <p className="line-clamp-2 text-[11px] text-ink-secondary">{p.description}</p>
              )}
              <div className="mt-auto flex items-center justify-between border-t border-line-subtle pt-2.5">
                <span className="text-[10px] text-ink-muted">{fmtDate(p.created_at)}</span>
                <Link href={`/projects/${p.slug}`}
                  className="flex items-center gap-1 text-[11px] font-medium text-ink-secondary transition-colors hover:text-ink">
                  {t('projects.view-detail', locale)} <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <AgentWorkspace
        role="blueprint"
        agentName="Venture"
        agentEmoji="🚀"
        color="#22C55E"
        gradient="from-green-500 to-emerald-700"
        title="Manage your innovation projects"
        description="Describe your idea or initiative. Venture scopes the MVP, sets OKRs and builds the roadmap."
        placeholder="E.g.: I want to build an AI voice agent for restaurant reservations. We have the technology but no roadmap. Help me scope the MVP and define success metrics."
        quickPrompts={[
          { label: '🚀 Scope my MVP', prompt: 'Help me scope an MVP for my idea. What are the minimum features to validate the hypothesis? Give me a 2-week sprint plan.' },
          { label: '📊 OKRs for innovation', prompt: 'Help me define OKRs for an innovation project. I need objectives that distinguish between learning (H3) and execution (H1).' },
          { label: '🗺️ Innovation roadmap', prompt: 'Build me a 6-month innovation roadmap with 3 horizons. Include: key milestones, go/no-go decision points and resource allocation.' },
          { label: '❌ Kill criteria', prompt: 'What criteria should I use to decide when to kill an innovation project? Give me a kill/continue decision framework.' },
        ]}
      />
    </div>
  )
}
