import { cmsState, cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'
import { site } from '@/lib/site'

type Pieza = { title: string; feat?: string; url: string }

/**
 * La prueba que sí se puede comprobar.
 *
 * Ocupa el sitio que tenían los testimonios inventados. La diferencia es que
 * esto son videoclips publicados con su enlace: el visitante puede abrirlos y
 * verlos. Cuando existan testimonios reales de alumnos (diciembre 2026) las
 * dos secciones convivirán — esta no se quita, porque es el activo más fuerte
 * de la marca y lo que separa a Adrian de cualquier curso de edición.
 */
export function Trabajo({ data, abierta }: { data: Record<string, unknown>; abierta: boolean }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const s = (k: string, fb: string) => cmsState(data, k, abierta) ?? fb
  const piezas = cmsArr<Pieza>(data, 'items') ?? (site.work as readonly Pieza[] as Pieza[])
  return (
    <Shell tc={`08 · ${f('eyebrow', 'La prueba')}`} surface>
      <div className="max-w-3xl">
        <h2 className="display text-3xl sm:text-5xl">
          {f('headline', 'No te pido que me creas. Mira el trabajo.')}
        </h2>
        <p className="mt-6 text-lg text-muted">
          {s(
            'intro',
            'Todavía no hay testimonios de alumnos — y prefiero no inventármelos. Lo que sí hay son rodajes reales: estos videoclips están publicados y los puedes ver ahora mismo.',
          )}
        </p>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-3">
        {piezas.map((p, i) => (
          <a
            key={p.url}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver el videoclip ${p.title} en YouTube`}
            className="group flex flex-col justify-between bg-bg transition-colors hover:bg-bg-deep"
          >
            <div className="relative aspect-video overflow-hidden border-b border-line bg-bg-deep">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura externa de YouTube (hqdefault existe siempre; maxres no) */}
              <img
                src={`https://i.ytimg.com/vi/${p.url.split('v=')[1]}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                // hqdefault es 4:3 con franjas negras dentro; 1,34× las deja fuera del marco 16:9.
                className="h-full w-full scale-[1.34] object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
              />
            </div>
            <div className="flex items-baseline justify-between px-6 pt-5">
              <span className="font-mono text-2xl font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-dim transition-colors group-hover:text-accent">
                Ver ↗
              </span>
            </div>
            <div className="px-6 pb-6 pt-4">
              <h3 className="text-base font-semibold leading-snug text-text" style={{ fontFamily: 'var(--font-display)' }}>
                {p.title}
              </h3>
              {p.feat && <p className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-dim">{p.feat}</p>}
            </div>
          </a>
        ))}
      </div>

      <p className="mt-8 font-mono text-sm uppercase tracking-[0.1em] text-accent">
        {f('closing', 'Lo que enseño en el curso son las decisiones que tomamos en rodajes como estos.')}
      </p>
    </Shell>
  )
}
