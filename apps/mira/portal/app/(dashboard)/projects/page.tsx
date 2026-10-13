'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Syne } from 'next/font/google'
import { Loader2, Plus } from 'lucide-react'
import { useProjects } from '@/lib/hooks/useProjects'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'
import ProjectsGrid from '@/components/ProjectsGrid'

const syne = Syne({ subsets: ['latin'], weight: ['700', '800'] })
const FALLBACK_BRAND = '#8B5CF6'

// Listado de proyectos del cliente activo. Hasta el 13-oct-2026 solo existían
// /projects/new y /projects/[slug]: la lista vivía en la home y no había entrada
// en el menú (auditoría AS-IS de Alessandro, 16-sep).
export default function ProjectsPage() {
  const { activeClient, loading: clientLoading } = useActiveClient()
  const { projects, loading, error } = useProjects()
  const { locale } = useLocaleContext()
  const brand = activeClient?.primaryColor || FALLBACK_BRAND

  // Nada se pinta hasta que el cliente activo ha cargado (igual que la home):
  // el servidor no conoce el idioma elegido (localStorage) y un título
  // traducido en el primer render daba el error de hidratación #418 que ya
  // tienen /projects/new y el detalle de proyecto.
  if (clientLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={18} className="animate-spin text-ink-muted" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10" style={{ ['--client-primary' as string]: brand }}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {activeClient?.name && (
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: brand }}>{activeClient.name}</p>
          )}
          <h1 className={`${syne.className} text-3xl font-extrabold tracking-tight text-ink`}>{t('projects.title', locale)}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-secondary">{t('projects.subtitle', locale)}</p>
        </div>
        <Link href="/projects/new" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
          style={{ background: `${brand}20`, color: brand, border: `1px solid ${brand}30` }}>
          <Plus size={12} /> {t('projects.new', locale)}
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-red-400">{t('projects.loading-error', locale)}: {error}</p>
      ) : (
        <ProjectsGrid projects={projects} brand={brand} locale={locale} header={false} />
      )}
    </div>
  )
}
