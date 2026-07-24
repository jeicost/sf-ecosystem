import { cmsVal } from '@/lib/cms-pages'

export function Garantia({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  return (
    <section className="bg-bg-deep">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8" data-reveal>
        <div className="flex flex-col items-center gap-6 rounded-sm border border-line bg-surface p-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-accent/50 font-mono text-lg font-semibold text-accent">
            14d
          </div>
          <div>
            <h3 className="font-mono text-sm uppercase tracking-[0.14em] text-accent">
              {f('title', 'Garantía de 14 días sin riesgo')}
            </h3>
            <p className="mt-2 text-[0.98rem] leading-relaxed text-muted">
              {f(
                'body',
                'Entra, mira el curso y aplica lo que enseño en tus vídeos. Si en 14 días sientes que no te ha aportado nada, me escribes y te devuelvo el 100 %. El riesgo lo asumo yo, no tú.',
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
