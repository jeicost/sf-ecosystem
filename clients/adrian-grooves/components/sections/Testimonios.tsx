import { cmsArr, cmsVal } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

type Testi = { quote: string; author: string }

/**
 * NO HAY FALLBACK A PROPÓSITO.
 *
 * Hasta el 21-sep-2026 este componente traía tres testimonios inventados como
 * valor por defecto («Creador de contenido · 8k seguidores», «Artista urbano
 * independiente», «Pequeña marca de moda»). Estaban PUBLICADOS en producción
 * en una página que va a cobrar, y vaciar la lista en el CMS no los habría
 * quitado: `cmsArr` descarta los arrays vacíos y habría vuelto a caer en el
 * fallback, o sea, a los inventados. Un fallo mudo que reaparece solo.
 *
 * Ahora la sección simplemente NO EXISTE mientras no haya testimonios reales.
 * En cuanto los haya —compradores de la pre-venta, a partir de diciembre de
 * 2026— se añaden en el CMS con nombre y permiso por escrito y la sección
 * vuelve sola. Mientras tanto, la prueba la pone el trabajo real de Adrian
 * (componente `Trabajo`), que sí es verificable.
 */
export function Testimonios({ data }: { data: Record<string, unknown> }) {
  const items = cmsArr<Testi>(data, 'items')
  if (!items) return null

  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  return (
    <Shell tc={`09 · ${f('eyebrow', 'Lo que dicen')}`} surface>
      <h2 className="display text-3xl sm:text-5xl">{f('headline', 'Resultados de quienes ya lo aplican')}</h2>
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
