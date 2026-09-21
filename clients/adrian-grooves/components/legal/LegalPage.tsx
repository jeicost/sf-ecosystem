import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { site } from '@/lib/site'

/** Un dato del titular, o una marca visible si todavía no lo ha dado nadie. */
export function Dato({ v, que }: { v: string | null; que: string }) {
  if (v) return <>{v}</>
  return <mark className="rounded-sm bg-accent/15 px-1 text-accent">[pendiente: {que}]</mark>
}

export function LegalPage({ titulo, actualizado, children }: { titulo: string; actualizado: string; children: React.ReactNode }) {
  return (
    <>
      <Nav ctaUrl={`/${site.checkoutUrl}`} />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
        <h1 className="display text-3xl sm:text-5xl">{titulo}</h1>
        <p className="mt-3 font-mono text-[0.72rem] uppercase tracking-[0.12em] text-muted">Última actualización: {actualizado}</p>
        <div className="legal mt-10 space-y-5 text-[0.98rem] leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}
