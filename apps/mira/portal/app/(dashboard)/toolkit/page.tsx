'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Syne } from 'next/font/google'
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { TOOLKIT_TOOLS, getVisibleTools } from '@/lib/toolkit-tools'
import { useActiveClient } from '@/lib/client-context'
import { useActiveProject } from '@/lib/project-context'
import { t, type Locale } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'
import DeliverableCard, { DeliverableGeneration } from '@/components/toolkit/DeliverableCard'
import LandingsSection, { ClientLanding } from '@/components/toolkit/LandingsSection'

const syne = Syne({ subsets: ['latin'], weight: ['600', '700', '800'] })

const FALLBACK_BRAND = '#8B5CF6'

interface Generation extends DeliverableGeneration {
  status: 'queued' | 'processing' | 'completed' | 'failed'
  error_message?: string
}

// La categoría vive en el catálogo (lib/toolkit-tools.ts) — sin mapa paralelo.
function getCategory(slug: string): string {
  const tool = TOOLKIT_TOOLS.find((t) => t.slug === slug)
  if (tool?.category) return tool.category
  if (slug.startsWith('doc-')) return 'Documents'
  return 'Business Reports'
}

function getFallbackDescriptions(locale: Locale): Record<string, string> {
  return {
    'Digital Audit': t('toolkit.hub.fallback-desc.digital-audit', locale),
    'Brand Intelligence': t('toolkit.hub.fallback-desc.brand-intelligence', locale),
    Content: t('toolkit.hub.fallback-desc.content', locale),
    Strategy: t('toolkit.hub.fallback-desc.strategy', locale),
    Documents: t('toolkit.hub.fallback-desc.documents', locale),
    'Business Reports': t('toolkit.hub.fallback-desc.business-reports', locale),
  }
}

// Etiqueta visible de la categoría — las claves internas ('Documents',
// 'Business Reports') se mantienen intactas para el lookup de FALLBACK_DESCRIPTIONS.
function getCategoryLabel(category: string, locale: Locale): string {
  if (category === 'Documents') return t('toolkit.hub.category.documents', locale)
  if (category === 'Business Reports') return t('toolkit.hub.category.business-reports', locale)
  return category
}

function getToolMeta(slug: string, locale: Locale) {
  const tool = TOOLKIT_TOOLS.find((t) => t.slug === slug)
  const category = getCategory(slug)
  return {
    icon: tool?.icon || (slug.startsWith('doc-') ? '📄' : '⚡'),
    name: tool?.name || slug.replace(/^doc-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    description: tool?.description || getFallbackDescriptions(locale)[category],
    category,
  }
}

// hex → rgba string with alpha (for the radial glow)
function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(139, 92, 246, ${alpha})`
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

export default function ToolkitHub() {
  const { activeClient } = useActiveClient()
  const { activeProject } = useActiveProject()
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id
  const brandColor = activeClient?.primaryColor || FALLBACK_BRAND

  const [generations, setGenerations] = useState<Generation[]>([])
  const [landings, setLandings] = useState<ClientLanding[]>([])
  // Cuestionarios enviados sin terminar: el cliente ya no tiene sección propia
  // de cuestionarios (decisión go-live 01-sep: son herramienta de agencia) —
  // cuando se le envía uno, aparece AQUÍ, en su sección de informes.
  const [pendingQuestionnaires, setPendingQuestionnaires] = useState<
    Array<{ id: string; title: string; status: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Generar Nuevo abierto de serie y arriba del todo: es la acción principal
  // del hub (antes vivía plegado al fondo y había que hacer scroll + clic).
  const [showGenerate, setShowGenerate] = useState(true)
  const [showDeliverables, setShowDeliverables] = useState(true)

  const fetchGenerations = useCallback(async () => {
    if (!clientId) return
    try {
      const client = createClient()
      const { data, error: dbError } = await client
        .from('generation_queue')
        .select('id, tool_slug, status, result_data, created_at, completed_at, error_message')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (dbError) {
        console.error('Supabase error:', dbError)
        setError(`Database error: ${dbError.message}`)
        setGenerations([])
      } else {
        setGenerations((data as Generation[]) || [])
        setError(null)
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch generations')
      setGenerations([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  // Fetch generations + poll every 5s while there are pending items
  useEffect(() => {
    if (!clientId) return
    fetchGenerations()

    const interval = setInterval(() => {
      setGenerations((prev) => {
        const hasPending = prev.some((g) => g.status !== 'completed' && g.status !== 'failed')
        if (hasPending) {
          fetchGenerations()
        }
        return prev
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [clientId, fetchGenerations])

  // Cuestionarios pendientes de responder (status sent/in_progress). El API ya
  // limita a no-agencia los estados visibles; fallo aquí = sin tarjeta, nunca
  // romper el hub.
  useEffect(() => {
    if (!clientId) return
    fetch(`/api/questionnaires?clientId=${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const rows = Array.isArray(json?.questionnaires) ? json.questionnaires : Array.isArray(json) ? json : []
        setPendingQuestionnaires(
          rows
            .filter((q: { status?: string }) => q?.status === 'sent' || q?.status === 'in_progress')
            .map((q: { id: string; title?: string; status: string }) => ({
              id: q.id,
              title: q.title || 'Questionnaire',
              status: q.status,
            }))
        )
      })
      .catch(() => {})
  }, [clientId])

  // Landings del cliente — desactivado a propósito, no es código muerto por
  // descuido.
  //
  // Leía `clients.settings`, columna que NO existe en el esquema real: la
  // migración 0035 que la añadía nunca se aplicó. La consulta devolvía 400 en
  // CADA carga de /toolkit (Postgres 42703, undefined_column) y la lista
  // acababa vacía igualmente por la rama `else`. Era el "400 de /toolkit en
  // clients?select=settings" que la auditoría del 2026-07-30 (DEBT uu) dio por
  // no reproducible — reproducido y cerrado el 2026-08-06.
  //
  // Mismo criterio que ya se había aplicado en app/api/home/overview/route.ts
  // (ver su nota en el select): no pedir una columna que no existe. Para
  // reactivar las landings hay que aplicar antes la 0035; en cuanto exista la
  // columna, se restaura esta consulta.
  useEffect(() => {
    setLandings([])
  }, [clientId])

  // ─── Derived data ──────────────────────────────────────────
  const completed = generations.filter((g) => g.status === 'completed')
  const inProgress = generations.filter((g) => g.status === 'queued' || g.status === 'processing')
  // Un fallo solo se muestra mientras sea el estado vigente de su herramienta:
  // si una corrida posterior completó, la tarjeta roja ya no informa de nada
  // (el monthly de Salsa del 29-07 seguía en rojo en septiembre con dos
  // corridas completadas después). La fila queda en la BD como historial.
  const failed = generations.filter(
    (g) =>
      g.status === 'failed' &&
      !generations.some(
        (c) =>
          c.status === 'completed' &&
          c.tool_slug === g.tool_slug &&
          new Date(c.created_at).getTime() > new Date(g.created_at).getTime()
      )
  )

  // Latest completed per tool_slug (generations already sorted desc) + older versions
  const latestByTool = new Map<string, { latest: Generation; history: Generation[] }>()
  for (const gen of completed) {
    const entry = latestByTool.get(gen.tool_slug)
    if (!entry) {
      latestByTool.set(gen.tool_slug, { latest: gen, history: [] })
    } else {
      entry.history.push(gen)
    }
  }
  const deliverables = Array.from(latestByTool.values())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const clientName = activeClient?.name || t('toolkit.hub.client-name-fallback', locale)
  const clientInitial = clientName.charAt(0).toUpperCase()

  return (
    <div className="relative mx-auto max-w-6xl px-8 py-10">
      {/* Radial glow behind hero */}
      <div
        className="pointer-events-none absolute left-1/2 top-8 -z-0 h-[380px] w-[680px] max-w-full -translate-x-1/2"
        style={{
          background: `radial-gradient(ellipse, ${hexToRgba(brandColor, 0.15)} 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center pb-12 pt-6 text-center">
        {/* Client badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2.5 pr-4">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] text-ink-secondary">
            {t('toolkit.hub.client-label', locale)} <strong className="text-xs font-semibold text-ink">{clientName}</strong>
          </span>
        </div>

        {/* Logo */}
        {activeClient?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeClient.logoUrl}
            alt={clientName}
            className="mb-5 h-14 w-14 rounded-2xl border border-line bg-surface object-contain p-1.5"
          />
        ) : (
          <div
            className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-line text-2xl font-bold text-ink ${syne.className}`}
            style={{ background: hexToRgba(brandColor, 0.2) }}
          >
            {clientInitial}
          </div>
        )}

        <h1 className={`mb-3 text-4xl font-extrabold leading-[1.15] text-ink md:text-5xl ${syne.className}`}>
          {t('toolkit.hub.hero-title', locale)}{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(135deg, ${brandColor}, ${hexToRgba(brandColor, 0.6)})` }}
          >
            {clientName}
          </span>
        </h1>

        <p className="max-w-xl text-[15px] leading-relaxed text-ink-secondary">
          {t('toolkit.hub.hero-subtitle-prefix', locale)} {completed.length} {completed.length === 1 ? t('toolkit.hub.report-generated-singular', locale) : t('toolkit.hub.report-generated-plural', locale)}
        </p>

        {/* Proyecto activo — las generaciones se asociarán a él */}
        {activeProject && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: brandColor }} />
            <span className="font-mono text-[10px] text-ink-tertiary">
              {t('projects.generating-for', locale)}:{' '}
              <strong className="font-semibold text-ink-secondary">{activeProject.name}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ─── Error banner ─────────────────────────────────── */}
      {error && (
        <div className="card relative z-10 mb-6 border-red-500/20 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">{t('toolkit.hub.error-label', locale)}</p>
              <p className="mt-1 text-xs text-ink-secondary">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── In-progress chips ────────────────────────────── */}
      {inProgress.length > 0 && (
        <div className="relative z-10 mb-8 flex flex-wrap items-center justify-center gap-3">
          {inProgress.map((gen) => {
            const meta = getToolMeta(gen.tool_slug, locale)
            return (
              <div
                key={gen.id}
                className="inline-flex animate-pulse items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2"
              >
                <Loader2 size={13} className="animate-spin text-blue-400" />
                <span className="text-xs font-medium text-blue-300">
                  {t('toolkit.hub.generating-prefix', locale).replace('{name}', meta.name)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Generar Nuevo (arriba y desplegado: la acción principal) ── */}
      <div className="relative z-10 mb-10">
        <button
          onClick={() => setShowGenerate((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:bg-surface-hover"
        >
          <span className="flex items-center gap-3">
            <span className="text-lg">⚡</span>
            <span className={`text-sm font-bold text-ink ${syne.className}`}>{t('toolkit.hub.generate-new', locale)}</span>
            <span className="font-mono text-[10px] text-ink-tertiary">
              {t('toolkit.hub.reports-available', locale).replace('{n}', String(getVisibleTools().length))}
            </span>
          </span>
          {showGenerate ? (
            <ChevronUp size={16} className="text-ink-secondary" />
          ) : (
            <ChevronDown size={16} className="text-ink-secondary" />
          )}
        </button>

        {showGenerate && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {getVisibleTools().map((tool) => (
              <Link
                key={tool.slug}
                href={tool.href}
                className="card cursor-pointer border-l-4 p-3.5 transition-all hover:bg-surface-hover"
                style={{ borderLeftColor: tool.color }}
              >
                <p className="mb-1.5 text-xl">{tool.icon}</p>
                <p className="text-xs font-semibold leading-snug text-ink">{tool.name}</p>
                <p className="mt-1 font-mono text-[9px] text-ink-tertiary">{tool.time}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ─── Cuestionarios pendientes (se responden desde aquí) ── */}
      {pendingQuestionnaires.length > 0 && (
        <div className="relative z-10 mb-6 space-y-2">
          {pendingQuestionnaires.map((q) => (
            <Link
              key={q.id}
              href={`/questionnaires/${q.id}`}
              className="card flex items-center gap-3 border-l-4 p-4 transition-colors hover:bg-surface-hover"
              style={{ borderLeftColor: brandColor }}
            >
              <span className="text-lg">📋</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t('toolkit.hub.questionnaire-title', locale)}</p>
                <p className="truncate text-xs text-ink-secondary">
                  {t('toolkit.hub.questionnaire-desc', locale).replace('{name}', q.title)}
                </p>
              </div>
              <span className="flex-shrink-0 text-xs font-semibold" style={{ color: brandColor }}>
                {t('toolkit.hub.questionnaire-cta', locale)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ─── Informes generados (acordeón) ────────────────── */}
      <div className="relative z-10">
        <button
          onClick={() => setShowDeliverables((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:bg-surface-hover"
        >
          <span className="flex items-center gap-3">
            <span className="text-lg">📁</span>
            <span className={`text-sm font-bold text-ink ${syne.className}`}>{t('toolkit.hub.generated-title', locale)}</span>
            <span className="font-mono text-[10px] text-ink-tertiary">
              {t('toolkit.hub.generated-count', locale).replace('{n}', String(deliverables.length))}
            </span>
          </span>
          {showDeliverables ? (
            <ChevronUp size={16} className="text-ink-secondary" />
          ) : (
            <ChevronDown size={16} className="text-ink-secondary" />
          )}
        </button>

        {showDeliverables && (loading ? (
          <div className="card mt-4 flex items-center justify-center gap-3 p-10">
            <Loader2 size={20} className="animate-spin text-ink-secondary" />
            <p className="text-ink-secondary">{t('toolkit.hub.loading-deliverables', locale)}</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Featured: full toolkit overview */}
            <Link
              href="/toolkit/overview"
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              style={{
                borderColor: hexToRgba(brandColor, 0.35),
                background: `linear-gradient(135deg, ${hexToRgba(brandColor, 0.12)}, transparent 60%)`,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: brandColor }} />
              <div>
                <p
                  className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] opacity-80"
                  style={{ color: brandColor }}
                >
                  {t('toolkit.hub.overview-badge', locale)}
                </p>
                <p className="mb-3 text-[26px] leading-none">📊</p>
                <h3 className={`mb-2 text-[17px] font-bold text-ink ${syne.className}`}>
                  {t('toolkit.hub.overview-card-title', locale)}
                </h3>
                <p className="text-[13px] leading-relaxed text-ink-secondary">
                  {t('toolkit.hub.overview-card-desc', locale)}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-end border-t border-line-subtle pt-4">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2.5"
                  style={{ color: brandColor }}
                >
                  {t('toolkit.hub.overview-card-cta', locale)}
                </span>
              </div>
            </Link>

            {deliverables.map(({ latest, history }) => {
              const meta = getToolMeta(latest.tool_slug, locale)
              return (
                <DeliverableCard
                  key={latest.tool_slug}
                  category={getCategoryLabel(meta.category, locale)}
                  icon={meta.icon}
                  title={meta.name}
                  description={meta.description}
                  brandColor={brandColor}
                  latest={latest}
                  history={history}
                  titleFontClass={syne.className}
                />
              )
            })}

            {deliverables.length === 0 && (
              <div className="card flex flex-col items-center justify-center p-10 text-center md:col-span-1">
                <p className="mb-2 text-2xl">✨</p>
                <p className="text-sm text-ink-secondary">{t('toolkit.hub.empty-title', locale)}</p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  {t('toolkit.hub.empty-desc', locale)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Failed generations ───────────────────────────── */}
      {failed.length > 0 && (
        <div className="relative z-10 mt-8 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-tertiary">
            {t('toolkit.hub.failed-title', locale)}
          </p>
          {failed.map((gen) => {
            const meta = getToolMeta(gen.tool_slug, locale)
            return (
              <div key={gen.id} className="card flex items-center gap-3 border-red-500/15 p-4">
                <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{meta.name}</p>
                  <p className="truncate text-xs text-red-400/80">
                    {gen.error_message || t('toolkit.hub.unknown-error', locale)}
                  </p>
                </div>
                <p className="flex-shrink-0 font-mono text-[10px] text-ink-tertiary">
                  {formatDate(gen.created_at)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Landings activas ─────────────────────────────── */}
      <div className="relative z-10">
        <LandingsSection landings={landings} brandColor={brandColor} titleFontClass={syne.className} />
      </div>

      {/* ─── Footer meta ──────────────────────────────────── */}
      <p className="relative z-10 mt-12 text-center font-mono text-[11px] text-ink-tertiary">
        {t('toolkit.hub.footer', locale)}
      </p>
    </div>
  )
}
