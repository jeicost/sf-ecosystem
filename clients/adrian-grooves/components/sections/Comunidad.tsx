import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

type Card = { title: string; desc: string }

/**
 * QUÉ SIGUE INCLUIDO DESPUÉS DE COMPRAR — y por qué ya no habla de comunidad.
 *
 * Esta sección prometía «comunidad privada», «directos y resolución de dudas» y
 * «el primer año de comunidad incluido». El Brand Brain dice justo lo contrario
 * en `offer.deliberately_excluded`: «No se ofrece de entrada Discord, mentorías
 * semanales ni soporte continuo — la prioridad es que el producto escale».
 *
 * O sea, la página estaba vendiendo lo único que la oferta había decidido NO
 * dar, y encima es lo que más ataría a Adrian justo en las semanas en las que
 * tiene que estar rodando los módulos que faltan. Las cuatro tarjetas de ahora
 * son las de `offer.includes`, que sí están comprometidas.
 */
const DEFAULT_CARDS: Card[] = [
  { title: 'Actualizaciones de por vida', desc: 'Cuando cambia una herramienta o descubro algo que funciona mejor, lo actualizo. Tú siempre tienes la última versión, sin pagar de nuevo.' },
  { title: 'Biblioteca que crece', desc: 'El curso no se queda quieto: sumo clases nuevas y especialidades, y las tienes incluidas en el acceso que compras hoy.' },
  { title: 'Recursos descargables', desc: 'Mis LUTs y presets, la checklist de antes de cada rodaje y los sitios de donde saco música, efectos y tipografías.' },
  { title: 'Descuentos en lo que venga', desc: 'Si más adelante saco packs especializados, los tienes a precio de alumno. Entrar ahora te deja dentro para siempre.' },
]

export function Comunidad({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const cards = cmsArr<Card>(data, 'cards') ?? DEFAULT_CARDS
  return (
    <Shell tc={`05 · ${f('eyebrow', 'No se acaba al comprar')}`}>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">
        {f('headline', 'Lo compras una vez y sigue creciendo')}
      </h2>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        {f('intro', 'No es un curso que grabo, subo y abandono. Es el sitio donde voy dejando lo que aprendo en cada rodaje nuevo.')}
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {cards.map((c, i) => (
          <div key={i} className="rounded-sm border border-line bg-surface-2 p-6 transition-colors hover:border-line-bright">
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent">0{i + 1}</span>
            <h3 className="mt-3 text-lg font-semibold text-text" style={{ fontFamily: 'var(--font-display)' }}>{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 font-mono text-sm uppercase tracking-[0.1em] text-accent">
        {f('closing', 'Pago único. Acceso de por vida. Sin suscripciones.')}
      </p>
    </Shell>
  )
}
