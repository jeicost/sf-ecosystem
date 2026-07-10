'use client'
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  const supabase = createClient()

  // Listen for PASSWORD_RECOVERY auth state change
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Validate password strength (min 8 chars)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Error al actualizar contraseña')
        setLoading(false)
        return
      }

      // Success — redirect to home
      router.push('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setLoading(false)
    }
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
            Tu equipo de{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>30 agentes IA</span>{' '}
            trabajando 24/7 para hacer crecer tu negocio.
          </p>
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
            <h1 className="text-xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>MIRA</h1>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Restablecer contraseña
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Ingresa tu nueva contraseña para acceder a tu cuenta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* New Password */}
            <div className="rounded-xl transition-all duration-200 flex items-center"
              style={{
                background: focused === 'password' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${focused === 'password' ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: focused === 'password' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="rounded-xl transition-all duration-200 flex items-center"
              style={{
                background: focused === 'confirm' ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${focused === 'confirm' ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.12)'}`,
                boxShadow: focused === 'confirm' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                required
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="pr-4 transition-colors"
                style={{ color: showConfirm ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.3)' }}
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
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                letterSpacing: '0.01em',
              }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)' }} />
                  Guardando...
                </span>
              ) : 'Guardar contraseña'}
            </button>
          </form>

          {/* Back to login */}
          <p className="text-center text-[11px] mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            ¿Recordaste tu contraseña?{' '}
            <a href="/login" className="underline hover:text-white/50 transition-colors">
              Vuelve a iniciar sesión
            </a>
          </p>
        </div>

        <p className="absolute bottom-5 left-0 right-0 text-center text-[11px]"
          style={{ color: 'rgba(255,255,255,0.18)' }}>
          MIRA v3.0 · Startup Factory
        </p>
      </div>

      <style jsx global>{`
        @keyframes ringPulse {
          0%,100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.05; transform: scale(1.4); }
        }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  )
}
