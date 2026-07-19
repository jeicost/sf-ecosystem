'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { Loader2, Check, ChevronLeft, ChevronRight, AlertCircle, CalendarDays, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useActiveClient } from '@/lib/client-context'

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

const PROGRESS_MESSAGES = [
  'Cargando Brand Brain y pilares…',
  'Analizando temas y ángulos por pilar…',
  'Escribiendo hooks y copies por plataforma…',
  'Generando captions y hashtags…',
  'Preparando direcciones visuales…',
  'Puliendo guiones de Reel…',
  'Enviando posts a la Cola de Aprobación…',
]

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string')
}

export default function ContentEnginePage() {
  const { activeClient } = useActiveClient()
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
      setProgressIdx(i => Math.min(i + 1, PROGRESS_MESSAGES.length - 1))
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
      if (!res.ok) throw new Error(data.error || 'Error generando contenido')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
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
          <h1 className="text-2xl font-semibold text-white">Content Engine</h1>
        </div>
        <p className="text-sm text-[#555]">
          Motor de contenido por pilares para <span className="text-white">{activeClient?.name ?? 'tu marca'}</span>.
          Elige pilares, define el volumen y genera posts listos para aprobar.
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
                    : step > s ? 'text-white border-white/20 bg-white/10'
                    : 'text-[#555] border-[#222]'
                )}
                style={step === s ? { background: brandColor } : undefined}
              >
                {step > s ? <Check size={13} /> : s}
              </div>
              <span className={clsx('text-xs', step === s ? 'text-white font-medium' : 'text-[#555]')}>
                {s === 1 ? 'Pilares' : s === 2 ? 'Configuración' : 'Generar'}
              </span>
              {s < 3 && <div className="w-8 h-px bg-[#222]" />}
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
          <h2 className="text-xl font-semibold text-white mb-2">
            {result.generated} posts generados
          </h2>
          <p className="text-sm text-[#888] mb-6">
            Todo está en la Cola de Aprobación como <span className="text-amber-400">pendiente de revisión</span>.
          </p>

          <div className="max-w-sm mx-auto mb-8 space-y-2 text-left">
            {Object.entries(result.by_pillar).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between bg-[#0A0A0A] border border-[#1A1A1A] rounded-lg px-4 py-2.5">
                <span className="text-xs text-[#ccc] truncate mr-3">{name}</span>
                {count > 0 ? (
                  <span className="text-xs font-semibold text-white shrink-0">{count} posts</span>
                ) : (
                  <span className="text-xs text-red-400 shrink-0">falló</span>
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
              <CheckSquare size={14} /> Revisar en Aprobaciones →
            </Link>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#1A1A1A] text-white hover:bg-white/10 transition-colors"
            >
              <CalendarDays size={14} /> Ver calendario →
            </Link>
          </div>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────── */}
      {generating && !result && (
        <div className="card p-10 text-center">
          <Loader2 size={26} className="animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-sm text-white font-medium mb-1">
            Generando {totalPosts} posts…
          </p>
          <p className="text-xs text-[#666] transition-all">{PROGRESS_MESSAGES[progressIdx]}</p>
          <p className="text-[10px] text-[#444] mt-4">
            Una llamada por pilar · esto puede tardar unos minutos. No cierres esta pestaña.
          </p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && !generating && (
        <div className="card border-red-500/20 p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Error al generar</p>
            <p className="text-xs text-[#888] mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* ── Paso 1: pilares ────────────────────────────────── */}
      {!generating && !result && step === 1 && (
        <div>
          <p className="text-xs text-[#666] mb-4 font-mono uppercase tracking-wider">
            Selecciona uno o varios pilares de contenido
          </p>
          {loadingPillars ? (
            <div className="card p-10 flex items-center justify-center gap-3">
              <Loader2 size={18} className="animate-spin text-[#444]" />
              <p className="text-sm text-[#555]">Cargando pilares…</p>
            </div>
          ) : pillars.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-2xl mb-2">🧱</p>
              <p className="text-sm text-[#888]">Este cliente aún no tiene pilares de contenido.</p>
              <p className="text-xs text-[#555] mt-1">Genera primero el Brand Briefing para definirlos.</p>
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
                      selected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03] border-transparent'
                    )}
                    style={selected ? { borderColor: brandColor } : undefined}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-white">{pillar.pillar_name}</p>
                      <div
                        className={clsx(
                          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          selected ? 'border-transparent' : 'border-[#333]'
                        )}
                        style={selected ? { background: brandColor } : undefined}
                      >
                        {selected && <Check size={12} className="text-black" />}
                      </div>
                    </div>
                    {pillar.description && (
                      <p className="text-xs text-[#777] leading-relaxed line-clamp-3 mb-3">{pillar.description}</p>
                    )}
                    {pillar.themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {pillar.themes.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#888]">{t}</span>
                        ))}
                        {pillar.themes.length > 3 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1A1A1A] text-[#555]">
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
            <p className="text-xs text-[#666] mb-3 font-mono uppercase tracking-wider">Posts por pilar</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setPostsPerPillar(n)}
                  className={clsx(
                    'w-11 h-11 rounded-xl text-sm font-semibold transition-colors',
                    postsPerPillar === n ? 'text-black' : 'bg-[#1A1A1A] text-[#888] hover:text-white'
                  )}
                  style={postsPerPillar === n ? { background: brandColor } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <p className="text-xs text-[#666] mb-3 font-mono uppercase tracking-wider">Plataformas</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const on = selectedPlatforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={clsx(
                      'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors',
                      on ? 'text-white bg-white/[0.06]' : 'text-[#666] border-[#222] hover:text-white'
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
              <p className="text-sm font-medium text-white">Incluir scripts de Reel</p>
              <p className="text-xs text-[#666] mt-0.5">
                Guión escena a escena (tiempos, acción, texto en pantalla) para Instagram y TikTok.
              </p>
            </div>
            <button
              onClick={() => setIncludeReels(v => !v)}
              className={clsx('w-11 h-6 rounded-full relative transition-colors shrink-0 ml-4', !includeReels && 'bg-[#222]')}
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
          <p className="text-xs text-[#666] mb-5 font-mono uppercase tracking-wider">Resumen</p>
          <h2 className="text-xl font-semibold text-white mb-6">
            Vas a generar <span style={{ color: brandColor }}>{totalPosts} posts</span>
          </h2>
          <div className="space-y-3 mb-2">
            <div className="flex items-start justify-between gap-4 border-b border-[#1A1A1A] pb-3">
              <span className="text-xs text-[#666]">Pilares ({selectedPillars.length})</span>
              <span className="text-xs text-white text-right">{selectedPillarNames.join(' · ')}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <span className="text-xs text-[#666]">Posts por pilar y plataforma</span>
              <span className="text-xs text-white">{postsPerPillar}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
              <span className="text-xs text-[#666]">Plataformas</span>
              <span className="text-xs text-white">
                {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => p.label).join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-[#666]">Scripts de Reel</span>
              <span className="text-xs text-white">{includeReels ? 'Sí' : 'No'}</span>
            </div>
          </div>
          <p className="text-[11px] text-[#555] mt-4">
            Cada post se enviará a la Cola de Aprobación como pendiente de revisión — nada se publica sin tu ok.
          </p>
        </div>
      )}

      {/* ── Navegación ─────────────────────────────────────── */}
      {!generating && !result && (
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as Step)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs bg-[#1A1A1A] text-[#888] hover:text-white transition-colors"
            >
              <ChevronLeft size={14} /> Atrás
            </button>
          ) : <span />}

          {step < 3 ? (
            <button
              onClick={() => stepDone(step) && setStep((step + 1) as Step)}
              disabled={!stepDone(step)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold transition-opacity',
                stepDone(step) ? 'text-black hover:opacity-90' : 'bg-[#1A1A1A] text-[#555] cursor-not-allowed'
              )}
              style={stepDone(step) ? { background: brandColor } : undefined}
            >
              Continuar <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={generate}
              disabled={totalPosts === 0}
              className={clsx(
                'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-opacity',
                totalPosts > 0 ? 'text-black hover:opacity-90' : 'bg-[#1A1A1A] text-[#555] cursor-not-allowed'
              )}
              style={totalPosts > 0 ? { background: brandColor } : undefined}
            >
              🏭 Generar {totalPosts} posts
            </button>
          )}
        </div>
      )}
    </div>
  )
}
