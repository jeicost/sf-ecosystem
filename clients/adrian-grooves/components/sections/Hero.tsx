import { cmsState, cmsVal } from '@/lib/cms-pages'
import { site } from '@/lib/site'

export function Hero({ data, ctaUrl, abierta }: { data: Record<string, unknown>; ctaUrl: string; abierta: boolean }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  // Los textos que cambian al abrir la venta (ver `cmsState`).
  const s = (k: string, fb: string) => cmsState(data, k, abierta) ?? fb
  // La pieza que se enseña en el hueco del showreel mientras Adrian no tenga
  // uno propio: un videoclip real, publicado y verificable. Es la prueba más
  // fuerte de la página y hasta el 21-sep estaba en la sección 9 de 14.
  const reel = site.work[0]
  const artists = site.artists.join(' · ')

  return (
    <section id="top" className="relative overflow-hidden">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(124,255,107,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,var(--color-bg-deep),var(--color-bg)_60%)]" />

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* left — copy */}
          <div>
            <span className="timecode">REC · {f('eyebrow', 'Formación de Adrian Groves · Filmmaker')}</span>

            <h1 className="display-xl mt-6">
              {f('headline_pre', 'Haz vídeos que parecen')}{' '}
              <span className="text-accent">{f('headline_accent', 'profesionales')}</span>{' '}
              {f('headline_post', 'con el móvil o la cámara que ya tienes')}
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              {f(
                'subtitle',
                'La misma metodología que uso en rodajes para artistas como Natos y Waor, YSY A o C.R.O. — adaptada para que consigas resultados de otro nivel sin gastarte miles de euros en equipo.',
              )}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href={ctaUrl} data-cta="hero" className="btn-primary px-7 py-3.5 text-sm uppercase">
                {s('cta', 'Quiero grabar como un profesional')}
              </a>
            </div>

            <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-dim">
              {s('microcopy', 'Acceso de por vida · 99 €, pago único')}
            </p>

            <div className="mt-10 border-t border-line pt-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-dim">
                {f('trust_label', 'Detrás de cámara en videoclips para')}
              </p>
              <p className="mt-2 font-mono text-sm uppercase tracking-[0.14em] text-text">{artists}</p>
            </div>
          </div>

          {/*
            right — el hueco del showreel. Enseñaba «Showreel · placeholder» EN LA
            PÁGINA PUBLICADA. Ahora es un videoclip real de Adrian que abre en
            YouTube: la miniatura se sirve desde i.ytimg.com (estable, pensada
            para esto) y el HUD de cámara se queda encima como marca de la casa.
            Cuando haya showreel propio, se sustituye `reel` por él.
          */}
          <a
            href={reel.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver el videoclip ${reel.title} en YouTube`}
            className="af-frame group relative block aspect-[4/5] w-full overflow-hidden rounded-sm border border-line bg-bg-deep sm:aspect-[3/4]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura externa de YouTube; next/image pediría remotePatterns para una sola imagen */}
            <img
              src={`https://i.ytimg.com/vi/${reel.url.split('v=')[1]}/maxresdefault.jpg`}
              alt=""
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,11,0.55),rgba(11,11,11,0.15)_40%,rgba(11,11,11,0.85))]" />
            {/* letterbox bars */}
            <div className="absolute inset-x-0 top-0 h-[8%] bg-bg-deep" />
            <div className="absolute inset-x-0 bottom-0 h-[8%] bg-bg-deep" />
            {/* HUD ticks */}
            <div className="absolute left-3 top-[11%] flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">
              <span className="rec-dot" aria-hidden /> REC
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/60 bg-bg-deep/60 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <span className="ml-1 block h-0 w-0 border-y-[10px] border-l-[16px] border-y-transparent border-l-accent" />
              </div>
            </div>
            <div className="absolute bottom-[11%] left-4 right-4">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">Rodaje real · ver ↗</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-text" style={{ fontFamily: 'var(--font-display)' }}>
                {reel.title}
              </p>
            </div>
          </a>
        </div>
      </div>
      <div className="hairline mx-auto max-w-6xl" />
    </section>
  )
}
