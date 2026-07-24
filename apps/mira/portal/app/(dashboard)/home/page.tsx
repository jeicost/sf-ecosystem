'use client'

// Home del cliente — portada operativa estilo ai-agency:
// hero con su marca, analíticas clave, carruseles de últimos reportes y
// documentos, y proyectos. El super_admin sin cliente activo va a /admin.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Syne } from 'next/font/google'
import { Loader2, ArrowRight, Plus, ChevronRight, Pin, Lock, X } from 'lucide-react'
import { getUser, isSuperAdmin } from '@/lib/auth'
import { useActiveClient } from '@/lib/client-context'
import { useActiveProject } from '@/lib/project-context'
import { useLocale } from '@/lib/use-locale'
import { t } from '@/lib/i18n'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'
import { DEPARTMENT_METADATA } from '@/lib/department-meta'
import { minPlanForSection } from '@/lib/plans'
import OnboardingModal from '@/components/onboarding-modal'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'] })
const FALLBACK_BRAND = '#8B5CF6'

interface Card {
  id: string
  tool_slug: string
  created_at: string
  topic: string | null
  score: number | null
}

interface Overview {
  client: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string | null
  }
  stats: {
    reports_total: number
    reports_month: number
    documents_total: number
    pending_approvals: number
    usage_cost_usd: number
  }
  latest_reports: Card[]
  latest_documents: Card[]
  projects: { id: string; name: string; slug: string; description: string | null; status: string; created_at: string }[]
}

const DOC_LABELS: Record<string, { icon: string; name: string }> = {
  'doc-deck': { icon: '📊', name: 'Presentación' },
  'doc-playbook': { icon: '📘', name: 'Playbook' },
  'doc-onepager': { icon: '📄', name: 'One-pager' },
  'doc-proposal': { icon: '📝', name: 'Propuesta' },
  'doc-report': { icon: '📈', name: 'Informe' },
}

function toolMeta(slug: string) {
  if (slug.startsWith('doc-')) {
    const doc = DOC_LABELS[slug]
    return { icon: doc?.icon ?? '📄', name: doc?.name ?? 'Documento' }
  }
  const tool = TOOLKIT_TOOLS.find((t) => t.slug === slug)
  return {
    icon: tool?.icon ?? '⚡',
    name: tool?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ─── Carrusel horizontal de entregables ──────────────────────
function Carousel({
  title,
  items,
  hrefFor,
  viewAllHref,
  emptyText,
  emptyCta,
  brand,
}: {
  title: string
  items: Card[]
  hrefFor: (c: Card) => string
  viewAllHref: string
  emptyText: string
  emptyCta: { label: string; href: string }
  brand: string
}) {
  return (
    <div className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          {title}
        </p>
        <Link href={viewAllHref} className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-ink" style={{ color: brand }}>
          Ver todos <ChevronRight size={12} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-subtle bg-surface py-8 text-center">
          <p className="mb-3 text-xs text-ink-tertiary">{emptyText}</p>
          <Link href={emptyCta.href} className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
            style={{ background: `${brand}20`, color: brand, border: `1px solid ${brand}30` }}>
            <Plus size={12} /> {emptyCta.label}
          </Link>
        </div>
      ) : (
        <div className="flex snap-x gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {items.map((c) => {
            const meta = toolMeta(c.tool_slug)
            return (
              <Link key={c.id} href={hrefFor(c)}
                className="group w-56 shrink-0 snap-start rounded-2xl border border-line bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${brand}45` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
                    style={{ background: `${brand}14`, border: `1px solid ${brand}22` }}>
                    {meta.icon}
                  </div>
                  {typeof c.score === 'number' && (
                    <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                      style={{ background: `${brand}16`, color: brand }}>
                      {c.score}/100
                    </span>
                  )}
                </div>
                <p className="mb-0.5 truncate text-[13px] font-semibold text-ink">{meta.name}</p>
                <p className="truncate text-[11px] text-ink-muted">
                  {c.topic || fmtDate(c.created_at)}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-line-subtle pt-2">
                  <span className="text-[10px] text-ink-muted">{fmtDate(c.created_at)}</span>
                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" style={{ color: brand }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Shown when proxy.ts redirected here because the user's plan doesn't include
// a section they tried to open (ENFORCE_PLAN_LIMITS) — reads plain
// window.location.search instead of useSearchParams() to avoid needing a
// Suspense boundary on this page, then strips the query params so a refresh
// doesn't keep re-showing it.
function PlanBlockedBanner({ locale }: { locale: 'es' | 'en' }) {
  const router = useRouter()
  const [blocked, setBlocked] = useState<{ slug: string; plan: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('blocked')
    if (slug) {
      setBlocked({ slug, plan: params.get('plan') ?? '' })
      router.replace('/home', { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!blocked || dismissed) return null

  const dept = DEPARTMENT_METADATA[blocked.slug as keyof typeof DEPARTMENT_METADATA]
  const sectionName = dept ? (locale === 'es' ? dept.nameEs : dept.name) : blocked.slug
  const requiredPlan = minPlanForSection(blocked.slug) ?? 'scale'

  const message = t('plan.blocked-banner', locale)
    .replace('{section}', sectionName)
    .replace('{plan}', requiredPlan)

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
      style={{ borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.06)' }}>
      <div className="flex items-center gap-3">
        <Lock size={16} style={{ color: '#fbbf24' }} className="shrink-0" />
        <p className="text-sm text-ink">{message}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a href="mailto:hola@startupsfactory.es?subject=Actualizar%20mi%20plan%20MIRA"
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#fbbf24' }}>
          {t('plan.blocked-cta', locale)}
        </a>
        <button onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
          aria-label={t('plan.blocked-dismiss', locale)}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function StatCard({ value, label, hint, href, brand, alert }: {
  value: string; label: string; hint?: string; href?: string; brand: string; alert?: boolean
}) {
  const body = (
    <div className="rounded-2xl border bg-surface p-5 transition-all duration-200"
      style={{
        borderColor: alert ? 'rgba(245,158,11,0.35)' : 'var(--border)',
      }}>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color: alert ? '#fbbf24' : 'var(--text-primary)' }}>{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-tertiary">{label}</p>
      {hint && <p className="mt-1 text-[10px]" style={{ color: alert ? 'rgba(251,191,36,0.7)' : brand }}>{hint}</p>}
    </div>
  )
  return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body
}

export default function HomePage() {
  const router = useRouter()
  const { activeClient } = useActiveClient()
  const { activeProject, setActiveProject } = useActiveProject()
  const { locale } = useLocale()
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const superAdmin = isSuperAdmin(getUser())

  useEffect(() => {
    // Super admin sin cliente activo → visión de agencia
    if (superAdmin && !activeClient?.id) {
      router.replace('/admin')
      return
    }
    const qs = activeClient?.id ? `?clientId=${activeClient.id}` : ''
    fetch(`/api/home/overview${qs}`)
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Error cargando tu portada')
        setData(json)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
  }, [superAdmin, activeClient?.id, router])

  if (superAdmin && !activeClient?.id) return null
  if (error) return <div className="p-8 text-sm text-red-400">{error}</div>
  if (!data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={18} className="animate-spin text-ink-muted" />
      </div>
    )
  }

  const brand = data.client.primary_color || FALLBACK_BRAND
  const monthLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-6xl px-8 py-10" style={{ ['--client-primary' as string]: brand }}>
      {/* Tour del portal — se abre solo la primera vez (o al relanzarlo desde el sidebar) */}
      <OnboardingModal userName={data.client.name} />

      <PlanBlockedBanner locale={locale} />

      {/* Hero con la marca del cliente */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-line p-8"
        style={{
          background: `linear-gradient(135deg, ${brand}10 0%, var(--bg-surface) 55%)`,
        }}>
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-25 blur-3xl" style={{ background: brand }} />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: brand }}>
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: brand }} />
              Tu agencia de IA · {monthLabel}
            </p>
            <h1 className={`${syne.className} text-4xl font-extrabold tracking-tight text-ink`}>
              {data.client.name}
            </h1>
            <p className="mt-2 max-w-md text-sm text-ink-tertiary">
              Todo lo que tu equipo de IA ha producido, en un vistazo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {data.client.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.client.logo_url} alt={data.client.name}
                className="h-14 w-auto max-w-[120px] object-contain opacity-90"
                style={{ filter: `drop-shadow(0 0 12px ${brand}50)` }} />
            )}
            <Link href="/toolkit"
              className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: brand, boxShadow: `0 8px 24px ${brand}40` }}>
              + Generar entregable
            </Link>
          </div>
        </div>
      </div>

      {/* Analíticas clave */}
      <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard value={String(data.stats.reports_total)} label="Entregables"
          hint={data.stats.reports_month > 0 ? `+${data.stats.reports_month} este mes` : undefined}
          href="/toolkit" brand={brand} />
        <StatCard value={String(data.stats.documents_total)} label="Documentos" href="/documents" brand={brand} />
        <StatCard value={String(data.stats.pending_approvals)} label="Por aprobar"
          hint={data.stats.pending_approvals > 0 ? 'Requiere tu revisión' : 'Todo al día'}
          href="/approvals" brand={brand} alert={data.stats.pending_approvals > 0} />
        <StatCard value={`$${data.stats.usage_cost_usd.toFixed(2)}`} label="Consumo IA · mes" href="/integrations" brand={brand} />
      </div>

      {/* Carruseles */}
      <Carousel title="Últimos reportes" items={data.latest_reports}
        hrefFor={(c) => `/toolkit/report/${c.id}`} viewAllHref="/toolkit"
        emptyText="Aún no hay reportes generados" emptyCta={{ label: 'Generar el primero', href: '/toolkit' }}
        brand={brand} />

      <Carousel title="Últimos documentos" items={data.latest_documents}
        hrefFor={(c) => `/documents/${c.id}`} viewAllHref="/documents"
        emptyText="Aún no hay documentos ni presentaciones" emptyCta={{ label: 'Crear documento', href: '/documents' }}
        brand={brand} />

      {/* Proyectos */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
            Proyectos
          </p>
          <Link href="/projects/new"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all hover:bg-surface-hover"
            style={{ color: brand }}>
            <Plus size={12} /> Nuevo proyecto
          </Link>
        </div>

        {data.projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line-subtle bg-surface py-8 text-center">
            <p className="mb-1 text-xs text-ink-tertiary">Organiza el trabajo en proyectos: campañas, lanzamientos, iniciativas.</p>
            <p className="mb-3 text-[11px] text-ink-muted">Cada proyecto agrupa su memoria, sus entregables y su carpeta de Drive.</p>
            <Link href="/projects/new" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium"
              style={{ background: `${brand}20`, color: brand, border: `1px solid ${brand}30` }}>
              <Plus size={12} /> Crear el primero
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.projects.map((p) => {
              const isActive = activeProject?.id === p.id
              const togglePin = () =>
                setActiveProject(isActive ? null : { id: p.id, name: p.name, slug: p.slug, status: p.status })
              return (
                // El click en la card fija/desfija el proyecto activo; el link
                // al detalle va aparte (abajo a la derecha) para no mezclar gestos.
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
                    <span className="text-[10px] text-ink-muted">{fmtDate(p.created_at)}</span>
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
      </div>

      {/* Equipos */}
      <div>
        <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
          Tus equipos
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Object.values(DEPARTMENT_METADATA).map((dept) => (
            <Link key={dept.slug} href={dept.href}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-all duration-200"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${dept.color}40` }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                style={{ background: `${dept.color}15`, border: `1px solid ${dept.color}25` }}>
                {dept.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{dept.name}</p>
                <p className="text-[10px] text-ink-muted">
                  {dept.count > 0 ? `${dept.count} agentes` : 'Herramientas'}
                </p>
              </div>
              <ArrowRight size={12} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: dept.color }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
