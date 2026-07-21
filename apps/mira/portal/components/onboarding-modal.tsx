'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'

const ONBOARDING_KEY = 'mira_onboarding_v1'

interface Agent { emoji: string; name: string; role: string }

interface Step {
  id: string
  type: 'welcome' | 'dept' | 'done'
  color: string
  icon: string
  title: string
  subtitle: string
  highlights: { icon: string; text: string }[]
  agents: Agent[]
  quickWin: string
  cta: { label: string; href: string }
}

const STEPS: Step[] = [
  {
    id: 'welcome', type: 'welcome', color: '#6366F1', icon: '✦',
    title: 'Welcome to MIRA',
    subtitle: 'Your AI team that knows your brand, runs your departments and gets smarter every week.',
    highlights: [
      { icon: '🤖', text: '23 specialized AI agents across 5 departments' },
      { icon: '🧠', text: 'Brand Brain learns your voice, style and goals' },
      { icon: '⚡', text: 'Available 24/7 — you direct, they execute' },
    ],
    agents: [],
    quickWin: 'Let\'s meet your team — one department at a time.',
    cta: { label: 'Meet my team →', href: '' },
  },
  {
    id: 'marketing', type: 'dept', color: '#8B5CF6', icon: '🎯',
    title: 'Marketing Team',
    subtitle: 'Content strategy, copywriting, design, video, ads and community — all coordinated in your brand voice.',
    highlights: [
      { icon: '📋', text: 'Luna plans your content pillars and editorial strategy' },
      { icon: '✍️', text: 'Alex writes posts, captions and scripts in your exact tone' },
      { icon: '🎨', text: 'Zoe designs visuals; Kai edits videos; Riva runs your ad strategy' },
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
    quickWin: "Start with Luna's content strategy → entire team executes in parallel.",
    cta: { label: 'Plan content →', href: '/roster' },
  },
  {
    id: 'comercial', type: 'dept', color: '#EF4444', icon: '🚀',
    title: 'Sales Team',
    subtitle: 'B2B pipeline automation — from prospecting to closed deals with AI precision.',
    highlights: [
      { icon: '🔍', text: 'Rex finds qualified leads matching your ICP automatically' },
      { icon: '🎯', text: 'Vera scores each lead 0-100 so you focus on what matters' },
      { icon: '📄', text: 'Nova generates personalized proposals in 18 minutes' },
    ],
    agents: [
      { emoji: '🔍', name: 'Rex',   role: 'Lead Scout' },
      { emoji: '🎯', name: 'Vera',  role: 'ICP Scorer' },
      { emoji: '✍️', name: 'Finn',  role: 'Icebreaker Writer' },
      { emoji: '💬', name: 'Quinn', role: 'Reply Qualifier' },
      { emoji: '📄', name: 'Nova',  role: 'Proposal Writer' },
    ],
    quickWin: 'Define your ICP → Rex builds your first qualified lead list.',
    cta: { label: 'Find leads →', href: '/comercial/discovery' },
  },
  {
    id: 'strategy', type: 'dept', color: '#6366F1', icon: '🔭',
    title: 'Strategy Team',
    subtitle: 'Business clarity in hours, not weeks. Strategic planning + trend forecasting + innovation.',
    highlights: [
      { icon: '🎯', text: 'Strategos builds your 90-day strategic plan with clear OKRs' },
      { icon: '🗺️', text: 'Atlas maps competitors, trends and future scenarios' },
      { icon: '⚡', text: 'Blueprint turns it into business models; Spark scouts new ideas' },
    ],
    agents: [
      { emoji: '♟️', name: 'Strategos', role: 'Strategy & Timing' },
      { emoji: '🏗️', name: 'Blueprint', role: 'Plans & Business Models' },
      { emoji: '🗺️', name: 'Atlas',     role: 'Trends & Foresight' },
      { emoji: '⚡', name: 'Spark',     role: 'Innovation Scout' },
    ],
    quickWin: 'Tell Strategos where you are and where you want to be. Atlas will map the road.',
    cta: { label: 'Build 90-day plan →', href: '/strategy/plan' },
  },
  {
    id: 'admin', type: 'dept', color: '#10B981', icon: '⚙️',
    title: 'Operations Team',
    subtitle: 'Customer support, metrics and processes for a small team — connectable to tools like Zoho.',
    highlights: [
      { icon: '🛟', text: 'Harbor resolves tickets, drafts replies and builds your FAQ' },
      { icon: '💓', text: 'Pulse monitors metrics and alerts you before issues happen' },
      { icon: '🎓', text: 'Onboard documents processes, SOPs and team training' },
    ],
    agents: [
      { emoji: '🛟', name: 'Harbor',  role: 'Customer Support' },
      { emoji: '💓', name: 'Pulse',   role: 'Metrics & Observability' },
      { emoji: '🎓', name: 'Onboard', role: 'Processes & Training' },
    ],
    quickWin: 'Paste a customer ticket — Harbor drafts the reply in your brand voice.',
    cta: { label: 'Check system →', href: '/operations/system' },
  },
  {
    id: 'finanzas', type: 'dept', color: '#F59E0B', icon: '💰',
    title: 'Finance Team',
    subtitle: 'Make work a choice, not a necessity. Wealth plans, portfolios and FI planning.',
    highlights: [
      { icon: '💎', text: 'Midas builds your personal wealth plan and savings system' },
      { icon: '📈', text: 'Quant designs your low-cost ETF portfolio by risk tolerance' },
      { icon: '📊', text: 'Fiscal audits your numbers and keeps you compliant' },
    ],
    agents: [
      { emoji: '💰', name: 'Midas',  role: 'Revenue Optimizer' },
      { emoji: '🧮', name: 'Quant',  role: 'Data Analyst' },
      { emoji: '📊', name: 'Fiscal', role: 'Financial Auditor' },
    ],
    quickWin: 'Tell Midas your monthly income and expenses. Get your wealth plan in 5 minutes.',
    cta: { label: 'Start wealth plan →', href: '/finanzas/plan' },
  },
  {
    id: 'done', type: 'done', color: '#22C55E', icon: '✓',
    title: 'Your team is ready.',
    subtitle: 'You\'ve met all 23 agents across 5 departments. They\'re standing by — you direct, they execute.',
    highlights: [
      { icon: '🧠', text: 'Complete your Brand Brain so agents learn your exact style' },
      { icon: '✍️', text: 'Write your first brief and watch the marketing team work' },
      { icon: '🔍', text: 'Run a lead discovery to fill your B2B pipeline' },
    ],
    agents: [],
    quickWin: 'Start anywhere — every agent is ready from day one.',
    cta: { label: 'Go to home', href: '/home' },
  },
]

interface OnboardingModalProps {
  userName: string
}

export default function OnboardingModal({ userName }: OnboardingModalProps) {
  const router = useRouter()
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
        style={{ background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
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
                  background: i === step ? c : i < step ? `${c}60` : 'rgba(255,255,255,0.15)',
                }} />
            ))}
          </div>
          <button onClick={complete}
            className="text-[#444] hover:text-white transition-colors p-1">
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
              <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                Welcome, {userName.split(' ')[0]}
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {current.subtitle}
              </p>
              <div className="space-y-3 text-left mb-6">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-xl">{h.icon}</span>
                    <span className="text-sm text-white">{h.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {current.quickWin}
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
                    style={{ color: `${c}99` }}>Department {step} of {STEPS.length - 2}</p>
                  <h2 className="text-xl font-bold text-white tracking-tight">{current.title}</h2>
                </div>
              </div>

              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {current.subtitle}
              </p>

              <div className="space-y-2.5 mb-5">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5"
                      style={{ background: `${c}15` }}>
                      <Check size={10} style={{ color: c }} />
                    </div>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{h.text}</span>
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
                      <p className="text-[11px] font-semibold leading-none text-white">{a.name}</p>
                      <p className="text-[9px] leading-tight" style={{ color: `${c}aa` }}>{a.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick win */}
              <div className="px-4 py-3 rounded-xl"
                style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: `${c}80` }}>
                  First step
                </p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>{current.quickWin}</p>
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
              <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{current.title}</h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {current.subtitle}
              </p>
              <div className="space-y-2.5 text-left mb-6">
                {current.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-xl">{h.icon}</span>
                    <span className="text-sm text-white">{h.text}</span>
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
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-white"
              style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ArrowLeft size={14} />
              Back
            </button>
          )}

          <button onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.01]"
            style={{ background: isLast ? `linear-gradient(135deg, ${c}, ${c}cc)` : `${c}`, boxShadow: `0 0 20px ${c}30` }}>
            {isLast ? 'Start directing →' : (
              <>
                {STEPS[step + 1]?.title.includes('Team') ? `Next: ${STEPS[step + 1]?.icon} ${STEPS[step + 1]?.id.charAt(0).toUpperCase() + STEPS[step + 1]?.id.slice(1)}` : 'Next'}
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {!isLast && current.type !== 'welcome' && (
            <button onClick={() => navigateCta(current.cta.href)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{ color: c, background: `${c}12`, border: `1px solid ${c}28` }}>
              {current.cta.label}
            </button>
          )}

          {isFirst && (
            <button onClick={complete}
              className="text-xs transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Skip tour
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
