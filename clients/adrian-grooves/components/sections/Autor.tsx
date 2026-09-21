import { cmsVal } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'
import { site } from '@/lib/site'

export function Autor({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const foto = cmsVal(data, 'photo_url')
  const fotograma = site.work[2]
  return (
    <Shell tc={`01 · ${f('eyebrow', 'Quién te va a enseñar')}`} surface>
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        {/*
          Hasta el 21-sep este hueco pintaba «Foto en rodaje · placeholder» en la
          página publicada. Mientras Adrian no mande una foto suya en rodaje, va
          un fotograma de un videoclip suyo con un pie que dice exactamente lo
          que es — su trabajo, no su cara. Cuando llegue la foto: `photo_url` y
          `photo_caption` en la sección `autor` del CMS, sin tocar código.
        */}
        <figure className="af-frame relative aspect-[4/5] overflow-hidden rounded-sm border border-line bg-bg-deep">
          {/* eslint-disable-next-line @next/next/no-img-element -- foto del CMS o miniatura externa de YouTube */}
          <img
            src={foto ?? `https://i.ytimg.com/vi/${fotograma.url.split('v=')[1]}/maxresdefault.jpg`}
            alt={foto ? f('photo_alt', `${site.name} en un rodaje`) : ''}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(11,11,11,0.9))]" />
          <figcaption className="absolute bottom-4 left-4 right-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted">
            {f('photo_caption', `Fotograma · ${fotograma.title}`)}
          </figcaption>
        </figure>

        <div>
          <h2 className="display text-4xl sm:text-6xl">
            {f('name_pre', 'Soy')} <span className="text-accent">{f('name', 'Adrian Groves')}</span>
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
