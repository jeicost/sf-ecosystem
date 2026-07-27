'use client'
import { useState } from 'react'
import { Send, Loader2, CheckCircle, ArrowRight, ChevronDown, Zap, X } from 'lucide-react'
import { clsx } from 'clsx'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

type Step = 'templates' | 'form' | 'processing' | 'done'

interface BriefForm {
  client: string
  platform: string
  pillar: string
  format: string
  objetivo: string
  notas: string
}

interface Template {
  id: string
  emoji: string
  label: string
  description: string
  color: string
  prefill: Partial<BriefForm>
}

// label / description / prefill.objetivo hold i18n keys, resolved with t() at render time.
// platform / format / pillar prefills are API values and must match the option lists below.
const TEMPLATES: Template[] = [
  {
    id: 'weekly',
    emoji: '📅',
    label: 'brief.template-weekly-label',
    description: 'brief.template-weekly-desc',
    color: '#06B6D4',
    prefill: {
      platform: 'All',
      format: 'Static post (IG)',
      pillar: 'No pillar (free)',
      objetivo: 'brief.template-weekly-objective',
    },
  },
  {
    id: 'launch',
    emoji: '🚀',
    label: 'brief.template-launch-label',
    description: 'brief.template-launch-desc',
    color: '#8B5CF6',
    prefill: {
      platform: 'Instagram',
      format: 'Carousel (IG)',
      objetivo: 'brief.template-launch-objective',
    },
  },
  {
    id: 'crisis',
    emoji: '🔥',
    label: 'brief.template-crisis-label',
    description: 'brief.template-crisis-desc',
    color: '#EF4444',
    prefill: {
      platform: 'All',
      format: 'Community reply',
      pillar: 'Community First',
      objetivo: 'brief.template-crisis-objective',
    },
  },
  {
    id: 'ads',
    emoji: '💰',
    label: 'brief.template-ads-label',
    description: 'brief.template-ads-desc',
    color: '#F59E0B',
    prefill: {
      platform: 'Meta Ads',
      format: 'Ad creative',
      objetivo: 'brief.template-ads-objective',
    },
  },
  {
    id: 'awareness',
    emoji: '🎯',
    label: 'brief.template-awareness-label',
    description: 'brief.template-awareness-desc',
    color: '#10B981',
    prefill: {
      platform: 'Instagram',
      format: 'Reel / Short (vertical)',
      objetivo: 'brief.template-awareness-objective',
    },
  },
  {
    id: 'founders',
    emoji: '🤝',
    label: 'brief.template-founders-label',
    description: 'brief.template-founders-desc',
    color: '#EC4899',
    prefill: {
      platform: 'LinkedIn',
      format: 'LinkedIn post',
      pillar: 'Behind the Brand',
      objetivo: 'brief.template-founders-objective',
    },
  },
]

const CLIENTS = ['Salsa Burgers', 'Startup Factory']
const PLATFORMS = ['Instagram', 'TikTok', 'LinkedIn', 'Meta Ads', 'All']
const PILLARS = [
  'Wagyu Quality', 'DIP NOW Energy', 'Bangkok Vibes',
  'Behind the Brand', 'Community First', 'Salsa Mastery',
  'EveryDetailMatters', 'No pillar (free)',
]
const FORMATS = [
  'Static post (IG)', 'Carousel (IG)', 'Reel / Short (vertical)',
  'TikTok script', 'LinkedIn post', 'Ad creative',
  'Community reply', 'Other',
]

// label / task hold i18n keys, resolved with t() at render time
const PROCESSING_STEPS = [
  { agent: 'Marco', emoji: '🎬', label: 'brief.processing-step-marco', delay: 800 },
  { agent: 'Luna', emoji: '🔍', label: 'brief.processing-step-luna', delay: 1800 },
  { agent: 'Alex', emoji: '✍️', label: 'brief.processing-step-alex', delay: 2900 },
  { agent: 'Noa', emoji: '📅', label: 'brief.processing-step-noa', delay: 3800 },
]

const RESULT_PLAN = [
  { agent: 'Marco', emoji: '🎬', color: '#8B5CF6', task: 'brief.result-marco' },
  { agent: 'Luna', emoji: '🔍', color: '#06B6D4', task: 'brief.result-luna' },
  { agent: 'Alex', emoji: '✍️', color: '#F59E0B', task: 'brief.result-alex' },
  { agent: 'Noa', emoji: '📅', color: '#3B82F6', task: 'brief.result-noa' },
]

const EMPTY_FORM: BriefForm = {
  client: 'Salsa Burgers',
  platform: '',
  pillar: '',
  format: '',
  objetivo: '',
  notas: '',
}

export default function BriefPage() {
  const { locale } = useLocaleContext()
  const [step, setStep] = useState<Step>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [processingStep, setProcessingStep] = useState(0)
  const [form, setForm] = useState<BriefForm>({ ...EMPTY_FORM })

  const isValid = form.platform && form.pillar && form.format && form.objetivo

  const pickTemplate = (tpl: Template) => {
    setSelectedTemplate(tpl)
    setForm(prev => ({
      ...prev,
      ...tpl.prefill,
      ...(tpl.prefill.objetivo ? { objetivo: t(tpl.prefill.objetivo, locale) } : {}),
    }))
    setStep('form')
  }

  const skipTemplates = () => {
    setSelectedTemplate(null)
    setStep('form')
  }

  const submit = async () => {
    if (!isValid) return
    setStep('processing')
    setProcessingStep(0)

    // Avanzar pasos visualmente mientras llama a la API real
    const timers = PROCESSING_STEPS.map((_, i) =>
      setTimeout(() => setProcessingStep(i + 1), PROCESSING_STEPS[i].delay)
    )

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido')
      // Éxito — esperar a que los pasos visuales terminen
      setTimeout(() => setStep('done'), 4800)
    } catch {
      timers.forEach(clearTimeout)
      setStep('form')
    }
  }

  const reset = () => {
    setStep('templates')
    setProcessingStep(0)
    setSelectedTemplate(null)
    setForm({ ...EMPTY_FORM })
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">{t('brief.title', locale)}</h1>
        <p className="text-ink-tertiary mt-1 text-sm">
          {t('brief.subtitle', locale)}
        </p>
      </div>

      {/* ── STEP: TEMPLATES ── */}
      {step === 'templates' && (
        <>
          <p className="text-xs text-ink-tertiary uppercase tracking-wider mb-4">{t('brief.start-from-template', locale)}</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => pickTemplate(tpl)}
                className="card p-4 text-left hover:border-line transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${tpl.color}20` }}
                  >
                    {tpl.emoji}
                  </span>
                  <div>
                    <p className="text-sm text-ink font-medium group-hover:text-ink transition-colors">
                      {t(tpl.label, locale)}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{t(tpl.description, locale)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-0">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[11px] text-ink-muted">{t('brief.or', locale)}</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <button
            onClick={skipTemplates}
            className="w-full mt-4 py-2.5 rounded-xl text-sm border border-line text-ink-tertiary hover:text-ink transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={13} />
            {t('brief.free-brief', locale)}
          </button>
        </>
      )}

      {/* ── STEP: FORM ── */}
      {step === 'form' && (
        <div className="space-y-4">
          {/* Template badge */}
          {selectedTemplate && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs w-fit"
              style={{ background: `${selectedTemplate.color}15`, color: selectedTemplate.color }}
            >
              <span>{selectedTemplate.emoji}</span>
              <span>{t(selectedTemplate.label, locale)}</span>
              <button
                onClick={() => { setSelectedTemplate(null); setForm({ ...EMPTY_FORM }) }}
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={11} />
              </button>
            </div>
          )}

          {/* Client */}
          <div className="card p-5">
            <label className="block text-xs text-ink-tertiary uppercase tracking-wider mb-3">{t('brief.client', locale)}</label>
            <div className="flex gap-2">
              {CLIENTS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, client: c }))}
                  className={clsx(
                    'flex-1 py-2.5 rounded-lg text-sm transition-all border',
                    form.client === c
                      ? 'bg-surface-elevated text-ink border-line font-medium'
                      : 'border-line text-ink-tertiary hover:text-ink'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Platform + Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5">
              <label className="block text-xs text-ink-tertiary uppercase tracking-wider mb-3">{t('brief.platform', locale)}</label>
              <div className="relative">
                <select
                  value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full bg-transparent text-sm text-ink outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-page">{t('brief.choose', locale)}</option>
                  {PLATFORMS.map(p => <option key={p} value={p} className="bg-page">{p}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-0 top-0.5 text-ink-tertiary pointer-events-none" />
              </div>
            </div>
            <div className="card p-5">
              <label className="block text-xs text-ink-tertiary uppercase tracking-wider mb-3">{t('brief.format', locale)}</label>
              <div className="relative">
                <select
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                  className="w-full bg-transparent text-sm text-ink outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-page">{t('brief.choose', locale)}</option>
                  {FORMATS.map(f => <option key={f} value={f} className="bg-page">{f}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-0 top-0.5 text-ink-tertiary pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pilar */}
          <div className="card p-5">
            <label className="block text-xs text-ink-tertiary uppercase tracking-wider mb-3">{t('brief.content-pillar', locale)}</label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, pillar: p }))}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs transition-all border',
                    form.pillar === p
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      : 'border-line text-ink-tertiary hover:text-ink'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div className="card p-5">
            <label className="block text-xs text-ink-tertiary uppercase tracking-wider mb-3">
              {t('brief.objective-label', locale)}
            </label>
            <textarea
              value={form.objetivo}
              onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
              placeholder={t('brief.objective-placeholder', locale)}
              rows={4}
              className="w-full bg-transparent text-sm text-ink placeholder-ink-muted outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Notas */}
          <div className="card p-5">
            <label className="block text-xs text-ink-tertiary uppercase tracking-wider mb-3">
              {t('brief.notes-label', locale)} <span className="normal-case text-ink-muted">{t('brief.optional', locale)}</span>
            </label>
            <textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              placeholder={t('brief.notes-placeholder', locale)}
              rows={2}
              className="w-full bg-transparent text-sm text-ink placeholder-ink-muted outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('templates')}
              className="px-4 py-3 rounded-xl text-sm border border-line text-ink-tertiary hover:text-ink transition-colors"
            >
              {t('brief.back-to-templates', locale)}
            </button>
            <button
              onClick={submit}
              disabled={!isValid}
              className={clsx(
                'flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                isValid ? 'bg-ink text-page hover:opacity-90' : 'bg-surface-elevated text-ink-muted cursor-not-allowed'
              )}
            >
              <Send size={14} />
              {t('brief.send-to-marco', locale)}
            </button>
          </div>
          {!isValid && (
            <p className="text-center text-[11px] text-ink-muted">
              {t('brief.fill-required', locale)}
            </p>
          )}
        </div>
      )}

      {/* ── STEP: PROCESSING ── */}
      {step === 'processing' && (
        <div className="card p-8">
          <div className="text-center mb-8">
            <div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ boxShadow: '0 12px 32px #8B5CF640' }}
            >🎬</div>
            <h2 className="text-lg font-semibold text-ink mb-1">{t('brief.processing-title', locale)}</h2>
            <p className="text-xs text-ink-tertiary">{t('brief.processing-subtitle', locale)}</p>
          </div>
          <div className="space-y-3">
            {PROCESSING_STEPS.map((s, i) => {
              const done = processingStep > i
              const active = processingStep === i
              return (
                <div key={s.agent} className={clsx('flex items-center gap-3 p-3 rounded-xl transition-all', done || active ? 'opacity-100' : 'opacity-25')}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all', done ? 'bg-emerald-500/20' : 'bg-surface-elevated')}>
                    {s.emoji}
                  </div>
                  <p className="flex-1 text-sm text-ink-secondary">{t(s.label, locale)}</p>
                  {done && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                  {active && <Loader2 size={14} className="text-amber-400 animate-spin shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── STEP: DONE ── */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="card p-6 text-center border-emerald-500/20">
            <CheckCircle size={28} className="text-emerald-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-ink mb-1">{t('brief.done-title', locale)}</h2>
            <p className="text-xs text-ink-tertiary">{t('brief.done-subtitle', locale)}</p>
          </div>

          <div className="card p-5">
            <h3 className="text-xs text-ink-tertiary uppercase tracking-wider mb-4">{t('brief.what-agents-did', locale)}</h3>
            <div className="space-y-3">
              {RESULT_PLAN.map((s, i) => (
                <div key={s.agent} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: `${s.color}20` }}>
                      {s.emoji}
                    </div>
                    {i < RESULT_PLAN.length - 1 && <div className="w-px h-4 bg-line mt-1" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-ink font-medium mb-0.5">{s.agent}</p>
                    <p className="text-xs text-ink-tertiary leading-relaxed">{t(s.task, locale)}</p>
                  </div>
                  <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-surface">
            <p className="text-xs text-ink-tertiary mb-2">{t('brief.brief-sent', locale)}</p>
            <div className="flex flex-wrap gap-2">
              {[form.client, form.platform, form.format, form.pillar].filter(Boolean).map(tag => (
                <span key={tag} className="text-[11px] bg-surface-elevated text-ink-tertiary px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={reset} className="py-2.5 rounded-xl text-sm border border-line text-ink-tertiary hover:text-ink transition-colors">
              {t('brief.new-brief', locale)}
            </button>
            <a href="/approvals" className="py-2.5 rounded-xl text-sm bg-ink text-page font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-colors">
              {t('brief.view-in-approvals', locale)} <ArrowRight size={13} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
