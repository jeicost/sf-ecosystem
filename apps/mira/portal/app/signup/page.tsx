'use client'

// Registro del cliente final — la pantalla que no existía.
//
// La landing lleva meses con un botón que dice "Empezar por 99 €/mes" y llevaba
// a /login, donde no se puede empezar nada. Esto es el otro lado de ese botón.
//
// Cuatro campos y ya está dentro. Nada de tarjeta aquí: el Cerebro se construye
// en /onboarding y el cobro llega después, cuando ya ha visto lo que compra.
// Pedir la tarjeta antes de enseñar nada es la forma más rápida de que un
// autoservicio no convierta.
//
// Diseño gemelo del de /login a propósito (mismos colores literales, mismo
// panel izquierdo, misma tipografía): son las dos caras de la misma puerta y
// que se parezcan es lo que hace que no dé miedo cruzarla.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import MiraLogo from '@/components/mira-logo'
import { Eye, EyeOff, Check } from 'lucide-react'

const INCLUDED = [
  'Tu Cerebro de Marca, construido contigo en minutos',
  'Equipo de agentes, bandeja de aprobación y calendario',
  '8 informes de negocio y 19 acciones rápidas',
  '30 imágenes al mes y Google Drive conectado',
]

const FIELD_BG = 'rgba(255,255,255,0.05)'
const FIELD_BG_FOCUS = 'rgba(255,255,255,0.07)'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [alreadyExists, setAlreadyExists] = useState(false)
  const [loading, setLoading] = useState(false)

  // Misma razón que en /login: esta página tiene su propio oscuro literal y el
  // data-theme="light" que deja el dashboard la volvería ilegible.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) router.replace('/home')
      })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setAlreadyExists(false)

    let created: { clientName?: string } | null = null
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, brandName, website, email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Could not create your account.')
        setAlreadyExists(Boolean(json.existing))
        setLoading(false)
        return
      }
      created = json
    } catch {
      setError('Network error. Check your connection and try again.')
      setLoading(false)
      return
    }

    // La cuenta ya existe: entrar es un login normal. Si esto fallara —no
    // debería, la contraseña es la que acaba de escribir— la cuenta sigue
    // creada, así que se le manda al login en vez de dejarle en el limbo.
    const db = createClient()
    const { data, error: authError } = await db.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })
    if (authError || !data.user) {
      router.push('/login')
      return
    }

    const meta = data.user.user_metadata ?? {}
    setUser({
      id: data.user.id,
      name: meta.name ?? fullName ?? email,
      email: data.user.email ?? '',
      role: 'client',
      plan: meta.plan ?? 'starter',
      avatar: (fullName || email)[0]?.toUpperCase() ?? 'U',
    })

    // Directo al alta guiada: es lo único que tiene sentido hacer con una
    // cuenta recién creada y un Cerebro en blanco.
    router.push(`/onboarding?welcome=${encodeURIComponent(created?.clientName ?? brandName)}`)
  }

  const field = (name: string) => ({
    background: focused === name ? FIELD_BG_FOCUS : FIELD_BG,
    border: `1px solid ${focused === name ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.12)'}`,
    boxShadow: focused === name ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
  })

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0a0a0f' }}>
      {/* ── PANEL IZQUIERDO: qué se lleva ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden select-none">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 80% 70% at 35% 45%, rgba(99,102,241,0.18) 0%, transparent 65%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 40% 40% at 72% 80%, rgba(236,72,153,0.07) 0%, transparent 60%)' }}
          />
        </div>
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 50%, transparent)' }}
        />

        <div className="flex-1 flex flex-col justify-center relative z-10 px-20 max-w-[640px]">
          <div style={{ filter: 'drop-shadow(0 0 40px rgba(124,58,237,0.5))' }} className="mb-8">
            <MiraLogo size={64} variant="icon" glow />
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#fff', letterSpacing: '-0.045em', lineHeight: 1.05 }}>
            Empieza por tu marca
          </h1>
          <p className="mt-4 leading-relaxed" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)' }}>
            MIRA aprende cómo hablas, qué vendes y a quién, y a partir de ahí trabaja tu marca todos los días.
            Los primeros <span style={{ color: '#fff', fontWeight: 600 }}>14 días son de prueba</span>: entra,
            constrúyelo y decide después.
          </p>

          <ul className="mt-10 space-y-3.5">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.4)' }}
                >
                  <Check size={12} style={{ color: '#a5b4fc' }} />
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.72)' }}>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-10" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
            Plan Starter · 99 €/mes al terminar la prueba · Sin permanencia · Sin tarjeta ahora
          </p>
        </div>

        <div className="pb-6 text-center">
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Startup Factory · Bangkok 2026</p>
        </div>
      </div>

      {/* ── PANEL DERECHO: el formulario ── */}
      <div
        className="w-full lg:w-[460px] shrink-0 flex flex-col justify-center relative overflow-y-auto"
        style={{ background: '#101018', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.35) 50%, transparent)' }}
        />

        <div className="relative px-10 py-12">
          <div className="lg:hidden text-center mb-8">
            <div className="flex justify-center mb-2"><MiraLogo size={48} variant="icon" /></div>
            <h1 className="text-xl font-bold" style={{ color: '#fff', letterSpacing: '-0.03em' }}>MIRA</h1>
          </div>

          <div className="mb-7">
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Crea tu cuenta
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Dos minutos y estás dentro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="rounded-xl transition-all duration-200" style={field('name')}>
              <input
                type="text"
                placeholder="Tu nombre"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="name"
              />
            </div>

            <div className="rounded-xl transition-all duration-200" style={field('brand')}>
              <input
                type="text"
                placeholder="Nombre de tu marca"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                onFocus={() => setFocused('brand')}
                onBlur={() => setFocused(null)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="organization"
              />
            </div>

            <div className="rounded-xl transition-all duration-200" style={field('web')}>
              <input
                type="text"
                placeholder="Tu web (opcional — la leemos para arrancar)"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                onFocus={() => setFocused('web')}
                onBlur={() => setFocused(null)}
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="url"
              />
            </div>

            <div className="rounded-xl transition-all duration-200" style={field('email')}>
              <input
                type="email"
                placeholder="Email de trabajo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="email"
              />
            </div>

            <div className="rounded-xl transition-all duration-200 flex items-center" style={field('password')}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Contraseña (mínimo 8 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                required
                minLength={8}
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none bg-transparent"
                style={{ color: '#ffffff' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="pr-4 transition-colors"
                style={{ color: showPwd ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.3)' }}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div
                className="px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <span style={{ color: '#f87171', fontSize: '12px' }}>⚠ {error}</span>
                {alreadyExists && (
                  <>
                    {' '}
                    <Link href="/login" className="underline" style={{ color: '#fca5a5', fontSize: '12px' }}>
                      Ir al inicio de sesión
                    </Link>
                  </>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 relative overflow-hidden hover:opacity-92 mt-1"
              style={{
                background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                letterSpacing: '0.01em',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)' }}
                  />
                  Creando tu cuenta…
                </span>
              ) : (
                'Crear cuenta y empezar'
              )}
            </button>
          </form>

          <p className="text-center text-[11px] mt-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Al crear la cuenta aceptas los{' '}
            <a href="/terms" className="underline">términos</a> y la{' '}
            <a href="/privacy" className="underline">privacidad</a>.
            <br />
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="underline" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
      `}</style>
    </div>
  )
}
