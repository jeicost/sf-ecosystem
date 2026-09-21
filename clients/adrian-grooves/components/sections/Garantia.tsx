import { cmsState, cmsVal } from '@/lib/cms-pages'

/**
 * La garantía NO está confirmada por el cliente (lleva publicada desde julio
 * con un «confirmar antes de publicar» en el README). Es la única cláusula de
 * la página que cuesta dinero en efectivo, así que se puede retirar desde el
 * CMS sin tocar código: `visible: false` en la sección `garantia` y desaparece,
 * y `days` cambia el plazo en el sello y en el título a la vez.
 *
 * Las otras dos menciones —la microcopy de la oferta y la pregunta del FAQ—
 * también son contenido del CMS. Ningún componente la menciona por su cuenta.
 */
export function Garantia({ data, abierta }: { data: Record<string, unknown>; abierta: boolean }) {
  if (data['visible'] === false) return null

  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const s = (k: string, fb: string) => cmsState(data, k, abierta) ?? fb
  const dias = typeof data['days'] === 'number' && data['days'] > 0 ? data['days'] : 14
  return (
    <section className="bg-bg-deep">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8" data-reveal>
        <div className="flex flex-col items-center gap-6 rounded-sm border border-line bg-surface p-8 text-center sm:flex-row sm:text-left">
          <div
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-accent/50 font-mono text-lg font-semibold text-accent"
          >
            {dias}d
          </div>
          <div>
            <h2 className="font-mono text-sm uppercase tracking-[0.14em] text-accent">
              {f('title', `Garantía de ${dias} días sin riesgo`)}
            </h2>
            <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">
              {s(
                'body',
                `Entra, mira los módulos que ya están dentro y aplica lo que enseño en tus vídeos. Si en ${dias} días sientes que no te ha aportado nada, me escribes y te devuelvo el 100 %.`,
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
