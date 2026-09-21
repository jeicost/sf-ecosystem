import { cmsState, cmsVal, cmsArr } from '@/lib/cms-pages'
import { Check } from '@/components/ui/Shell'
import { site } from '@/lib/site'

/**
 * Lo que entra en el precio. Salió de `brand_data.offer.includes` del Brand
 * Brain, no de lo que suena bien: la comunidad privada, las mentorías y el
 * soporte continuo están DELIBERADAMENTE excluidos de la oferta de salida
 * («la prioridad es que el producto escale»), y esta lista los prometía.
 */
const DEFAULT_STACK = [
  'Los 9 módulos completos, paso a paso',
  // La fecha va DENTRO de la línea: «todo lo que te llevas» incluía los bonus
  // sin decir que llegan el 20-dic, y esa fecha solo aparecía en otra sección.
  'Los 7 bonus (equipo, LUTs, checklist, recursos…), completos el 20 de diciembre',
  'Actualizaciones y nuevas clases de por vida',
  'Casos reales de rodajes, comentados por dentro',
  'Acceso de por vida al contenido, desde cualquier dispositivo',
]

export function Oferta({ data, ctaUrl, abierta }: { data: Record<string, unknown>; ctaUrl: string; abierta: boolean }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const s = (k: string, fb: string) => cmsState(data, k, abierta) ?? fb
  const stack = cmsArr<string>(data, 'stack') ?? DEFAULT_STACK
  const price = f('price', site.price)
  // Vacío = sin tachado. No se inventa un descuento que nunca se ha cobrado.
  const anchor = cmsVal(data, 'price_anchor') ?? site.priceAnchor
  return (
    <section id="checkout" className="bg-bg">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32" data-reveal>
        <span className="timecode justify-center">{f('eyebrow', 'Acceso completo')}</span>
        <h2 className="display mt-6 text-center text-3xl sm:text-5xl">
          {s('headline', 'Todo lo que incluye')}
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
              {anchor && <span className="font-mono text-xl text-dim line-through">{anchor} €</span>}
              <span className="font-mono text-5xl font-semibold text-accent">{price} €</span>
            </div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-dim">
              {f('price_note', 'Pago único · menos de lo que cuesta un objetivo nuevo')}
            </p>
          </div>

          {/*
            La entrega por goteo se repite AQUÍ, pegada al botón, y no solo en su
            propia sección: quien compra un curso que todavía se está grabando
            tiene que leer la fecha justo antes de pagar. Es lo que separa un
            reembolso de un cliente contento.

            OJO con lo que NO dice: no promete que el precio no vaya a subir. Lo
            decía hasta el 21-sep («el precio no sube después») y chocaba con el
            plan de acción, que deja agendada para el 20-nov la decisión de subir
            el ticket. Solo se afirma lo que es cierto pase lo que pase: se paga
            una vez y se recibe todo.
          */}
          <p className="mt-6 rounded-sm border border-line bg-bg px-4 py-3 text-center text-[0.86rem] leading-relaxed text-muted">
            {f(
              'delivery_note',
              `Se entrega por fases: ${site.launch.modulesAtOpen} módulos al entrar y ${site.launch.dripCadence} hasta el curso completo, el ${site.launch.courseComplete}. Pagas una vez y recibes los ${site.launch.totalModules} módulos y los bonus conforme se publican, sin pagos extra.`,
            )}
          </p>

          <a href={ctaUrl} data-cta="oferta" className="btn-primary mt-6 flex w-full items-center justify-center py-4 text-sm uppercase">
            {s('cta', 'Empezar ahora')} · {price} €
          </a>
          <p className="mt-3 text-center font-mono text-[0.66rem] uppercase tracking-[0.14em] text-dim">
            {s('microcopy', 'Acceso de por vida')}
          </p>
        </div>
      </div>
    </section>
  )
}
