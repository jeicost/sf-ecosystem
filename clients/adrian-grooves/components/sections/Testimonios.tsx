import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

type Testi = { quote: string; author: string }

const DEFAULT: Testi[] = [
  { quote: 'Llevaba un año pensando en cambiar de cámara. Con el módulo de luz y el de edición mis Reels dieron un salto que no había conseguido en meses. No me he gastado un euro en equipo nuevo.', author: 'Creador de contenido · 8k seguidores' },
  { quote: 'Grabé el videoclip de mi último single yo solo con el móvil siguiendo lo que enseña Adrian. La discográfica pensó que lo había pagado a una productora.', author: 'Artista urbano independiente' },
  { quote: 'Tengo una tienda online y ahora grabo yo los vídeos de producto. Han subido las ventas y me ahorro lo que pagaba a una agencia.', author: 'Pequeña marca de moda' },
]

export function Testimonios({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const items = cmsArr<Testi>(data, 'items') ?? DEFAULT
  return (
    <Shell tc={`07 · ${f('eyebrow', 'Lo que dicen')}`} surface>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display text-3xl sm:text-5xl">{f('headline', 'Resultados de quienes ya lo aplican')}</h2>
        <span className="rounded-sm border border-line-bright px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-dim">
          Ejemplo · sustituir por reales
        </span>
      </div>
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {items.map((t, i) => (
          <figure key={i} className="flex flex-col justify-between rounded-sm border border-line bg-bg p-6">
            <blockquote className="text-[0.98rem] leading-relaxed text-text">&ldquo;{t.quote}&rdquo;</blockquote>
            <figcaption className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-dim">— {t.author}</figcaption>
          </figure>
        ))}
      </div>
    </Shell>
  )
}
