'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import MiraLogo from '@/components/mira-logo'
import { Eye, EyeOff } from 'lucide-react'

const AGENTS = [
  { name: 'Strategos', role: 'Chief Strategy Officer', color: '#6366F1', emoji: '🔭', x: 8,  y: 10 },
  { name: 'Atlas',     role: 'Trend Intelligence',     color: '#a78bfa', emoji: '🗺️', x: 60, y: 6  },
  { name: 'Marco',     role: 'Creative Director',      color: '#8B5CF6', emoji: '🎬', x: 68, y: 54 },
  { name: 'Midas',     role: 'Wealth Planner',         color: '#F59E0B', emoji: '💎', x: 7,  y: 60 },
  { name: 'Rex',       role: 'Lead Scout',             color: '#EF4444', emoji: '🔍', x: 62, y: 80 },
  { name: 'Spark',     role: 'Innovation Catalyst',    color: '#EC4899', emoji: '⚡', x: 12, y: 80 },
  { name: 'Quant',     role: 'Investment Analyst',     color: '#6366F1', emoji: '📈', x: 33, y: 4  },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)
  const [showPwd, setShowPwd]   = useState(false)
  // Recuperación de contraseña: antes solo había un mailto (auditoría 08-10).
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleForgotPassword() {
    setError('')
    if (!email.trim()) {
      setError('Enter your email above first, then click "Forgot password?"')
      return
    }
    setResetLoading(true)
    const db = createClient()
    // No revelamos si la cuenta existe: la respuesta es la misma en ambos casos.
    await db.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  // /login is a public route at the middleware level (proxy.ts never checks
  // auth here), so an already-authenticated session would otherwise just see
  // the form again instead of landing on /home.
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/home')
    })
  }, [router])

  // This page has its own bespoke always-dark design (every color is a
  // literal hardcoded value, never theme tokens) and never calls initTheme().
  // A client-side nav here (e.g. the dashboard's logout button) leaves
  // data-theme="light" sitting on <html> from the previous page, which makes
  // this page's hardcoded whites get recolored dark-on-dark by the light-mode
  // CSS overrides meant for the dashboard. Force dark here without touching
  // localStorage, so the user's real preference is untouched on next login.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const db = createClient()
    const { data, error: authError } = await db.auth.signInWithPassword({ email: email.toLowerCase(), password })
    if (authError || !data.user) {
      setError('Incorrect email or password')
      setLoading(false); return
    }
    const meta = data.user.user_metadata ?? {}
    setUser({
      id: data.user.id,
      name: meta.name ?? data.user.email ?? 'User',
      email: data.user.email ?? '',
      role: meta.role ?? 'client',
      plan: meta.plan ?? 'starter',
      avatar: meta.avatar ?? (data.user.email?.[0]?.toUpperCase() ?? 'U'),
    })
    router.push('/home')
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a0f' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden select-none">
        {/* Radial ambients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 70% at 35% 45%, rgba(99,102,241,0.18) 0%, transparent 65%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 40% 40% at 72% 80%, rgba(236,72,153,0.07) 0%, transparent 60%)' }} />
        </div>

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

        {/* Top line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 50%, transparent)' }} />

        {/* Floating agent cards */}
        {AGENTS.map((agent, i) => (
          <div key={agent.name} className="absolute"
            style={{ left: `${agent.x}%`, top: `${agent.y}%`, animation: `agentFloat ${4.5 + i * 0.3}s ease-in-out ${i * 0.4}s infinite` }}>
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-sm"
              style={{
                background: 'rgba(20,20,32,0.9)',
                border: `1px solid ${agent.color}35`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${agent.color}15`,
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${agent.color}25`, border: `1px solid ${agent.color}40` }}>
                {agent.emoji}
              </div>
              <div>
                <p className="text-[12px] font-semibold leading-none" style={{ color: 'rgba(255,255,255,0.85)' }}>{agent.name}</p>
                <p className="text-[10px] mt-1 leading-none font-medium" style={{ color: `${agent.color}` }}>{agent.role}</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full ml-1 flex-shrink-0 animate-pulse" style={{ background: agent.color }} />
            </div>
          </div>
        ))}

        {/* Center brand */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-16">
          <div className="relative mb-8">
            <div style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.6)) drop-shadow(0 0 80px rgba(99,102,241,0.25))' }}>
              <MiraLogo size={96} variant="icon" glow />
            </div>
            <div className="absolute inset-0 rounded-full opacity-30"
              style={{ boxShadow: '0 0 0 16px rgba(99,102,241,0.1)', animation: 'ringPulse 3s ease-in-out infinite' }} />
          </div>

          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.05em', lineHeight: 1 }}>MIRA</h1>
          <p className="mt-3 text-center max-w-[280px] leading-relaxed"
            style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)' }}>
            Your team of{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>23 AI agents</span>{' '}
            working 24/7 to grow your business.
          </p>

          {/* Stats */}
          <div className="mt-10 flex items-stretch">
            {[
              { n: '23', l: 'Agents' },
              { n: '5',  l: 'Teams' },
              { n: '24/7', l: 'Available' },
            ].map(({ n, l }, i) => (
              <div key={l} className="text-center flex flex-col items-center px-8"
                style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.04em', lineHeight: 1 }}>{n}</span>
                <span className="mt-1.5 text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: 'rgba(255,255,255,0.35)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-6 text-center">
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Startup Factory · Bangkok 2026</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[440px] shrink-0 flex flex-col justify-center relative"
        style={{ background: '#101018', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.35) 50%, transparent)' }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(99,102,241,0.06), transparent)' }} />

        <div className="relative px-10 py-12">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-2"><MiraLogo size={48} variant="icon" /></div>
            <h1 className="text-xl font-bold text-ink" style={{ letterSpacing: '-0.03em' }}>MIRA</h1>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Sign in to MIRA
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Log in to access your AI teams
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="rounded-xl transition-all duration-200"
              style={{
                background: focused === 'email' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${focused === 'email' ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: focused === 'email' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="email"
              />
            </div>

            {/* Password with show/hide */}
            <div className="rounded-xl transition-all duration-200 flex items-center"
              style={{
                background: focused === 'password' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${focused === 'password' ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: focused === 'password' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="pr-4 transition-colors"
                style={{ color: showPwd ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.3)' }}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span style={{ color: '#f87171', fontSize: '12px' }}>⚠ {error}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 relative overflow-hidden hover:opacity-92 mt-1"
              style={{
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                letterSpacing: '0.01em',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)' }} />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Crear cuenta — la landing vende autoservicio, así que la puerta
              tiene que estar aquí y no en un mailto. */}
          <p className="text-center text-[12px] mt-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ¿Aún no tienes cuenta?{' '}
            <a href="/signup" className="font-semibold underline transition-colors" style={{ color: '#a5b4fc' }}>
              Crea la tuya en dos minutos
            </a>
          </p>

          {/* Forgot password */}
          <p className="text-center text-[11px] mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {resetSent ? (
              <span style={{ color: 'rgba(255,255,255,0.45)' }}>
                If an account exists for that email, a reset link is on its way. Check your inbox.
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="underline hover:text-ink-secondary transition-colors disabled:opacity-50"
                  style={{ color: 'inherit', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                >
                  {resetLoading ? 'Sending reset link…' : 'Forgot password?'}
                </button>
                {' · '}
                <a href="mailto:hola@startupsfactory.es" className="underline hover:text-ink-secondary transition-colors">
                  Contact support
                </a>
              </>
            )}
          </p>
        </div>

        <p className="absolute bottom-5 left-0 right-0 text-center text-[11px]"
          style={{ color: 'rgba(255,255,255,0.18)' }}>
          MIRA v3.0 · Startup Factory
        </p>
      </div>

      <style jsx global>{`
        @keyframes agentFloat {
          0%,100% { transform: translateY(0px); }
          40% { transform: translateY(-8px); }
          70% { transform: translateY(-4px); }
        }
        @keyframes ringPulse {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.05; transform: scale(1.4); }
        }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  )
}
