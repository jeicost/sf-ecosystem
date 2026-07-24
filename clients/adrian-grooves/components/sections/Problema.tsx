import { cmsVal } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

export function Problema({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  return (
    <Shell tc={`00 · ${f('eyebrow', 'Si esto te suena, sigue leyendo')}`}>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">
        {f('headline', 'Grabas, le das al play… y algo no encaja')}
      </h2>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <p className="text-lg leading-relaxed text-muted">
          {f(
            'body',
            'La luz, el encuadre, el color, ese aire "casero" que no sabes de dónde sale. Tu contenido no está mal, pero al lado de los creadores que admiras se nota que juegas en otra liga. Y lo peor: no sabes exactamente qué estás haciendo mal.',
          )}
        </p>
        <div className="af-frame rounded-sm border border-line bg-surface-2 p-6">
          <p className="text-base leading-relaxed text-text">
            {f(
              'highlight',
              'Así que llegas a la conclusión de siempre: "necesito una cámara mejor". Ahorras, te gastas el dinero… y a las dos semanas tus vídeos siguen pareciendo los de antes. Solo que ahora con una cámara más cara.',
            )}
          </p>
        </div>
      </div>
      <p className="mt-8 max-w-2xl text-base text-dim">
        {f('closing', 'Si te ha pasado, no es culpa tuya. Es que nadie te ha explicado la verdad: el equipo casi nunca es el problema.')}
      </p>
    </Shell>
  )
}
