'use client'
import { useState } from 'react'
import { Send, Loader2, CheckCircle, ArrowRight, ChevronDown, Zap, X } from 'lucide-react'
import { clsx } from 'clsx'

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

const TEMPLATES: Template[] = [
  {
    id: 'weekly',
    emoji: '📅',
    label: 'Weekly content',
    description: 'Post plan for the next 7 days across all platforms.',
    color: '#06B6D4',
    prefill: {
      platform: 'All',
      format: 'Static post (IG)',
      pillar: 'No pillar (free)',
      objetivo: 'Generate 3 organic content pieces this week that keep the brand active and reinforce current audience engagement.',
    },
  },
  {
    id: 'launch',
    emoji: '🚀',
    label: 'Product launch',
    description: 'Awareness campaign for a new product or service.',
    color: '#8B5CF6',
    prefill: {
      platform: 'Instagram',
      format: 'Carousel (IG)',
      objetivo: 'Announce a new product launch generating anticipation and desire. Content must explain the main benefit and end with a clear CTA.',
    },
  },
  {
    id: 'crisis',
    emoji: '🔥',
    label: 'Reputation management',
    description: 'Respond to a negative review or manage an online crisis.',
    color: '#EF4444',
    prefill: {
      platform: 'All',
      format: 'Community reply',
      pillar: 'Community First',
      objetivo: 'Handle a negative review with empathy, without sounding defensive. Propose a concrete solution and redirect the conversation to a private channel.',
    },
  },
  {
    id: 'ads',
    emoji: '💰',
    label: 'Paid ads campaign',
    description: 'Creative brief for a Meta Ads or TikTok Ads campaign.',
    color: '#F59E0B',
    prefill: {
      platform: 'Meta Ads',
      format: 'Ad creative',
      objetivo: 'Create a creative brief for a conversion campaign on Meta Ads. The ad must have a strong hook in the first 3 seconds, demonstrate the product and close with a direct CTA.',
    },
  },
  {
    id: 'awareness',
    emoji: '🎯',
    label: 'Awareness campaign',
    description: 'Content to grow brand recognition with cold audiences.',
    color: '#10B981',
    prefill: {
      platform: 'Instagram',
      format: 'Reel / Short (vertical)',
      objetivo: 'Create brand awareness content that reaches cold audiences. The format must be entertaining before selling, and communicate the brand\'s differential value without pressure.',
    },
  },
  {
    id: 'founders',
    emoji: '🤝',
    label: 'Founder story',
    description: 'Storytelling and behind-the-scenes brand content.',
    color: '#EC4899',
    prefill: {
      platform: 'LinkedIn',
      format: 'LinkedIn post',
      pillar: 'Behind the Brand',
      objetivo: 'Tell a real moment behind the brand that creates human connection with the audience. The tone must be authentic, vulnerable at the right moment, and end with a lesson or reflection.',
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

const PROCESSING_STEPS = [
  { agent: 'Marco', emoji: '🎬', label: 'Analyzing brief and assigning team...', delay: 800 },
  { agent: 'Luna', emoji: '🔍', label: 'Luna researching angles and trends...', delay: 1800 },
  { agent: 'Alex', emoji: '✍️', label: 'Alex generating copy with Brand Brain...', delay: 2900 },
  { agent: 'Noa', emoji: '📅', label: 'Noa preparing for approval...', delay: 3800 },
]

const RESULT_PLAN = [
  { agent: 'Marco', emoji: '🎬', color: '#8B5CF6', task: 'Brief coordinated and assigned to the team' },
  { agent: 'Luna', emoji: '🔍', color: '#06B6D4', task: '3 angles detected · main hook selected' },
  { agent: 'Alex', emoji: '✍️', color: '#F59E0B', task: 'Copy generated with brand voice · ready for review' },
  { agent: 'Noa', emoji: '📅', color: '#3B82F6', task: 'Sent to Approval Queue · conditionally scheduled' },
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
  const [step, setStep] = useState<Step>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [processingStep, setProcessingStep] = useState(0)
  const [form, setForm] = useState<BriefForm>({ ...EMPTY_FORM })

  const isValid = form.platform && form.pillar && form.format && form.objetivo

  const pickTemplate = (t: Template) => {
    setSelectedTemplate(t)
    setForm(prev => ({ ...prev, ...t.prefill }))
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
        <h1 className="text-2xl font-semibold text-white">New Brief</h1>
        <p className="text-[#555] mt-1 text-sm">
          Describe what you need and Marco coordinates the team automatically.
        </p>
      </div>

      {/* ── STEP: TEMPLATES ── */}
      {step === 'templates' && (
        <>
          <p className="text-xs text-[#555] uppercase tracking-wider mb-4">Start from a template</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => pickTemplate(t)}
                className="card p-4 text-left hover:border-white/10 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${t.color}20` }}
                  >
                    {t.emoji}
                  </span>
                  <div>
                    <p className="text-sm text-white font-medium group-hover:text-white transition-colors">
                      {t.label}
                    </p>
                    <p className="text-[11px] text-[#444] mt-0.5 leading-relaxed">{t.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-0">
            <div className="flex-1 h-px bg-[#1A1A1A]" />
            <span className="text-[11px] text-[#444]">o</span>
            <div className="flex-1 h-px bg-[#1A1A1A]" />
          </div>

          <button
            onClick={skipTemplates}
            className="w-full mt-4 py-2.5 rounded-xl text-sm border border-[#1E1E1E] text-[#555] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={13} />
            Free brief from scratch
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
              <span>{selectedTemplate.label}</span>
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
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-3">Client</label>
            <div className="flex gap-2">
              {CLIENTS.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, client: c }))}
                  className={clsx(
                    'flex-1 py-2.5 rounded-lg text-sm transition-all border',
                    form.client === c
                      ? 'bg-white/10 text-white border-white/20 font-medium'
                      : 'border-[#1E1E1E] text-[#555] hover:text-white'
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
              <label className="block text-xs text-[#555] uppercase tracking-wider mb-3">Platform</label>
              <div className="relative">
                <select
                  value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111]">Choose...</option>
                  {PLATFORMS.map(p => <option key={p} value={p} className="bg-[#111]">{p}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-0 top-0.5 text-[#555] pointer-events-none" />
              </div>
            </div>
            <div className="card p-5">
              <label className="block text-xs text-[#555] uppercase tracking-wider mb-3">Format</label>
              <div className="relative">
                <select
                  value={form.format}
                  onChange={e => setForm(f => ({ ...f, format: e.target.value }))}
                  className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111]">Choose...</option>
                  {FORMATS.map(f => <option key={f} value={f} className="bg-[#111]">{f}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-0 top-0.5 text-[#555] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Pilar */}
          <div className="card p-5">
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-3">Content pillar</label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map(p => (
                <button
                  key={p}
                  onClick={() => setForm(f => ({ ...f, pillar: p }))}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs transition-all border',
                    form.pillar === p
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      : 'border-[#1E1E1E] text-[#555] hover:text-white'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div className="card p-5">
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-3">
              Objective or main idea
            </label>
            <textarea
              value={form.objetivo}
              onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
              placeholder="Ej: Mostrar el proceso de selección del wagyu de forma visual y educativa..."
              rows={4}
              className="w-full bg-transparent text-sm text-white placeholder-[#333] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Notas */}
          <div className="card p-5">
            <label className="block text-xs text-[#555] uppercase tracking-wider mb-3">
              Additional notes <span className="normal-case text-[#444]">(optional)</span>
            </label>
            <textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              placeholder="Referencias, restricciones, tono especial..."
              rows={2}
              className="w-full bg-transparent text-sm text-white placeholder-[#333] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('templates')}
              className="px-4 py-3 rounded-xl text-sm border border-[#1E1E1E] text-[#555] hover:text-white transition-colors"
            >
              ← Templates
            </button>
            <button
              onClick={submit}
              disabled={!isValid}
              className={clsx(
                'flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                isValid ? 'bg-white text-black hover:bg-white/90' : 'bg-[#1A1A1A] text-[#444] cursor-not-allowed'
              )}
            >
              <Send size={14} />
              Send to Marco
            </button>
          </div>
          {!isValid && (
            <p className="text-center text-[11px] text-[#444]">
              Fill in platform, format, pillar and objective to continue.
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
            <h2 className="text-lg font-semibold text-white mb-1">Marco is coordinating your brief</h2>
            <p className="text-xs text-[#555]">El equipo está procesando tu solicitud en tiempo real.</p>
          </div>
          <div className="space-y-3">
            {PROCESSING_STEPS.map((s, i) => {
              const done = processingStep > i
              const active = processingStep === i
              return (
                <div key={s.agent} className={clsx('flex items-center gap-3 p-3 rounded-xl transition-all', done || active ? 'opacity-100' : 'opacity-25')}>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all', done ? 'bg-emerald-500/20' : 'bg-[#1A1A1A]')}>
                    {s.emoji}
                  </div>
                  <p className="flex-1 text-sm text-[#ccc]">{s.label}</p>
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
            <h2 className="text-lg font-semibold text-white mb-1">Brief processed</h2>
            <p className="text-xs text-[#555]">El contenido está en Cola de Aprobación listo para tu revisión.</p>
          </div>

          <div className="card p-5">
            <h3 className="text-xs text-[#555] uppercase tracking-wider mb-4">What each agent did</h3>
            <div className="space-y-3">
              {RESULT_PLAN.map((s, i) => (
                <div key={s.agent} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: `${s.color}20` }}>
                      {s.emoji}
                    </div>
                    {i < RESULT_PLAN.length - 1 && <div className="w-px h-4 bg-[#1E1E1E] mt-1" />}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-xs text-white font-medium mb-0.5">{s.agent}</p>
                    <p className="text-xs text-[#555] leading-relaxed">{s.task}</p>
                  </div>
                  <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-[#0A0A0A]">
            <p className="text-xs text-[#555] mb-2">Brief enviado:</p>
            <div className="flex flex-wrap gap-2">
              {[form.client, form.platform, form.format, form.pillar].filter(Boolean).map(tag => (
                <span key={tag} className="text-[11px] bg-[#1A1A1A] text-[#666] px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={reset} className="py-2.5 rounded-xl text-sm border border-[#1E1E1E] text-[#666] hover:text-white transition-colors">
              New brief
            </button>
            <a href="/approvals" className="py-2.5 rounded-xl text-sm bg-white text-black font-semibold flex items-center justify-center gap-1.5 hover:bg-white/90 transition-colors">
              View in approvals <ArrowRight size={13} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
