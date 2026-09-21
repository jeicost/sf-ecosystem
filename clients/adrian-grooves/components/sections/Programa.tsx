import { cmsState, cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

/**
 * `status` es opcional y lo pone el CMS: mientras el curso se graba, cada
 * módulo dice si ya está dentro o en qué semana llega. Sin `status` la ficha se
 * renderiza igual que antes, así que en diciembre —curso completo— basta con
 * quitarlo del CMS y desaparecen las etiquetas solas.
 */
type Modulo = { n: string; title: string; desc: string; status?: string; status_prelanzamiento?: string }

/** Un módulo cuenta como disponible si su estado lo dice literalmente. */
function estaDisponible(status?: string) {
  return typeof status === 'string' && /disponible/i.test(status)
}

/**
 * Lo que oye un lector de pantalla. «Sem. 20 oct» se lee como una palabra
 * rara; se expande a una frase completa y solo en el atributo, la etiqueta
 * visible sigue siendo corta para que quepa.
 */
function estadoLeido(status: string) {
  if (estaDisponible(status)) return 'Disponible'
  const cuando = /^sem\./i.test(status) ? status.replace(/^sem\.\s*/i, 'la semana del ') : `el ${status}`
  return `Se publica ${cuando.replace(/\boct\b/i, 'de octubre').replace(/\bnov\b/i, 'de noviembre').replace(/\bdic\b/i, 'de diciembre')}`
}

const DEFAULT_MODULES: Modulo[] = [
  { n: '00', title: 'El secreto de un vídeo profesional', desc: 'Cambiamos el chip: por qué el aspecto profesional depende del criterio, no del presupuesto. Aquí empieza todo.' },
  { n: '01', title: 'Configura cualquier cámara o móvil como un profesional', desc: 'Deja lista cualquier cámara en minutos y entiende de verdad qué hace cada ajuste.' },
  { n: '02', title: 'Aprende a mirar como un filmmaker', desc: 'Desarrolla el criterio visual que hace que un plano funcione… o no.' },
  { n: '03', title: 'Movimiento de cámara con intención', desc: 'Deja de mover la cámara porque sí. Cada movimiento va a contar algo.' },
  { n: '04', title: 'Iluminación: lo que más cambia un vídeo', desc: 'Aprovecha cualquier fuente de luz para conseguir imágenes limpias y cinematográficas con muy poco.' },
  { n: '05', title: 'El sonido: la diferencia real entre amateur y profesional', desc: 'Por qué el sonido importa tanto como la imagen, y cómo conseguir que tus vídeos suenen bien.' },
  { n: '06', title: 'Piensa el vídeo antes de pulsar REC', desc: 'Planifica como un profesional: graba menos y consigue mucho más.' },
  { n: '07', title: 'Edición rápida y profesional', desc: 'Un flujo de trabajo sencillo que funciona en móvil y en ordenador, sin complicarte.' },
  { n: '08', title: 'Casos reales: así se hicieron estos vídeos', desc: 'El módulo más diferencial. Analizo proyectos reales y te cuento las decisiones que tomé durante el rodaje.' },
]

export function Programa({ data, abierta }: { data: Record<string, unknown>; abierta: boolean }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const s = (k: string, fb: string) => cmsState(data, k, abierta) ?? fb
  // Antes de abrir, los tres primeros NO están «disponibles» todavía: cada
  // módulo puede traer su propio `status_prelanzamiento` (p. ej. «15 oct»).
  const estado = (m: Modulo) => (abierta ? m.status : (m.status_prelanzamiento ?? m.status))
  const modules = cmsArr<Modulo>(data, 'modules') ?? DEFAULT_MODULES
  return (
    <Shell id="programa" tc={`03 · ${f('eyebrow', 'El programa')}`} surface>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">
        {f('headline', 'De cero a vídeos que parecen profesionales')}
      </h2>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        {s('intro', 'Nueve módulos que siguen exactamente el orden en el que yo pienso un rodaje. Nada de relleno: cada lección resuelve un problema real.')}
      </p>

      {/* timeline strip */}
      <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div key={m.n} className="group relative bg-bg p-6 transition-colors hover:bg-bg-deep">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-2xl font-semibold text-accent">{m.n}</span>
              {estado(m) ? (
                // 0.66rem y texto `muted` en las pendientes: con 0.58rem y `dim`
                // la etiqueta medía 9 px y no llegaba a 4:1 de contraste.
                <span
                  aria-label={estadoLeido(estado(m) as string)}
                  className={`shrink-0 rounded-sm border px-2 py-0.5 font-mono text-[0.66rem] uppercase tracking-[0.1em] ${
                    estaDisponible(estado(m)) ? 'border-accent/60 text-accent' : 'border-line-bright text-muted'
                  }`}
                >
                  {estado(m)}
                </span>
              ) : (
                <span className="h-px w-8 bg-line-bright transition-colors group-hover:bg-accent" />
              )}
            </div>
            <h3 className="mt-4 text-base font-semibold leading-snug text-text" style={{ fontFamily: 'var(--font-display)' }}>
              {m.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{m.desc}</p>
          </div>
        ))}
      </div>
    </Shell>
  )
}
