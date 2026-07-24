import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

const DEFAULT_BONUS = [
  'Mi equipo recomendado según presupuesto — qué comprar (y qué NO) con 0 €, 300 € o 1.000 €.',
  'Cómo grabarte tú solo — el sistema para conseguir buenos planos sin nadie detrás de la cámara.',
  'Cómo grabar para Instagram, TikTok y YouTube — adaptado a cada plataforma.',
  'Mis LUTs y presets — el color de mis rodajes, listo para aplicar en tus vídeos.',
  'Mi checklist antes de cada rodaje — para que no se te olvide nada nunca más.',
  'Recursos de música, efectos y tipografías — dónde saco lo que uso.',
  'Errores que sigo viendo incluso en creadores con miles de seguidores — y cómo evitarlos.',
]

export function Bonus({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const items = cmsArr<string>(data, 'items') ?? DEFAULT_BONUS
  return (
    <Shell tc={`05 · ${f('eyebrow', 'Además, te llevas')}`} surface>
      <h2 className="display text-3xl sm:text-5xl">{f('headline', 'Bonus que valen por sí solos')}</h2>
      <ul className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line">
        {items.map((item, i) => (
          <li key={i} className="flex items-baseline gap-4 bg-bg px-6 py-4">
            <span className="font-mono text-sm text-accent">+{String(i + 1).padStart(2, '0')}</span>
            <span className="text-[0.98rem] leading-relaxed text-text">{item}</span>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
