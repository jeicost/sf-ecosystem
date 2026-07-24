import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Check } from '@/components/ui/Shell'
import { site } from '@/lib/site'

const DEFAULT_STACK = [
  'Los 9 módulos completos, paso a paso',
  'Todos los bonus (equipo, LUTs, checklist, recursos…)',
  '1er año de comunidad y feedback incluido',
  'Actualizaciones y nuevas clases de por vida',
  'Acceso de por vida al contenido, desde cualquier dispositivo',
]

export function Oferta({ data, ctaUrl }: { data: Record<string, unknown>; ctaUrl: string }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const stack = cmsArr<string>(data, 'stack') ?? DEFAULT_STACK
  const price = f('price', site.price)
  const anchor = f('price_anchor', site.priceAnchor)
  return (
    <section id="checkout" className="bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32" data-reveal>
        <span className="timecode justify-center">{f('eyebrow', 'Acceso completo')}</span>
        <h2 className="display mt-6 text-center text-3xl sm:text-5xl">
          {f('headline', 'Todo lo que te llevas hoy')}
        </h2>

        <div className="af-frame mt-12 rounded-sm border border-accent/50 bg-surface-2 p-8 shadow-[var(--shadow-lift)] sm:p-10">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">
            {f('product_label', 'Curso · De cero a vídeos que parecen profesionales')}
          </p>

          <ul className="mt-6 space-y-3 border-b border-line pb-8">
            {stack.map((s, i) => (
              <li key={i} className="flex gap-3 text-[0.98rem] leading-relaxed text-text"><Check />{s}</li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xl text-dim line-through">{anchor} €</span>
              <span className="font-mono text-5xl font-semibold text-accent">{price} €</span>
            </div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-dim">
              {f('price_note', 'Pago único · sin suscripciones ocultas')}
            </p>
          </div>

          <a href={ctaUrl} className="btn-primary mt-8 flex w-full items-center justify-center py-4 text-sm uppercase">
            {f('cta', 'Empezar ahora')} · {price} €
          </a>
          <p className="mt-3 text-center font-mono text-[0.66rem] uppercase tracking-[0.14em] text-dim">
            {f('microcopy', 'Acceso inmediato · Garantía de 14 días')}
          </p>
        </div>
      </div>
    </section>
  )
}
