'use client'
import { useState } from 'react'
import type { HomeContent } from '@/lib/content/home'
import { UI, altPath, type Locale } from '@/lib/i18n'

/**
 * La home de MIRA, en un solo componente cliente.
 *
 * REGLA DE ESTE FICHERO: aquí no hay copy. Todo el texto entra por `content`,
 * que viene de lib/content/home.ts (o su espejo en inglés) ya mezclado con
 * SF-CMS. Lo único que se escribe a mano son las cadenas de chrome de
 * lib/i18n.ts —nav, placeholders, etiquetas de agrupación— porque van pegadas
 * al layout y no tiene sentido darlas a editar. Si aparece una frase en el JSX,
 * es un bug: el CMS no podrá cambiarla y el inglés no la traducirá.
 *
 * Es cliente ('use client') por dos interacciones reales: las pestañas del
 * equipo y el acordeón de preguntas. Las dos páginas que lo montan (/ y /en)
 * sí son server components: resuelven el contenido en build-time y se lo pasan
 * ya resuelto.
 *
 * El lenguaje visual (degradados morados, glows, ripples, tarjetas con borde de
 * 1px) es el de la landing original y se conserva a propósito. Lo que cambió es
 * de dónde sale el texto y qué secciones hay.
 */

const PORTAL_URL = 'https://mira.startupsfactory.es/login'
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/jacostech@gmail.com'

/** Todas las claves del copy, ya con los valores del CMS aplicados. */
type Content = Record<keyof HomeContent, string>

/** Paleta por área. El orden es el de team_1..3: marketing, ventas, dirección. */
const TEAM_COLORS = ['#8B5CF6', '#EF4444', '#6366F1'] as const

/**
 * Ilustraciones abstractas de cada área. Vienen de las que ya tenía la landing
 * para los departamentos; se les han quitado las etiquetas de texto porque eran
 * copy en inglés incrustado en el SVG y no se podían traducir ni editar.
 */
const TEAM_VISUALS: React.ReactNode[] = [
  // Marketing — piezas de contenido flotando sobre una onda
  <svg key="mkt" viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }} aria-hidden="true">
    <defs>
      <linearGradient id="mkt-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1a0a2e" /><stop offset="1" stopColor="#0a0a1a" />
      </linearGradient>
      <linearGradient id="mkt-wave" x1="0" y1="0" x2="560" y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" stopOpacity="0" />
        <stop offset="0.4" stopColor="#8B5CF6" stopOpacity="0.8" />
        <stop offset="1" stopColor="#c4b5fd" stopOpacity="0.2" />
      </linearGradient>
      <filter id="mkt-blur"><feGaussianBlur stdDeviation="12" /></filter>
    </defs>
    <rect width="560" height="220" fill="url(#mkt-bg)" />
    <ellipse cx="280" cy="110" rx="200" ry="100" fill="#7c3aed" fillOpacity="0.12" filter="url(#mkt-blur)" />
    {[
      { x: 60, y: 50, w: 110, h: 70, op: 0.9 },
      { x: 200, y: 30, w: 130, h: 55, op: 0.7 },
      { x: 360, y: 60, w: 100, h: 80, op: 0.8 },
      { x: 100, y: 140, w: 120, h: 50, op: 0.5 },
      { x: 260, y: 120, w: 90, h: 65, op: 0.6 },
      { x: 420, y: 150, w: 110, h: 45, op: 0.4 },
    ].map((c, i) => (
      <g key={i}>
        <rect x={c.x} y={c.y} width={c.w} height={c.h} rx="8" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.25)" strokeWidth="1" opacity={c.op} />
        <rect x={c.x + 10} y={c.y + 12} width={c.w * 0.6} height="6" rx="3" fill="#8B5CF6" fillOpacity="0.5" opacity={c.op} />
        <rect x={c.x + 10} y={c.y + 24} width={c.w * 0.85} height="4" rx="2" fill="rgba(255,255,255,0.15)" opacity={c.op} />
        <rect x={c.x + 10} y={c.y + 34} width={c.w * 0.7} height="4" rx="2" fill="rgba(255,255,255,0.1)" opacity={c.op} />
      </g>
    ))}
    <path d="M170 85 Q200 60 200 57" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
    <path d="M330 57 Q360 70 360 100" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
    <path d="M0 180 Q140 140 280 160 Q420 180 560 140" stroke="url(#mkt-wave)" strokeWidth="1.5" fill="none" />
  </svg>,

  // Ventas — embudo con contactos que se van filtrando
  <svg key="sls" viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }} aria-hidden="true">
    <defs>
      <linearGradient id="sls-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1a0808" /><stop offset="1" stopColor="#0a0a0f" />
      </linearGradient>
      <filter id="sls-blur"><feGaussianBlur stdDeviation="14" /></filter>
    </defs>
    <rect width="560" height="220" fill="url(#sls-bg)" />
    <ellipse cx="280" cy="110" rx="180" ry="80" fill="#EF4444" fillOpacity="0.1" filter="url(#sls-blur)" />
    {[
      { x: 30, y: 30, w: 500, h: 38 },
      { x: 70, y: 82, w: 420, h: 34 },
      { x: 120, y: 130, w: 320, h: 30 },
      { x: 180, y: 174, w: 200, h: 26 },
    ].map((row, i) => (
      <g key={i}>
        <rect x={row.x} y={row.y} width={row.w} height={row.h} rx="6"
          fill={`rgba(239,68,68,${0.07 - i * 0.01})`}
          stroke={`rgba(239,68,68,${0.35 - i * 0.05})`} strokeWidth="1" />
        {Array.from({ length: Math.max(2, 6 - i) }).map((_, j) => (
          <circle key={j} cx={row.x + 18 + j * 24} cy={row.y + row.h / 2} r="4" fill="#EF4444" fillOpacity={0.7 - j * 0.05} />
        ))}
      </g>
    ))}
    {[42, 94, 142].map((y, i) => (
      <rect key={i} x="480" y={y} width="46" height="18" rx="9" fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
    ))}
  </svg>,

  // Dirección — plan en tres bloques sobre una retícula
  <svg key="str" viewBox="0 0 560 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }} aria-hidden="true">
    <defs>
      <linearGradient id="str-bg" x1="0" y1="0" x2="560" y2="220" gradientUnits="userSpaceOnUse">
        <stop stopColor="#080814" /><stop offset="1" stopColor="#0a0a18" />
      </linearGradient>
      <filter id="str-blur"><feGaussianBlur stdDeviation="16" /></filter>
    </defs>
    <rect width="560" height="220" fill="url(#str-bg)" />
    <ellipse cx="280" cy="110" rx="160" ry="100" fill="#6366F1" fillOpacity="0.1" filter="url(#str-blur)" />
    {[0, 1, 2, 3, 4, 5, 6].map(i => (
      <line key={`v${i}`} x1={80 * i} y1="0" x2={80 * i} y2="220" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
    ))}
    {[0, 1, 2, 3, 4].map(i => (
      <line key={`h${i}`} x1="0" y1={55 * i} x2="560" y2={55 * i} stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
    ))}
    {[
      { x: 40, y: 40, w: 130, fill: '#6366F1' },
      { x: 200, y: 40, w: 140, fill: '#8B5CF6' },
      { x: 370, y: 40, w: 140, fill: '#a78bfa' },
    ].map((block, i) => (
      <g key={i}>
        <rect x={block.x} y={block.y} width={block.w} height={130} rx="10" fill={`${block.fill}10`} stroke={`${block.fill}30`} strokeWidth="1.5" />
        <rect x={block.x} y={block.y} width={block.w} height={6} rx="3" fill={block.fill} fillOpacity="0.6" />
        {[0, 1, 2].map(j => (
          <rect key={j} x={block.x + 12} y={block.y + 38 + j * 22} width={block.w - 24} height="14" rx="4" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        ))}
        {i < 2 && <path d={`M ${block.x + block.w + 2} ${block.y + 65} L ${block.x + block.w + 16} ${block.y + 65}`} stroke={block.fill} strokeWidth="1.5" strokeOpacity="0.5" />}
      </g>
    ))}
    <circle cx="280" cy="190" r="12" fill="none" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
    <circle cx="280" cy="190" r="3" fill="#6366F1" fillOpacity="0.8" />
  </svg>,
]

function MiraIcon({ size = 40, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true"
      style={glow ? { filter: 'drop-shadow(0 0 24px rgba(124,58,237,0.8))' } : {}}>
      <path d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72"
        stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72"
        stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="50" cy="57" r="2" fill="#7c3aed" />
      <circle cx="49.2" cy="56.2" r="0.6" fill="rgba(255,255,255,0.8)" />
    </svg>
  )
}

function Check({ color = '#a78bfa' }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 3 }} aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke={`${color}40`} strokeWidth="1" />
      <path d="M4 7l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Cintillo de sección: eyebrow + título + entradilla, siempre igual. */
function Head({ eyebrow, title, lead, center, accent }: {
  eyebrow: string; title: string; lead?: string; center?: boolean; accent?: boolean
}) {
  return (
    <div style={{ marginBottom: 48, textAlign: center ? 'center' : 'left', maxWidth: center ? 760 : 720, marginLeft: center ? 'auto' : undefined, marginRight: center ? 'auto' : undefined }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: accent ? '#7c3aed' : 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>{eyebrow}</p>
      <h2 style={{ fontSize: 'clamp(28px,3.6vw,46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: lead ? 18 : 0 }}>{title}</h2>
      {lead && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.75 }}>{lead}</p>}
    </div>
  )
}

export default function HomeView({ content, locale }: { content: Content; locale: Locale }) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTeam, setActiveTeam] = useState(0)
  const c = content
  const t = UI[locale]

  /** Lectura por índice de los campos numerados (price_3_f2, faq_5_q…). */
  const f = (key: string) => c[key as keyof Content]

  const teams = [0, 1, 2].map(i => ({
    name: f(`team_${i + 1}_name`),
    text: f(`team_${i + 1}_text`),
    color: TEAM_COLORS[i],
    visual: TEAM_VISUALS[i],
  }))

  const plans = [1, 2, 3, 4, 5].map(n => ({
    n,
    name: f(`price_${n}_name`),
    for: f(`price_${n}_for`),
    amount: f(`price_${n}_amount`),
    period: f(`price_${n}_period`),
    usd: f(`price_${n}_usd`),
    setup: f(`price_${n}_setup`),
    features: [1, 2, 3, 4, 5].map(i => f(`price_${n}_f${i}`)),
    cta: f(`price_${n}_cta`),
    featured: f(`price_${n}_featured`) === 'true',
    // Starter se contrata solo; Enterprise pasa por una conversación.
    selfServe: n <= 2,
  }))

  const starter = plans.filter(p => p.selfServe)
  const enterprise = plans.filter(p => !p.selfServe)

  /**
   * Valor que viaja en el email del formulario. Se calcula una sola vez para
   * el <option> y para la preselección: si los dos lados no coinciden al
   * carácter, el navegador descarta el value y el comercial recibe un aviso
   * sin plan — que es justo el dato por el que se hizo clic.
   */
  const planValue = (p: (typeof plans)[number]) => `${p.name} — ${p.amount}${p.period}`

  /** Los CTA de Enterprise bajan al formulario y dejan el plan ya elegido. */
  const goToForm = (plan: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const select = document.querySelector<HTMLSelectElement>('#contact select[name="plan"]')
    if (select) select.value = plan
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const planCard = (p: (typeof plans)[number]) => (
    <div key={p.n} className="plan-card" style={{
      padding: '32px 28px', borderRadius: 20, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      border: p.featured ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.09)',
      background: p.featured ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.025)',
      boxShadow: p.featured ? '0 0 60px rgba(124,58,237,0.16)' : 'none',
    }}>
      {p.featured && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)' }} />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: '#f4f4f8' }}>{p.name}</p>
        {p.featured && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', color: '#c4b5fd', whiteSpace: 'nowrap' }}>{t.pricing.featured}</span>
        )}
      </div>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, minHeight: 38 }}>{p.for}</p>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 18 }}>
        <span style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: '#f4f4f8', lineHeight: 1 }}>{p.amount}</span>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{p.period}</span>
      </div>
      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>{p.usd}{p.period}</p>

      <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, margin: '18px 0 22px', padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>{p.setup}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 28, flex: 1 }}>
        {p.features.map((feat, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Check color={p.featured ? '#a78bfa' : 'rgba(255,255,255,0.55)'} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{feat}</span>
          </div>
        ))}
      </div>

      <a
        href={p.selfServe ? PORTAL_URL : '#contact'}
        onClick={p.selfServe ? undefined : goToForm(planValue(p))}
        style={{
          display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, fontSize: 14,
          fontWeight: p.featured ? 700 : 600, textDecoration: 'none',
          color: p.featured ? '#fff' : '#f4f4f8',
          background: p.featured ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(255,255,255,0.07)',
          border: p.featured ? 'none' : '1px solid rgba(255,255,255,0.12)',
          boxShadow: p.featured ? '0 0 28px rgba(124,58,237,0.4)' : 'none',
        }}>{p.cta}</a>
    </div>
  )

  return (
    <main style={{ overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href={locale === 'en' ? '/en' : '/'} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <MiraIcon size={26} />
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.04em', color: '#f4f4f8' }}>MIRA</span>
            <span className="nav-tagline" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 2 }}>{t.nav.byline}</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <a href="#brain" className="nav-link" style={navLink}>{t.nav.brain}</a>
            <a href="#how" className="nav-link" style={navLink}>{t.nav.how}</a>
            <a href="#pricing" style={navLink}>{t.nav.pricing}</a>
            <a href={altPath(locale === 'en' ? '/en' : '/', locale === 'en' ? 'es' : 'en')}
              aria-label={t.switcher.aria}
              style={{ ...navLink, fontWeight: 700, letterSpacing: '0.06em', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, padding: '5px 10px', margin: '0 6px' }}>
              {t.switcher.label}
            </a>
            <a href={PORTAL_URL} style={{
              fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none',
              padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
              boxShadow: '0 0 20px rgba(124,58,237,0.35)', whiteSpace: 'nowrap',
            }}>{t.nav.signIn} →</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 58, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 900, height: 700, background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.5) 50%,transparent)' }} />
        </div>

        {/* Fichas flotantes: lo que el equipo produce, adelantado en el hero.
            Van pegadas a los márgenes porque el H1 ocupa 1000px centrados; por
            debajo de 1300px ya no hay margen donde ponerlas y se ocultan. */}
        {[
          { label: c.team_1_name, x: 1.5, y: 16 },
          { label: c.tools_3_title, x: 85, y: 12 },
          { label: c.team_2_name, x: 86, y: 68 },
          { label: c.tools_4_title, x: 3, y: 70 },
          { label: c.team_3_name, x: 33, y: 10 },
          { label: c.tools_1_title, x: 1, y: 43 },
          { label: c.tools_2_title, x: 84, y: 40 },
        ].map((chip, i) => (
          <div key={i} className="agent-float" style={{
            position: 'absolute', left: `${chip.x}%`, top: `${chip.y}%`, zIndex: 2, maxWidth: 190,
            animation: `agentFloat ${5 + i * 0.4}s ease-in-out ${i * 0.5}s infinite`,
          }}>
            <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(14,14,22,0.9)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{chip.label}</p>
            </div>
          </div>
        ))}

        <div className="hero-content" style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', padding: '80px 24px', textAlign: 'center', zIndex: 3 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 100, border: '1px solid rgba(124,58,237,0.3)', marginBottom: 36 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-glow 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(167,139,250,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.hero_eyebrow}</span>
          </div>

          {/* Logo animado: ondas + núcleo que respira */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.35)', animation: 'ripple1 3s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.2)', animation: 'ripple1 3s ease-out 1s infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.1)', animation: 'ripple1 3s ease-out 2s infinite' }} />
              <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0.1) 50%, transparent 75%)', animation: 'coreGlow 2.8s ease-in-out infinite' }} />
              <svg width="72" height="72" viewBox="0 0 100 100" fill="none" style={{ position: 'relative', zIndex: 1 }} aria-hidden="true">
                <path d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72" stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: 'strokeBrighten 2.8s ease-in-out infinite' }} />
                <path d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72" stroke="#f4f4f8" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" style={{ animation: 'strokeBrighten 2.8s ease-in-out infinite' }} />
                <circle cx="50" cy="57" r="5" fill="#7c3aed" fillOpacity="0.25" style={{ animation: 'pupilGlow 2.8s ease-in-out infinite' }} />
                <circle cx="50" cy="57" r="2.2" fill="#7c3aed" style={{ animation: 'pupilGlow 2.8s ease-in-out infinite' }} />
                <circle cx="49" cy="56" r="0.8" fill="rgba(255,255,255,0.95)" />
              </svg>
            </div>
          </div>

          <h1 className="hero-h1" style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.05em', marginBottom: 20 }}>
            <span style={{ display: 'block', color: '#f4f4f8' }}>{c.hero_title}</span>
            <span style={{ display: 'block', background: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{c.hero_title_accent}</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.7vw,19px)', color: 'rgba(255,255,255,0.45)', maxWidth: 660, margin: '24px auto 40px', lineHeight: 1.7 }}>{c.hero_sub}</p>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <a href={PORTAL_URL} style={{
              fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 36px rgba(124,58,237,0.45)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>{c.hero_cta_primary} →</a>
            <a href="#how" style={{
              fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', padding: '14px 32px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>{c.hero_cta_secondary}</a>
          </div>

          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.28)' }}>{c.hero_note}</p>
        </div>
      </section>

      {/* ── EL PROBLEMA ── */}
      <section id="problem" style={{ background: '#0a0a0f', padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Head eyebrow={c.problem_eyebrow} title={c.problem_title} lead={c.problem_lead} />
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ padding: '26px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, color: '#ef4444', lineHeight: 1 }} aria-hidden="true">×</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#f4f4f8' }}>{f(`problem_${n}_title`)}</p>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{f(`problem_${n}_text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL CEREBRO ── */}
      <section id="brain" style={{ background: '#0c0c14', padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid-2-wide" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>{c.brain_eyebrow}</p>
            <h2 style={{ fontSize: 'clamp(28px,3.6vw,46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 18 }}>{c.brain_title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.75, marginBottom: 28 }}>{c.brain_lead}</p>
            <div style={{ padding: '18px 22px', borderRadius: 12, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.22)' }}>
              <p style={{ fontSize: 13.5, color: '#c4b5fd', lineHeight: 1.7 }}>{c.brain_proof}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[1, 2, 3].map((n, i) => (
              <div key={n} style={{
                padding: '24px 28px', borderRadius: 12, display: 'flex', gap: 20, alignItems: 'flex-start',
                background: i === 1 ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.02)',
                border: i === 1 ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', paddingTop: 3 }}>{`0${n}`}</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f8', marginBottom: 6 }}>{f(`brain_${n}_title`)}</h3>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.65 }}>{f(`brain_${n}_text`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="how" style={{ padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Head eyebrow={c.how_eyebrow} title={c.how_title} center />
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ padding: 32, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em' }}>{`0${n}`}</span>
                <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f8', margin: '16px 0 10px' }}>{f(`how_${n}_step`)}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7 }}>{f(`how_${n}_text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EL EQUIPO ── (hereda el tratamiento de pestañas de los departamentos) */}
      <section id="team" style={{ padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Head eyebrow={c.team_eyebrow} title={c.team_title} lead={c.team_lead} center />

          <div className="teams-tabs-bar" role="tablist" style={{ display: 'flex', gap: 2, marginBottom: 2, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: 4 }}>
            {teams.map((team, i) => (
              <button key={i} role="tab" aria-selected={activeTeam === i} onClick={() => setActiveTeam(i)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.18s',
                  background: activeTeam === i ? 'rgba(255,255,255,0.08)' : 'transparent', fontFamily: 'inherit',
                }}>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: activeTeam === i ? '#f4f4f8' : 'rgba(255,255,255,0.4)' }}>{team.name}</span>
                {activeTeam === i && <div style={{ width: '36%', height: 2, borderRadius: 2, background: team.color, margin: '7px auto 0', boxShadow: `0 0 8px ${team.color}` }} />}
              </button>
            ))}
          </div>

          <div className="teams-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ position: 'relative', minHeight: 220, borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              {teams[activeTeam].visual}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0.85))' }} />
            </div>
            <div className="teams-panel-info" style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 100, background: `${teams[activeTeam].color}15`, border: `1px solid ${teams[activeTeam].color}30`, marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: teams[activeTeam].color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{teams[activeTeam].name}</span>
              </div>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>{teams[activeTeam].text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HERRAMIENTAS ── */}
      {/* Dos bloques, no una lista: lo que trae toda suscripción y los módulos
          que se montan por operativa. Es la misma estructura que ve el cliente
          dentro, en la sección Tools del portal. */}
      <section id="tools" style={{ background: '#0c0c14', padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Head eyebrow={c.tools_eyebrow} title={c.tools_title} center />
          <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: 680, margin: '-18px auto 40px', textAlign: 'center' }}>
            {c.tools_lead}
          </p>

          <p style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            {c.tools_included_label}
          </p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 44 }}>
            {[1, 2, 3].map((n, i) => {
              const color = ['#8B5CF6', '#a78bfa', '#6366F1'][i]
              return (
                <div key={n} style={{
                  padding: '30px 26px 32px', borderRadius: 18,
                  border: `1px solid ${color}22`,
                  background: `linear-gradient(160deg, ${color}0d 0%, rgba(10,10,15,0) 65%)`,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}30`, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.04em' }}>{`0${n}`}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f8', marginBottom: 10 }}>{f(`tools_${n}_title`)}</h3>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f(`tools_${n}_text`)}</p>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
            {c.tools_modules_label}
          </p>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {[4, 5].map((n, i) => {
              const color = ['#c4b5fd', '#818cf8'][i]
              return (
                <div key={n} style={{
                  padding: '30px 30px 32px', borderRadius: 18,
                  border: `1px solid ${color}22`,
                  background: `linear-gradient(160deg, ${color}0d 0%, rgba(10,10,15,0) 65%)`,
                }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f8', marginBottom: 10 }}>{f(`tools_${n}_title`)}</h3>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f(`tools_${n}_text`)}</p>
                </div>
              )
            })}
          </div>

          <div style={{
            padding: 'clamp(24px,3.5vw,34px)', borderRadius: 18,
            border: '1px dashed rgba(196,181,253,0.28)',
            background: 'linear-gradient(150deg, rgba(124,58,237,0.07) 0%, rgba(10,10,15,0) 70%)',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: '#f4f4f8', marginBottom: 10 }}>{c.tools_custom_title}</h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 760 }}>{c.tools_custom_text}</p>
          </div>
        </div>
      </section>

      {/* ── LICITACIONES (destacado) ── */}
      <section id="tenders" style={{ padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(124,58,237,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 940, margin: '0 auto', padding: 'clamp(32px,5vw,56px)', borderRadius: 24, border: '1px solid rgba(124,58,237,0.28)', background: 'linear-gradient(150deg, rgba(124,58,237,0.1) 0%, rgba(12,12,20,0.6) 70%)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>{c.tender_eyebrow}</p>
          <h2 style={{ fontSize: 'clamp(30px,4.4vw,52px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 18, background: 'linear-gradient(135deg,#f4f4f8 0%,#c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{c.tender_title}</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 720, marginBottom: 32 }}>{c.tender_lead}</p>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 34 }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Check />
                <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{f(`tender_${n}`)}</span>
              </div>
            ))}
          </div>
          <a href="#pricing" style={{
            fontSize: 14.5, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '13px 30px', borderRadius: 12,
            background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 32px rgba(124,58,237,0.4)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>{c.tender_cta} →</a>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="pricing" style={{ background: '#0c0c14', padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <Head eyebrow={c.pricing_eyebrow} title={c.pricing_title} lead={c.pricing_lead} center />

          {/* Cinco planes no caben en una fila: se separan en los dos paquetes
              con los que se vende, que además es la diferencia real de producto. */}
          <div style={{ marginBottom: 44 }}>
            <div style={pkgHeader}>
              <span style={pkgLabel}>{t.pricing.groupStarter}</span>
              <span style={pkgNote}>{t.pricing.groupStarterNote}</span>
              <span style={pkgRule} aria-hidden="true" />
            </div>
            <div className="grid-starter" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14, maxWidth: 720 }}>
              {starter.map(planCard)}
            </div>
          </div>

          <div>
            <div style={pkgHeader}>
              <span style={pkgLabel}>{t.pricing.groupEnterprise}</span>
              <span style={pkgNote}>{t.pricing.groupEnterpriseNote}</span>
              <span style={pkgRule} aria-hidden="true" />
            </div>
            <div className="grid-enterprise" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14, alignItems: 'stretch' }}>
              {enterprise.map(planCard)}
            </div>
          </div>

          {/* Complementos */}
          <div style={{ marginTop: 44, padding: '26px 30px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18 }}>{c.addons_title}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n} style={{ fontSize: 12.5, padding: '7px 14px', borderRadius: 100, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: 'rgba(255,255,255,0.6)' }}>{f(`addon_${n}`)}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PREGUNTAS ── */}
      <section id="faq" style={{ padding: '84px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.4vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 36, textAlign: 'center' }}>{c.faq_title}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[1, 2, 3, 4, 5, 6].map((n, i) => (
              <div key={n} style={{
                borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
                border: `1px solid ${openFaq === i ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.07)'}`,
                background: openFaq === i ? 'rgba(124,58,237,0.04)' : 'transparent',
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i} aria-label={t.faqAria}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 20, fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: openFaq === i ? '#f4f4f8' : 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>{f(`faq_${n}_q`)}</span>
                  <span aria-hidden="true" style={{ fontSize: 20, color: openFaq === i ? '#a78bfa' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', fontWeight: 300 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 22px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{f(`faq_${n}_a`)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CIERRE ── */}
      <section id="contact" style={{ padding: '96px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 70% at 50% 50%, rgba(124,58,237,0.12), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
            <MiraIcon size={56} glow />
          </div>
          <h2 style={{ fontSize: 'clamp(30px,4.6vw,56px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.05, marginBottom: 18 }}>{c.cta_title}</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.42)', marginBottom: 34, lineHeight: 1.6 }}>{c.cta_lead}</p>

          <a href={PORTAL_URL} style={{
            fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none', padding: '15px 34px', borderRadius: 12,
            background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', boxShadow: '0 0 40px rgba(124,58,237,0.45)',
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40,
          }}>{c.cta_button} →</a>

          {/* El botón secundario del copy ("hablar con nosotros") ES este
              formulario: sigue yendo a FormSubmit y a /thank-you, como antes. */}
          <form
            id="contact-form"
            aria-label={t.form.aria}
            onSubmit={async (e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              try {
                await fetch(FORM_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: data })
              } finally {
                window.location.href = '/thank-you'
              }
            }}
            style={{ display: 'flex', gap: 8, maxWidth: 460, margin: '0 auto 18px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input type="hidden" name="_subject" value={t.form.subject} />
            <input type="hidden" name="_captcha" value="false" />
            <input type="hidden" name="_template" value="table" />
            <input type="hidden" name="locale" value={locale} />
            <select name="plan" defaultValue="" required style={fieldStyle}>
              <option value="" disabled>{t.form.planPlaceholder}</option>
              {plans.map(p => <option key={p.n} value={planValue(p)}>{p.name}</option>)}
              <option value="?">{t.form.planOther}</option>
            </select>
            <input type="email" name="email" required placeholder={t.form.emailPlaceholder} style={{ ...fieldStyle, flex: 1, minWidth: 200, color: '#f4f4f8' }} />
            <button type="submit" style={{
              width: '100%', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: 'rgba(255,255,255,0.08)', color: '#f4f4f8', border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{c.cta_secondary} →</button>
          </form>

          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>{c.cta_note}</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 24 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MiraIcon size={18} />
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.3)' }}>{c.footer_tagline}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a href="/terms" style={footLink}>{t.footer.terms}</a>
            <a href="/privacy" style={footLink}>{t.footer.privacy}</a>
            <a href="/cookies" style={footLink}>{t.footer.cookies}</a>
            <a href={altPath(locale === 'en' ? '/en' : '/', locale === 'en' ? 'es' : 'en')} aria-label={t.switcher.aria} style={footLink}>{t.switcher.label}</a>
            <a href={PORTAL_URL} style={footLink}>{t.nav.signIn} →</a>
          </div>
        </div>
      </footer>

      {/*
        Este bloque se sirve tal cual dentro del HTML, así que va sin comentarios:
        lo que se escriba aquí viaja al navegador del cliente. Dos cortes que no
        se ven a simple vista: a 1040px los tres planes Enterprise dejan de caber
        legibles y pasan a dos columnas, y bajo prefers-reduced-motion se apagan
        los ripples y el latido del logo — una página de precios no debería
        marear a nadie.
      */}
      <style>{`
        @keyframes agentFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes ripple1 { 0%{transform:scale(0.85);opacity:1} 100%{transform:scale(2.2);opacity:0} }
        @keyframes coreGlow { 0%,100%{transform:scale(0.85);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
        @keyframes strokeBrighten { 0%,100%{stroke-opacity:0.65} 50%{stroke-opacity:1} }
        @keyframes pupilGlow { 0%,100%{r:2;fill-opacity:0.7} 50%{r:3;fill-opacity:1} }

        a[href="${PORTAL_URL}"], .plan-card a { transition: transform 0.18s, box-shadow 0.18s; }
        .plan-card a:hover { transform: translateY(-1px); }
        .nav-link:hover, footer a:hover { color: rgba(255,255,255,0.8) !important; }

        #contact-form input:focus, #contact-form select:focus {
          border-color: rgba(124,58,237,0.5) !important;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        #contact-form input::placeholder { color: rgba(255,255,255,0.3); }
        #contact-form select option { background: #0a0a0f; color: #f4f4f8; }

        @media (max-width: 1040px) {
          .grid-enterprise { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }

        @media (max-width: 1300px) {
          .agent-float { display: none !important; }
        }

        @media (max-width: 900px) {
          .grid-2-wide { grid-template-columns: 1fr !important; gap: 40px !important; }
          .teams-panel { grid-template-columns: 1fr !important; }
          .teams-panel > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
        }

        @media (max-width: 720px) {
          .nav-tagline, .nav-link { display: none !important; }
          .hero-content { padding: 40px 20px 56px !important; }
          .hero-section { min-height: auto !important; padding-top: 80px !important; padding-bottom: 24px !important; }
          section { padding-top: 56px !important; padding-bottom: 56px !important; }
          .grid-3, .grid-2, .grid-starter, .grid-enterprise { grid-template-columns: 1fr !important; }
          .teams-panel-info { padding: 26px !important; }
          .teams-tabs-bar button { padding: 10px 4px !important; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  )
}

// ── Estilos compartidos ──────────────────────────────────────────────────────

const navLink: React.CSSProperties = {
  fontSize: 13, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', padding: '6px 12px', whiteSpace: 'nowrap',
}

const footLink: React.CSSProperties = {
  fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none',
}

const fieldStyle: React.CSSProperties = {
  padding: '13px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none',
}

const pkgHeader: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap',
}

const pkgLabel: React.CSSProperties = {
  fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c4b5fd',
}

const pkgNote: React.CSSProperties = {
  fontSize: 13, color: 'rgba(255,255,255,0.35)',
}

const pkgRule: React.CSSProperties = {
  flex: 1, minWidth: 40, height: 1, background: 'linear-gradient(90deg, rgba(124,58,237,0.35), transparent)',
}
