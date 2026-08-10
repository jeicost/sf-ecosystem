'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { t } from '@/lib/i18n'
import { useLocaleContext } from '@/app/locale-provider'

const ONBOARDING_KEY = 'mira_onboarding_v1'

interface Agent { emoji: string; name: string; role: string }

interface Step {
  id: string
  type: 'welcome' | 'dept' | 'done'
  color: string
  icon: string
  titleKey: string
  subtitleKey: string
  highlights: { icon: string; textKey: string }[]
  agents: Agent[]
  quickWinKey: string
  cta: { labelKey: string; href: string }
}

const STEPS: Step[] = [
  {
    id: 'welcome', type: 'welcome', color: '#6366F1', icon: '✦',
    titleKey: 'onboarding.welcome.title',
    subtitleKey: 'onboarding.welcome.subtitle',
    highlights: [
      { icon: '🤖', textKey: 'onboarding.welcome.highlight.1' },
      { icon: '🧠', textKey: 'onboarding.welcome.highlight.2' },
      { icon: '⚡', textKey: 'onboarding.welcome.highlight.3' },
    ],
    agents: [],
    quickWinKey: 'onboarding.welcome.quickwin',
    cta: { labelKey: 'onboarding.welcome.cta', href: '' },
  },
  {
    id: 'marketing', type: 'dept', color: '#8B5CF6', icon: '🎯',
    titleKey: 'onboarding.dept.marketing.title',
    subtitleKey: 'onboarding.dept.marketing.subtitle',
    highlights: [
      { icon: '📋', textKey: 'onboarding.dept.marketing.highlight.1' },
      { icon: '✍️', textKey: 'onboarding.dept.marketing.highlight.2' },
      { icon: '🎨', textKey: 'onboarding.dept.marketing.highlight.3' },
    ],
    agents: [
      { emoji: '📋', name: 'Luna',  role: 'Content Strategist' },
      { emoji: '✍️', name: 'Alex',  role: 'Copywriter' },
      { emoji: '📱', name: 'Noa',   role: 'Social Manager' },
      { emoji: '🎨', name: 'Zoe',   role: 'Designer' },
      { emoji: '🎬', name: 'Kai',   role: 'Video Editor' },
      { emoji: '📣', name: 'Riva',  role: 'Ads Manager' },
      { emoji: '👥', name: 'Sam',   role: 'Community Manager' },
    ],
    quickWinKey: 'onboarding.dept.marketing.quickwin',
    cta: { labelKey: 'onboarding.dept.marketing.cta', href: '/roster' },
  },
  {
    id: 'comercial', type: 'dept', color: '#EF4444', icon: '🚀',
    titleKey: 'onboarding.dept.comercial.title',
    subtitleKey: 'onboarding.dept.comercial.subtitle',
    highlights: [
      { icon: '🔍', textKey: 'onboarding.dept.comercial.highlight.1' },
      { icon: '🎯', textKey: 'onboarding.dept.comercial.highlight.2' },
      { icon: '📄', textKey: 'onboarding.dept.comercial.highlight.3' },
    ],
    agents: [
      { emoji: '🔍', name: 'Rex',   role: 'Lead Scout' },
      { emoji: '🎯', name: 'Vera',  role: 'ICP Scorer' },
      { emoji: '✍️', name: 'Finn',  role: 'Icebreaker Writer' },
      { emoji: '💬', name: 'Quinn', role: 'Reply Qualifier' },
      { emoji: '📄', name: 'Nova',  role: 'Proposal Writer' },
    ],
    quickWinKey: 'onboarding.dept.comercial.quickwin',
    cta: { labelKey: 'onboarding.dept.comercial.cta', href: '/comercial/discovery' },
  },
  {
    id: 'strategy', type: 'dept', color: '#6366F1', icon: '🔭',
    titleKey: 'onboarding.dept.strategy.title',
    subtitleKey: 'onboarding.dept.strategy.subtitle',
    highlights: [
      { icon: '🎯', textKey: 'onboarding.dept.strategy.highlight.1' },
      { icon: '🗺️', textKey: 'onboarding.dept.strategy.highlight.2' },
      { icon: '⚡', textKey: 'onboarding.dept.strategy.highlight.3' },
    ],
    agents: [
      { emoji: '♟️', name: 'Strategos', role: 'Strategy & Timing' },
      { emoji: '🏗️', name: 'Blueprint', role: 'Plans & Business Models' },
      { emoji: '🗺️', name: 'Atlas',     role: 'Trends & Foresight' },
      { emoji: '⚡', name: 'Spark',     role: 'Innovation Scout' },
    ],
    quickWinKey: 'onboarding.dept.strategy.quickwin',
    cta: { labelKey: 'onboarding.dept.strategy.cta', href: '/strategy/plan' },
  },
  {
    id: 'admin', type: 'dept', color: '#10B981', icon: '⚙️',
    titleKey: 'onboarding.dept.admin.title',
    subtitleKey: 'onboarding.dept.admin.subtitle',
    highlights: [
      { icon: '🛟', textKey: 'onboarding.dept.admin.highlight.1' },
      { icon: '💓', textKey: 'onboarding.dept.admin.highlight.2' },
      { icon: '🎓', textKey: 'onboarding.dept.admin.highlight.3' },
    ],
    agents: [
      { emoji: '🛟', name: 'Harbor',  role: 'Customer Support' },
      { emoji: '💓', name: 'Pulse',   role: 'Metrics & Observability' },
      { emoji: '🎓', name: 'Onboard', role: 'Processes & Training' },
    ],
    quickWinKey: 'onboarding.dept.admin.quickwin',
    cta: { labelKey: 'onboarding.dept.admin.cta', href: '/operations' },
  },
  {
    id: 'finanzas', type: 'dept', color: '#F59E0B', icon: '💰',
    titleKey: 'onboarding.dept.finanzas.title',
    subtitleKey: 'onboarding.dept.finanzas.subtitle',
    highlights: [
      { icon: '💎', textKey: 'onboarding.dept.finanzas.highlight.1' },
      { icon: '📈', textKey: 'onboarding.dept.finanzas.highlight.2' },
      { icon: '📊', textKey: 'onboarding.dept.finanzas.highlight.3' },
    ],
    agents: [
      { emoji: '💰', name: 'Midas',  role: 'Revenue Optimizer' },
      { emoji: '🧮', name: 'Quant',  role: 'Data Analyst' },
      { emoji: '📊', name: 'Fiscal', role: 'Financial Auditor' },
    ],
    quickWinKey: 'onboarding.dept.finanzas.quickwin',
    cta: { labelKey: 'onboarding.dept.finanzas.cta', href: '/finanzas/plan' },
  },
  {
    id: 'done', type: 'done', color: '#22C55E', icon: '✓',
    titleKey: 'onboarding.done.title',
    subtitleKey: 'onboarding.done.subtitle',
    highlights: [
      { icon: '🧠', textKey: 'onboarding.done.highlight.1' },
      { icon: '✍️', textKey: 'onboarding.done.highlight.2' },
      { icon: '🔍', textKey: 'onboarding.done.highlight.3' },
    ],
    agents: [],
    quickWinKey: 'onboarding.done.quickwin',
    cta: { labelKey: 'onboarding.done.cta', href: '/home' },
  },
]

const DEPT_SHORT_KEYS: Record<string, string> = {
  marketing: 'onboarding.dept.marketing.short',
  comercial: 'onboarding.dept.comercial.short',
  strategy: 'onboarding.dept.strategy.short',
  admin: 'onboarding.dept.admin.short',
  finanzas: 'onboarding.dept.finanzas.short',
}

interface OnboardingModalProps {
  userName: string
}

export default function OnboardingModal({ userName }: OnboardingModalProps) {
  const router = useRouter()
  const { locale } = useLocaleContext()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) setVisible(true)
  }, [])

  function complete() {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setVisible(false)
  }

  function goNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else complete()
  }

  function goPrev() {
    if (step > 0) setStep(s => s - 1)
  }

  function navigateCta(href: string) {
    complete()
    if (href) router.push(href)
  }

  if (!visible) return null

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast  = step === STEPS.length - 1
  const c = current.color

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-[560px] mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: 'var(--border-subtle)' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: c }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-2">
            {STEPS.map((_, i) => (
              <div key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '20px' : '6px',
                  height: '6px',
                  background: i === step ? c : i < step ? `${c}60` : 'var(--text-muted)',
                }} />
            ))}
          </div>
          <button onClick={complete}
            className="text-ink-muted hover:text-ink transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">

          {/* Welcome step */}
          {current.type === 'welcome' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
                style={{ background: `${c}15`, border: `1px solid ${c}30` }}>
                ✦
              </div>
              <h2 className="text-2xl font-bold text-ink mb-1 tracking-tight">
                {t('onboarding.greeting', locale).replace('{name}', userName.split(' ')[0])}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t(current.subtitleKey, locale)}
              </p>
              <div className="space-y-3 text-left mb-6">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-xl">{h.icon}</span>
                    <span className="text-sm text-ink">{t(h.textKey, locale)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                {t(current.quickWinKey, locale)}
              </p>
            </div>
          )}

          {/* Department step */}
          {current.type === 'dept' && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: `${c}18`, border: `1px solid ${c}30` }}>
                  {current.icon}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5"
                    style={{ color: `${c}99` }}>{t('onboarding.progress', locale).replace('{step}', String(step)).replace('{total}', String(STEPS.length - 2))}</p>
                  <h2 className="text-xl font-bold text-ink tracking-tight">{t(current.titleKey, locale)}</h2>
                </div>
              </div>

              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                {t(current.subtitleKey, locale)}
              </p>

              <div className="space-y-2.5 mb-5">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5"
                      style={{ background: `${c}15` }}>
                      <Check size={10} style={{ color: c }} />
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t(h.textKey, locale)}</span>
                  </div>
                ))}
              </div>

              {/* Agents */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {current.agents.map(a => (
                  <div key={a.name}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: `${c}0d`, border: `1px solid ${c}22` }}>
                    <span className="text-sm leading-none">{a.emoji}</span>
                    <div>
                      <p className="text-[11px] font-semibold leading-none text-ink">{a.name}</p>
                      <p className="text-[9px] leading-tight" style={{ color: `${c}aa` }}>{a.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick win */}
              <div className="px-4 py-3 rounded-xl"
                style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: `${c}80` }}>
                  {t('onboarding.first-step-label', locale)}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t(current.quickWinKey, locale)}</p>
              </div>
            </div>
          )}

          {/* Done step */}
          {current.type === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: `${c}15`, border: `1px solid ${c}30` }}>
                <Check size={28} style={{ color: c }} />
              </div>
              <h2 className="text-2xl font-bold text-ink mb-1 tracking-tight">{t(current.titleKey, locale)}</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                {t(current.subtitleKey, locale)}
              </p>
              <div className="space-y-2.5 text-left mb-6">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-xl">{h.icon}</span>
                    <span className="text-sm text-ink">{t(h.textKey, locale)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {!isFirst && (
            <button onClick={goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-ink"
              style={{ color: 'var(--text-tertiary)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <ArrowLeft size={14} />
              {t('onboarding.cta.back', locale)}
            </button>
          )}

          <button onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-ink transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ background: isLast ? `linear-gradient(135deg, ${c}, ${c}cc)` : `${c}`, boxShadow: `0 0 20px ${c}30` }}>
            {isLast ? t('onboarding.cta.start', locale) : (
              <>
                {STEPS[step + 1]?.type === 'dept'
                  ? t('onboarding.cta.next-dept', locale)
                      .replace('{icon}', STEPS[step + 1]!.icon)
                      .replace('{name}', t(DEPT_SHORT_KEYS[STEPS[step + 1]!.id], locale))
                  : t('onboarding.cta.next', locale)}
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {!isLast && current.type !== 'welcome' && (
            <button onClick={() => navigateCta(current.cta.href)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ color: c, background: `${c}12`, border: `1px solid ${c}28` }}>
              {t(current.cta.labelKey, locale)}
            </button>
          )}

          {isFirst && (
            <button onClick={complete}
              className="text-xs transition-colors hover:text-ink"
              style={{ color: 'var(--text-tertiary)' }}>
              {t('onboarding.cta.skip', locale)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
