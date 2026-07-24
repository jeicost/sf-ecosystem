import { Logo } from './Logo'
import { site } from '@/lib/site'

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg-deep">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              El problema nunca fue tu cámara. Aprende a usar el equipo que ya tienes y haz vídeos
              que compitan con los de los grandes creadores.
            </p>
          </div>
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-dim">
            <p>Formación audiovisual</p>
            <p className="mt-1 text-muted">Filmmaker · Videoclips · Producción</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-dim sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <span>Habilidad &gt; Equipo</span>
        </div>
      </div>
    </footer>
  )
}
