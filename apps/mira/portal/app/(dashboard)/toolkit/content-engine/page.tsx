'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Loader2, Check, ChevronLeft, ChevronRight, AlertCircle, CalendarDays, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'
import { useLocaleContext } from '@/app/locale-provider'
import { t } from '@/lib/i18n'

interface Pillar {
  id: string
  pillar_name: string
  description: string | null
  themes: string[]
  examples: string[]
}

type Step = 1 | 2 | 3

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
] as const

const PROGRESS_KEYS = [
  'content-engine.progress-1',
  'content-engine.progress-2',
  'content-engine.progress-3',
  'content-engine.progress-4',
  'content-engine.progress-5',
  'content-engine.progress-6',
  'content-engine.progress-7',
]

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export default function ContentEnginePage() {
  const { activeClient } = useActiveClient()
  const { locale } = useLocaleContext()
  const clientId = activeClient?.id
  const brandColor = activeClient?.primaryColor || '#22D3EE'

  const [pillars, setPillars] = useState<Pillar[]>([])
  const [loadingPillars, setLoadingPillars] = useState(true)

  const [step, setStep] = useState<Step>(1)
  const [selectedPillars, setSelectedPillars] = useState<string[]>([])
  const [postsPerPillar, setPostsPerPillar] = useState(2)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [includeReels, setIncludeReels] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [progressIdx, setProgressIdx] = useState(0)
  const [result, setResult] = useState<{ generated: number; by_pillar: Record<string, number>; errors?: Record<string, string> } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Pilares del cliente activo ─────────────────────────────
  useEffect(() => {
    if (!clientId) return
    setLoadingPillars(true)
    const db = createClient()
    db.from('content_pillars')
      .select('id, pillar_name, description, themes, examples')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setPillars(
          ((data as any[]) ?? []).map(p => ({
            id: p.id,
            pillar_name: p.pillar_name,
            description: p.description,
            themes: asStringArray(p.themes),
            examples: asStringArray(p.examples),
          }))
        )
        setLoadingPillars(false)
      })
    // Reset del wizard al cambiar de cliente
    setStep(1)
    setSelectedPillars([])
    setResult(null)
    setError(null)
  }, [clientId])

  useEffect(() => () => { if (progressTimer.current) clearInterval(progressTimer.current) }, [])

  const totalPosts = selectedPillars.length * postsPerPillar * selectedPlatforms.length

  const selectedPillarNames = useMemo(
    () => pillars.filter(p => selectedPillars.includes(p.id)).map(p => p.pillar_name),
    [pillars, selectedPillars]
  )

  const togglePillar = (id: string) =>
    setSelectedPillars(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const togglePlatform = (id: string) =>
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const generate = async () => {
    if (!clientId || generating) return
    setGenerating(true)
    setError(null)
    setResult(null)
    setProgressIdx(0)
    progressTimer.current = setInterval(() => {
      setProgressIdx(i => Math.min(i + 1, PROGRESS_KEYS.length - 1))
    }, 9000)

    try {
      const res = await fetch('/api/content-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          pillar_ids: selectedPillars,
          posts_per_pillar: postsPerPillar,
          platforms: selectedPlatforms,
          include_reels: includeReels,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('content-engine.error-generating', locale))
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('content-engine.error-unexpected', locale))
    } finally {
      if (progressTimer.current) clearInterval(progressTimer.current)
      setGenerating(false)
    }
  }

  const stepDone = (s: Step) =>
    s === 1 ? selectedPillars.length > 0 : s === 2 ? selectedPlatforms.length > 0 : false

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏭</span>
          <h1 className="text-2xl font-semibold text-ink">Content Engine</h1>
        </div>
        <p className="text-sm text-ink-tertiary">
          {t('content-engine.subtitle-prefix', locale)} <span className="text-ink">{activeClient?.name ?? t('content-engine.your-brand', locale)}</span>
          {t('content-engine.subtitle-suffix', locale)}
        </p>
      </div>

      {/* ── Stepper ────────────────────────────────────────── */}
      {!result && (
        <div className="flex items-center gap-2 mb-8">
          {([1, 2, 3] as Step[]).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors',
                  step === s ? 'text-black border-transparent'
                    : step > s ? 'text-ink border-line bg-surface-elevated'
                    : 'text-ink-tertiary border-line'
                )}
                style={step === s ? { background: brandColor } : undefined}
              >
                {step > s ? <Check size={13} /> : s}
              </div>
              <span className={clsx('text-xs', step === s ? 'text-ink font-medium' : 'text-ink-tertiary')}>
                {s === 1 ? t('content-engine.step-pillars', locale) : s === 2 ? t('content-engine.step-config', locale) : t('content-engine.step-generate', locale)}
              </span>
              {s < 3 && <div className="w-8 h-px bg-line" />}
            </div>
          ))}
        </div>
      )}

      {/* ── Resultado final ────────────────────────────────── */}
      {result && (
        <div className="card p-8 text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ background: `${brandColor}22` }}
          >
            ✅
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2">
            {result.generated} {t('content-engine.posts-generated', locale)}
          </h2>
          <p className="text-sm text-ink-secondary mb-6">
            {t('content-engine.result-desc-prefix', locale)} <span className="text-amber-400">{t('content-engine.pending-review', locale)}</span>.
          </p>

          <div className="max-w-sm mx-auto mb-8 space-y-2 text-left">
            {Object.entries(result.by_pillar).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between bg-card border border-line rounded-lg px-4 py-2.5">
                <span className="text-xs text-ink-secondary truncate mr-3">{name}</span>
                {count > 0 ? (
                  <span className="text-xs font-semibold text-ink shrink-0">{count} posts</span>
                ) : (
                  <span className="text-xs text-red-400 shrink-0">{t('content-engine.failed', locale)}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link
              href="/approvals"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-black transition-opacity hover:opacity-90"
              style={{ background: brandColor }}
            >
              <CheckSquare size={14} /> {t('content-engine.review-in-approvals', locale)}
            </Link>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-surface-elevated text-ink hover:bg-surface-hover transition-colors"
            >
              <CalendarDays size={14} /> {t('content-engine.view-calendar', locale)}
            </Link>
          </div>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────── */}
      {generating && !result && (
        <div className="card p-10 text-center">
          <Loader2 size={26} className="animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-sm text-ink font-medium mb-1">
            {t('content-engine.generating-posts', locale).replace('{count}', String(totalPosts))}
          </p>
          <p className="text-xs text-ink-tertiary transition-all">{t(PROGRESS_KEYS[progressIdx], locale)}</p>
          <p className="text-[10px] text-ink-muted mt-4">
            {t('content-engine.generating-note', locale)}
          </p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && !generating && (
        <div className="card border-red-500/20 p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">{t('content-engine.error-title', locale)}</p>
            <p className="text-xs text-ink-secondary mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Paso 1: pilares ────────────────────────────────── */}
      {!generating && !result && step === 1 && (
        <div>
          <p className="text-xs text-ink-tertiary mb-4 font-mono uppercase tracking-wider">
            {t('content-engine.select-pillars', locale)}
          </p>
          {loadingPillars ? (
            <div className="card p-10 flex items-center justify-center gap-3">
              <Loader2 size={18} className="animate-spin text-ink-muted" />
              <p className="text-sm text-ink-tertiary">{t('content-engine.loading-pillars', locale)}</p>
            </div>
          ) : pillars.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-2xl mb-2">🧱</p>
              <p className="text-sm text-ink-secondary">{t('content-engine.no-pillars', locale)}</p>
              <p className="text-xs text-ink-tertiary mt-1">{t('content-engine.no-pillars-hint', locale)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pillars.map(pillar => {
                const selected = selectedPillars.includes(pillar.id)
                return (
                  <button
                    key={pillar.id}
                    onClick={() => togglePillar(pillar.id)}
                    className={clsx(
                      'card p-5 text-left transition-all border',
                      selected ? 'bg-surface' : 'hover:bg-surface border-transparent'
                    )}
                    style={selected ? { borderColor: brandColor } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-ink">{pillar.pillar_name}</p>
                      <div
                        className={clsx(
                          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          selected ? 'border-transparent' : 'border-line'
                        )}
                        style={selected ? { background: brandColor } : undefined}
                      >
                        {selected && <Check size={12} className="text-black" />}
                      </div>
                    </div>
                    {pillar.description && (
                      <p className="text-xs text-ink-tertiary leading-relaxed line-clamp-3 mb-3">{pillar.description}</p>
                    )}
                    {pillar.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pillar.themes.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-ink-secondary">{t}</span>
                        ))}
                        {pillar.themes.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated text-ink-tertiary">
                            +{pillar.themes.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Paso 2: configuración ──────────────────────────── */}
      {!generating && !result && step === 2 && (
        <div className="space-y-6">
          <div className="card p-6">
            <p className="text-xs text-ink-tertiary mb-3 font-mono uppercase tracking-wider">{t('content-engine.posts-per-pillar', locale)}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setPostsPerPillar(n)}
                  className={clsx(
                    'w-11 h-11 rounded-xl text-sm font-semibold transition-colors',
                    postsPerPillar === n ? 'text-black' : 'bg-surface-elevated text-ink-secondary hover:text-ink'
                  )}
                  style={postsPerPillar === n ? { background: brandColor } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-xs text-ink-tertiary mb-3 font-mono uppercase tracking-wider">{t('content-engine.platforms', locale)}</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const on = selectedPlatforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={clsx(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors',
                      on ? 'text-ink bg-surface-elevated' : 'text-ink-tertiary border-line hover:text-ink'
                    )}
                    style={on ? { borderColor: brandColor } : undefined}
                  >
                    <span>{p.icon}</span> {p.label}
                    {on && <Check size={12} style={{ color: brandColor }} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{t('content-engine.include-reels', locale)}</p>
              <p className="text-xs text-ink-tertiary mt-0.5">
                {t('content-engine.include-reels-desc', locale)}
              </p>
            </div>
            <button
              onClick={() => setIncludeReels(v => !v)}
              className={clsx('w-11 h-6 rounded-full relative transition-colors shrink-0 ml-4', !includeReels && 'bg-surface-elevated')}
              style={includeReels ? { background: brandColor } : undefined}
              aria-pressed={includeReels}
            >
              <span
                className={clsx(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all',
                  includeReels ? 'left-[22px]' : 'left-0.5'
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: resumen ────────────────────────────────── */}
      {!generating && !result && step === 3 && (
        <div className="card p-8">
          <p className="text-xs text-ink-tertiary mb-5 font-mono uppercase tracking-wider">{t('content-engine.summary', locale)}</p>
          <h2 className="text-xl font-semibold text-ink mb-6">
            {t('content-engine.about-to-generate', locale)} <span style={{ color: brandColor }}>{totalPosts} posts</span>
          </h2>
          <div className="space-y-3 mb-2">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
              <span className="text-xs text-ink-tertiary">{t('content-engine.pillars', locale)} ({selectedPillars.length})</span>
              <span className="text-xs text-ink text-right">{selectedPillarNames.join(' · ')}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs text-ink-tertiary">{t('content-engine.posts-per-pillar-platform', locale)}</span>
              <span className="text-xs text-ink">{postsPerPillar}</span>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="text-xs text-ink-tertiary">{t('content-engine.platforms', locale)}</span>
              <span className="text-xs text-ink">
                {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => p.label).join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-ink-tertiary">{t('content-engine.reel-scripts', locale)}</span>
              <span className="text-xs text-ink">{includeReels ? t('content-engine.yes', locale) : t('content-engine.no', locale)}</span>
            </div>
          </div>
          <p className="text-[11px] text-ink-tertiary mt-4">
            {t('content-engine.summary-note', locale)}
          </p>
        </div>
      )}

      {/* ── Navegación ─────────────────────────────────────── */}
      {!generating && !result && (
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs bg-surface-elevated text-ink-secondary hover:text-ink transition-colors"
            >
              <ChevronLeft size={14} /> {t('common.back', locale)}
            </button>
          ) : <span />}

          {step < 3 ? (
            <button
              onClick={() => stepDone(step) && setStep((step + 1) as Step)}
              disabled={!stepDone(step)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold transition-opacity',
                stepDone(step) ? 'text-black hover:opacity-90' : 'bg-surface-elevated text-ink-tertiary cursor-not-allowed'
              )}
              style={stepDone(step) ? { background: brandColor } : undefined}
            >
              {t('content-engine.continue', locale)} <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={totalPosts === 0}
              className={clsx(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-opacity',
                totalPosts > 0 ? 'text-black hover:opacity-90' : 'bg-surface-elevated text-ink-tertiary cursor-not-allowed'
              )}
              style={totalPosts > 0 ? { background: brandColor } : undefined}
            >
              🏭 {t('content-engine.generate-btn', locale).replace('{count}', String(totalPosts))}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
