import { cmsState, cmsVal } from '@/lib/cms-pages'
import { site } from '@/lib/site'

export function CtaFinal({ data, ctaUrl, abierta }: { data: Record<string, unknown>; ctaUrl: string; abierta: boolean }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const s = (k: string, fb: string) => cmsState(data, k, abierta) ?? fb
  const price = f('price', site.price)
  return (
    <section className="relative overflow-hidden bg-bg-deep">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_120%,rgba(124,255,107,0.1),transparent_60%)]" />
      <div className="relative mx-auto max-w-3xl px-5 py-28 text-center sm:px-8 sm:py-40" data-reveal>
        <span className="timecode justify-center">{f('eyebrow', 'El problema nunca fue tu cámara')}</span>
        <h2 className="display-xl mt-6">
          {f('headline_pre', 'Deja de grabar vídeos que parecen')} <span className="text-accent">{f('headline_accent', 'amateur')}</span>
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted">
          {s('support', 'Ya tienes el equipo. Solo te falta saber usarlo. Y eso se aprende.')}
        </p>
        <a href={ctaUrl} data-cta="cta-final" className="btn-primary mt-9 inline-flex px-8 py-4 text-sm uppercase">
          {s('cta', 'Quiero mis vídeos a otro nivel')} — {price} €
        </a>
        <p className="mt-4 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-dim">
          {s('microcopy', 'Acceso de por vida · 99 €, pago único')}
        </p>
        <p className="mx-auto mt-12 max-w-2xl border-t border-line pt-8 text-sm italic leading-relaxed text-dim">
          {f(
            'ps',
            'P.D.: La mayoría de gente seguirá creyendo que necesita una cámara mejor y seguirá grabando vídeos que parecen caseros. Tú puedes seguir en ese grupo… o aprender de una vez lo que de verdad marca la diferencia.',
          )}
        </p>
      </div>
    </section>
  )
}
