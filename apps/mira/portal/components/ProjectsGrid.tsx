'use client'

import Link from 'next/link'
import { ArrowRight, Pin, Plus } from 'lucide-react'
import { useActiveProject } from '@/lib/project-context'
import { t } from '@/lib/i18n'

export interface ProjectCardData {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  created_at: string
}

type Locale = Parameters<typeof t>[1]

function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })
}

/**
 * Rejilla de proyectos del cliente activo: la misma en la home y en /projects
 * (entrada propia del menú desde el 13-oct-2026; la auditoría AS-IS señaló que
 * los proyectos «solo se veían en la home»). El clic en la tarjeta fija o
 * quita el proyecto activo; el enlace al detalle va aparte para no mezclar
 * gestos.
 */
export default function ProjectsGrid({ projects, brand, locale, header = true }: {
  projects: ProjectCardData[]
  brand: string
  locale: Locale
  /** Fila de título + «Nuevo proyecto» encima de la rejilla (la home la usa; /projects tiene su propia cabecera). */
  header?: boolean
}) {
  const { activeProject, setActiveProject } = useActiveProject()

  return (
    <>
      {header && (
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            {t('home.projects-title', locale)}
          </p>
          <Link href="/projects/new"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all hover:bg-surface-hover"
            style={{ color: brand }}>
            <Plus size={12} /> {t('home.new-project', locale)}
          </Link>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-subtle bg-surface py-8 text-center">
          <p className="mb-1 text-xs text-ink-tertiary">{t('home.projects-empty-title', locale)}</p>
          <p className="mb-3 text-[11px] text-ink-muted">{t('home.projects-empty-desc', locale)}</p>
          <Link href="/projects/new" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
            style={{ background: `${brand}20`, color: brand, border: `1px solid ${brand}30` }}>
            <Plus size={12} /> {t('home.projects-empty-cta', locale)}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const isActive = activeProject?.id === p.id
            const togglePin = () =>
              setActiveProject(isActive ? null : { id: p.id, name: p.name, slug: p.slug, status: p.status })
            return (
              <div key={p.id}
                role="button" tabIndex={0}
                onClick={togglePin}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePin() } }}
                title={isActive ? t('projects.unset-active', locale) : t('projects.set-active', locale)}
                className="group cursor-pointer rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: isActive ? `${brand}0d` : 'var(--bg-surface)',
                  borderColor: isActive ? `${brand}66` : 'var(--border)',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = `${brand}45` }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  {isActive ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium"
                      style={{ background: `${brand}22`, color: brand }}>
                      <Pin size={9} /> {t('projects.active-badge', locale)}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium"
                      style={p.status === 'paused'
                        ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }
                        : { background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                      {t(`projects.status.${p.status}`, locale)}
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mb-3 line-clamp-2 text-[11px] text-ink-muted">{p.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted">{fmtDate(p.created_at, locale)}</span>
                  <Link href={`/projects/${p.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[10px] font-medium transition-opacity hover:opacity-80"
                    style={{ color: brand }}>
                    {t('projects.view-detail', locale)} <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
