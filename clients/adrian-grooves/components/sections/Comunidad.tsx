import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell } from '@/components/ui/Shell'

type Card = { title: string; desc: string }

const DEFAULT_CARDS: Card[] = [
  { title: 'Comunidad privada', desc: 'Comparte tus vídeos, recibe feedback y rodéate de gente que está en tu mismo punto y quiere mejorar.' },
  { title: 'Nuevas clases y especialidades', desc: 'El curso no se queda quieto: sumo formación nueva (videoclips, contenido para redes, vídeo para marcas…) y la tienes incluida.' },
  { title: 'Actualizaciones de por vida', desc: 'Cuando cambia una herramienta o descubro algo que funciona mejor, lo actualizo. Tú siempre tienes la última versión.' },
  { title: 'Directos y resolución de dudas', desc: 'Momentos para preguntar en directo y resolver justo eso que se te atasca en tus propios vídeos.' },
]

export function Comunidad({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const cards = cmsArr<Card>(data, 'cards') ?? DEFAULT_CARDS
  return (
    <Shell tc={`04 · ${f('eyebrow', 'No te quedas solo')}`}>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">
        {f('headline', 'Acceso a la comunidad y a todas las actualizaciones')}
      </h2>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        {f('intro', 'Aprender viendo vídeos está bien. Aprender con alguien que te corrige y una comunidad que empuja contigo es otra cosa.')}
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
        {f('closing', 'El primer año de comunidad y actualizaciones va incluido en tu acceso.')}
      </p>
    </Shell>
  )
}
