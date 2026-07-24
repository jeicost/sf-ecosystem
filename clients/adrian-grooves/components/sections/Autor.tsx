import { cmsVal } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'
import { site } from '@/lib/site'

export function Autor({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  return (
    <Shell tc={`01 · ${f('eyebrow', 'Quién te va a enseñar')}`} surface>
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        {/* photo placeholder — framed like a still */}
        <div className="af-frame aspect-[4/5] overflow-hidden rounded-sm border border-line bg-bg-deep">
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(70%_50%_at_50%_35%,rgba(124,255,107,0.05),transparent)]">
            <div className="text-center">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">Foto en rodaje</p>
              <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-dim">placeholder</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="display text-4xl sm:text-6xl">
            {f('name_pre', 'Soy')} <span className="text-accent">{f('name', 'Adrian Grooves')}</span>
          </h2>
          <p className="mt-7 text-lg leading-relaxed text-muted">
            {f(
              'body1',
              'Llevo años trabajando como filmmaker en rodajes reales: videoclips y producción audiovisual para artistas de primera línea. He estado en el set resolviendo los mismos problemas que tú tienes ahora, pero con la presión de un cliente delante y sin margen para que salga mal.',
            )}
          </p>
          <p className="mt-5 text-base leading-relaxed text-muted">
            {f(
              'body2',
              'No vengo a enseñarte teoría de cine ni a llenarte de tecnicismos. Vengo a enseñarte el mismo criterio y las mismas decisiones que aplico en producciones profesionales, traducidos para que los uses con tu móvil o tu cámara básica. Como si estuviéramos juntos en un rodaje y te fuera explicando el porqué de cada cosa.',
            )}
          </p>
          <p className="mt-6 font-mono text-sm uppercase tracking-[0.12em] text-accent">
            {f('kicker', 'Sin postureo. Sin humo. Solo lo que funciona de verdad.')}
          </p>
          <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-dim">
            {site.artists.join(' · ')}
          </p>
        </div>
      </div>
    </Shell>
  )
}
