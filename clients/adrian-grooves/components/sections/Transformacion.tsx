import { cmsVal, cmsArr } from '@/lib/cms-pages'
import { Shell, Check } from '@/components/ui/Shell'

const DEFAULT_ITEMS = [
  'Dejarás de grabar en automático y sabrás qué hace cada ajuste de tu cámara o tu móvil.',
  'Entenderás la luz y sacarás imágenes limpias y cinematográficas aunque solo tengas una ventana.',
  'Moverás la cámara con intención — y sabrás cuándo NO moverla, que es lo que separa a los profesionales.',
  'Conseguirás un sonido que suene tan bien como se ve la imagen (el error nº1 que delata a un amateur).',
  'Planificarás antes de grabar, así grabarás menos y con muchísimo mejor resultado.',
  'Editarás rápido con un flujo que funciona igual en el móvil que en el ordenador.',
  'Te diferenciarás en redes con una imagen que te posiciona por encima de tu competencia.',
]

export function Transformacion({ data }: { data: Record<string, unknown> }) {
  const f = (k: string, fb: string) => cmsVal(data, k) ?? fb
  const items = cmsArr<string>(data, 'items') ?? DEFAULT_ITEMS
  return (
    <Shell tc={`02 · ${f('eyebrow', 'Lo que vas a conseguir')}`}>
      <h2 className="display max-w-3xl text-3xl sm:text-5xl">
        {f('headline_pre', 'De')} <span className="text-muted">&ldquo;se nota que es casero&rdquo;</span> {f('headline_mid', 'a')}{' '}
        <span className="text-accent">&ldquo;¿con qué lo has grabado?&rdquo;</span>
      </h2>
      <p className="mt-6 max-w-2xl text-lg text-muted">
        {f(
          'intro',
          'Cuando termines, no serás director de fotografía. Serás algo mucho más útil para ti: alguien que sabe hacer que sus vídeos se vean profesionales, con lo que ya tiene en la mano.',
        )}
      </p>
      <ul className="mt-10 grid gap-x-10 gap-y-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 border-b border-line pb-4 text-[0.98rem] leading-relaxed text-text">
            <Check />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Shell>
  )
}
