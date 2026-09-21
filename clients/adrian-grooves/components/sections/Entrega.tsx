import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'
import { site } from '@/lib/site'

type Hito = { when: string; what: string }

/**
 * Cómo se entrega un curso que todavía se está grabando.
 *
 * Esta sección existe por una razón muy concreta: la pre-venta abre el
 * 15-oct-2026 con 3 de los 9 módulos publicados y hay 14 días de garantía. Si
 * la página no dice con fechas qué recibe el comprador y cuándo, cada uno se
 * inventa su propio calendario y la diferencia se cobra en reembolsos. Es el
 * texto que decide si la tasa de devolución es del 5 % o del 30 %.
 */
const DEFAULT_HITOS: Hito[] = [
  { when: 'Al comprar', what: 'Entras a los módulos 00, 01 y 02: la mentalidad, la configuración de cualquier cámara o móvil y el criterio visual. Ya son aplicables a tus vídeos esta misma semana.' },
  { when: 'Cada semana', what: 'Se publica un módulo nuevo y te aviso por email. No hay que esperar a nada: el curso crece delante de ti y el acceso ya lo tienes.' },
  { when: `${site.launch.courseComplete}`, what: `Los ${site.launch.totalModules} módulos completos, incluido «Casos reales», el más diferencial: rodajes de verdad explicados por dentro, decisión a decisión.` },
  { when: 'Después, siempre', what: 'Acceso de por vida, con las actualizaciones y las clases nuevas que vaya sumando incluidas. Lo que compras hoy no caduca.' },
]

export function Entrega({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const hitos = cmsArr<Hito>(data, 'items') ?? DEFAULT_HITOS
  return (
    <Shell id="entrega" tc={`04 · ${f('eyebrow', 'Cómo se entrega')}`}>
      <div className="max-w-3xl">
        <h2 className="display text-3xl sm:text-5xl">
          {f('headline', 'Te lo cuento claro: el curso se está grabando ahora')}
        </h2>
        <p className="mt-6 text-lg text-muted">
          {f(
            'intro',
            `Entras en la primera tanda. Eso significa ${site.launch.modulesAtOpen} módulos publicados desde el primer día y ${site.launch.dripCadence} hasta tenerlo completo el ${site.launch.courseComplete}. Prefiero decírtelo antes de que pagues que después.`,
          )}
        </p>
      </div>

      <ol className="mt-10 space-y-px overflow-hidden rounded-sm border border-line bg-line">
        {hitos.map((h, i) => (
          <li key={i} className="grid gap-2 bg-bg p-6 sm:grid-cols-[13rem_1fr] sm:gap-8">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-dim">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-mono text-sm uppercase tracking-[0.1em] text-accent">{h.when}</span>
            </div>
            <p className="text-[0.98rem] leading-relaxed text-muted">{h.what}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 max-w-3xl rounded-sm border border-accent/40 bg-surface-2 p-5 text-[0.96rem] leading-relaxed text-text">
        {f(
          'closing',
          'Pagas 99 € una vez y recibes los nueve módulos y todos los bonus conforme se publican, sin pagos extra. Entrar antes no te cuesta menos: te da acceso antes.',
        )}
      </p>
    </Shell>
  )
}
