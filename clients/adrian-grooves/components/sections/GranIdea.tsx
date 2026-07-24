import { cmsVal } from '@/lib/cms-pages'

export function GranIdea({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  return (
    <section className="relative bg-bg-deep">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(124,255,107,0.06),transparent_70%)]" />
      <div className="relative mx-auto max-w-4xl px-5 py-28 text-center sm:px-8 sm:py-40" data-reveal>
        <span className="timecode justify-center">{f('eyebrow', 'La idea que lo cambia todo')}</span>
        <p className="display mx-auto mt-8 max-w-3xl text-3xl sm:text-5xl">
          {f('quote_pre', 'La diferencia entre un vídeo amateur y uno profesional no la marca el precio del equipo.')}{' '}
          <span className="text-accent">{f('quote_accent', 'La marca saber usarlo.')}</span>
        </p>
        <p className="mx-auto mt-10 max-w-2xl text-base leading-relaxed text-muted">
          {f(
            'support',
            'He rodado videoclips que compiten con producciones de sello grande resolviendo con lo que había en el set. La cámara ayuda, claro. Pero lo que de verdad cambia un vídeo son las decisiones: dónde pones la luz, cómo encuadras, cuándo mueves y cuándo no, cómo suena. Y eso se aprende.',
          )}
        </p>
      </div>
    </section>
  )
}
