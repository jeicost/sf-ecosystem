import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell, Check, Cross } from '@/components/ui/Shell'

const SI = [
  'Creas contenido y quieres que se vea profesional.',
  'Eres músico o artista y quieres videoclips a otro nivel.',
  'Tienes una marca o negocio y quieres vender con mejor imagen.',
  'Ya tienes un móvil o una cámara y quieres exprimirlos al máximo.',
]
const NO = [
  'Buscas un curso de teoría de cine para aprobar un examen.',
  'Crees que el problema se arregla comprando más equipo.',
  'No estás dispuesto a coger la cámara y aplicar lo que aprendes.',
]

export function ParaQuien({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const si = cmsArr<string>(data, 'yes') ?? SI
  const no = cmsArr<string>(data, 'no') ?? NO
  return (
    <Shell tc={`06 · ${f('eyebrow', 'Para quién')}`}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="af-frame rounded-sm border border-accent/40 bg-surface-2 p-7">
          <h3 className="font-mono text-sm uppercase tracking-[0.14em] text-accent">
            {f('yes_title', 'Esto es para ti si…')}
          </h3>
          <ul className="mt-5 space-y-3">
            {si.map((s, i) => (
              <li key={i} className="flex gap-3 text-[0.98rem] leading-relaxed text-text"><Check />{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-line bg-bg-deep p-7">
          <h3 className="font-mono text-sm uppercase tracking-[0.14em] text-dim">
            {f('no_title', 'Esto NO es para ti si…')}
          </h3>
          <ul className="mt-5 space-y-3">
            {no.map((s, i) => (
              <li key={i} className="flex gap-3 text-[0.98rem] leading-relaxed text-muted"><Cross />{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </Shell>
  )
}
