import { cmsVal } from '@/lib/cms-pages'
import { site } from '@/lib/site'

export function Hero({ data, ctaUrl }: { data: Record<string, unknown>; ctaUrl: string }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
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
            <span className="timecode">REC · {f('eyebrow', 'Formación de Adrian Grooves · Filmmaker')}</span>

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
              <a href={ctaUrl} className="btn-primary px-7 py-3.5 text-sm uppercase">
                {f('cta', 'Quiero grabar como un profesional')}
              </a>
            </div>

            <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-dim">
              {f('microcopy', 'Acceso de por vida · Garantía de 14 días · Empieza a aplicarlo hoy mismo')}
            </p>

            <div className="mt-10 border-t border-line pt-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-dim">
                {f('trust_label', 'Detrás de cámara en videoclips para')}
              </p>
              <p className="mt-2 font-mono text-sm uppercase tracking-[0.14em] text-text">{artists}</p>
            </div>
          </div>

          {/* right — framed media placeholder (showreel slot) */}
          <div className="af-frame aspect-[4/5] w-full overflow-hidden rounded-sm border border-line bg-bg-deep sm:aspect-[3/4]">
            <div className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(80%_60%_at_50%_30%,rgba(124,255,107,0.06),transparent)]">
              {/* letterbox bars */}
              <div className="absolute inset-x-0 top-0 h-[8%] bg-bg-deep" />
              <div className="absolute inset-x-0 bottom-0 h-[8%] bg-bg-deep" />
              {/* HUD ticks */}
              <div className="absolute left-3 top-[11%] flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent">
                <span className="rec-dot" aria-hidden /> REC 00:00:00
              </div>
              <div className="absolute right-3 top-[11%] font-mono text-[0.6rem] uppercase tracking-[0.18em] text-dim">
                4K · 24fps
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-accent/50">
                  <span className="ml-1 block h-0 w-0 border-y-[9px] border-l-[14px] border-y-transparent border-l-accent" />
                </div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-dim">Showreel · placeholder</p>
              </div>
              <div className="absolute bottom-[11%] left-3 right-3 flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.16em] text-dim">
                <span>ISO 640</span>
                <span>f/1.8</span>
                <span>1/50</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hairline mx-auto max-w-6xl" />
    </section>
  )
}
