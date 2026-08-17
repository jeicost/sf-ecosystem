import Link from 'next/link'
import { Lock } from 'lucide-react'

// Pantalla completa para una sección que NO se puede usar todavía. Dos motivos,
// mismo vocabulario que NavItemStatus (lib/sections.ts) y que el marketplace:
//
//   'coming_soon' (por defecto): la sección/agente aún no existe. Es el uso
//                 original de este componente ("Agent X coming online soon").
//   'locked':     existe, pero el plan de quien mira no la incluye. Aquí NO se
//                 redirige a ningún sitio: se enseña la portada con el candado,
//                 el plan que hace falta y la salida (Billing). Un redirect mudo
//                 a /home fue justo lo que confundió a los primeros clientes.
interface Props {
  title: string
  icon: string
  color: string
  desc: string
  /** Agente que "viene": solo tiene sentido en 'coming_soon'. */
  agent?: string
  variant?: 'coming_soon' | 'locked'
  /** Nombre comercial del plan mínimo que desbloquea la sección ('locked'). */
  requiredPlan?: string | null
  /** Etiqueta del CTA de upgrade ('locked'); en inglés como el resto del portal. */
  ctaLabel?: string
}

export default function ComingSoon({
  title, icon, color, desc, agent,
  variant = 'coming_soon',
  requiredPlan,
  ctaLabel = 'See plans',
}: Props) {
  const locked = variant === 'locked'
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="text-ink-muted mt-1 text-sm">{desc}</p>
      </div>
      <div className="rounded-2xl border border-dashed flex flex-col items-center justify-center py-20 px-8 text-center"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          {icon}
          {locked && (
            <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-card)', border: `1px solid ${color}40` }}>
              <Lock size={12} style={{ color }} />
            </span>
          )}
        </div>
        <p className="text-ink font-semibold text-base mb-2">
          {locked ? `${title} — Not in your plan` : `${title} — Being set up`}
        </p>
        <p className="text-sm max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>

        {locked ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            {requiredPlan && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                <Lock size={11} style={{ color }} />
                <span className="text-xs font-medium" style={{ color }}>Available from the {requiredPlan} plan</span>
              </div>
            )}
            <Link href="/billing"
              className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: color }}>
              {ctaLabel}
            </Link>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            <span className="text-xs font-medium" style={{ color }}>
              {agent ? `Agent ${agent} coming online soon` : 'Coming online soon'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
