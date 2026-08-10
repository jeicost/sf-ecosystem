'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import MiraLogo from '@/components/mira-logo'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  // null = comprobando · false = sin sesión de recuperación · true = válido.
  // Antes isRecoveryMode se escribía y nunca se leía: la página no validaba
  // que se viniera de un enlace de recuperación (auditoría 08-10).
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    // El enlace de recuperación inicia sesión al aterrizar; un login normal
    // también tiene sesión y puede cambiar su contraseña aquí. Sin sesión ni
    // evento PASSWORD_RECOVERY, el formulario no puede funcionar: se avisa.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsRecoveryMode(true)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      setIsRecoveryMode((prev) => prev ?? Boolean(data.session))
    })
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Could not update password')
        setLoading(false)
        return
      }

      // Success — redirect to home
      router.push('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: 'var(--bg-page)' }}>
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

        {/* Center brand */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-16">
          <div className="relative mb-8">
            <div style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.6)) drop-shadow(0 0 80px rgba(99,102,241,0.25))' }}>
              <MiraLogo size={96} variant="icon" glow />
            </div>
            <div className="absolute inset-0 rounded-full opacity-30"
              style={{ boxShadow: '0 0 0 16px rgba(99,102,241,0.1)', animation: 'ringPulse 3s ease-in-out infinite' }} />
          </div>

          <h1 style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.05em', lineHeight: 1 }}>MIRA</h1>
          <p className="mt-3 text-center max-w-[280px] leading-relaxed"
            style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Your team of{' '}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>AI agents</span>{' '}
            working 24/7 to grow your business.
          </p>
        </div>

        <div className="pb-6 text-center">
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Startup Factory · Bangkok 2026</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[440px] shrink-0 flex flex-col justify-center relative"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}>

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
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Reset password
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Enter your new password to access your account
            </p>
          </div>

          {isRecoveryMode === false && (
            <div className="mb-6 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
              This page only works from a password reset link. Request one from the{' '}
              <a href="/login" className="underline" style={{ color: 'var(--text-primary)' }}>sign-in page</a>{' '}
              with &ldquo;Forgot password?&rdquo;.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" style={isRecoveryMode === false ? { opacity: .45, pointerEvents: 'none' } : undefined}>
            {/* New Password */}
            <div className="rounded-xl transition-all duration-200 flex items-center"
              style={{
                background: focused === 'password' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                border: `1px solid ${focused === 'password' ? 'rgba(99,102,241,0.55)' : 'var(--border)'}`,
                boxShadow: focused === 'password' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="pr-4 transition-colors"
                style={{ color: showPwd ? 'rgba(99,102,241,0.8)' : 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="rounded-xl transition-all duration-200 flex items-center"
              style={{
                background: focused === 'confirm' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                border: `1px solid ${focused === 'confirm' ? 'rgba(99,102,241,0.55)' : 'var(--border)'}`,
                boxShadow: focused === 'confirm' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                required
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="pr-4 transition-colors"
                style={{ color: showConfirm ? 'rgba(99,102,241,0.8)' : 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
                background: loading ? 'linear-gradient(135deg, #6366f199 0%, #4f46e599 100%)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                letterSpacing: '0.01em',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)' }} />
                  Saving...
                </span>
              ) : 'Save password'}
            </button>
          </form>

          {/* Back to login */}
          <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>
            Remembered your password?{' '}
            <a href="/login" className="underline hover:text-ink-tertiary transition-colors">
              Sign in again
            </a>
          </p>
        </div>

        <p className="absolute bottom-5 left-0 right-0 text-center text-[11px]"
          style={{ color: 'var(--text-muted)' }}>
          MIRA v3.0 · Startup Factory
        </p>
      </div>

      <style jsx global>{`
        @keyframes ringPulse {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.05; transform: scale(1.4); }
        }
        input::placeholder { color: var(--text-muted) !important; }
      `}</style>
    </div>
  )
}
