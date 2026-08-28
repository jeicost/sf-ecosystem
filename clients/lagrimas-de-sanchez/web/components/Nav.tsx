import Link from "next/link";
import { Marca } from "@/components/Marca";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-base/92 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[86rem] items-center gap-6 px-5 py-3 sm:px-8">
        <Link href="/" aria-label="Lágrimas de Sánchez — inicio" className="py-0.5">
          <span className="sm:hidden"><Marca tam={15} origen={false} linea={false} /></span>
          <span className="hidden sm:block"><Marca tam={17} /></span>
        </Link>
        <div className="ml-auto flex items-center gap-4 sm:gap-7">
          <Link
            href="/estampado"
            className="u-cond hidden text-[0.85rem] transition-colors hover:text-muted min-[440px]:block"
          >
            El estampado
          </Link>
          <Link
            href="/vino"
            className="u-cond text-[0.85rem] transition-colors hover:text-muted"
          >
            El vino
          </Link>
          <Link
            href="/botella"
            className="u-cond whitespace-nowrap border-2 border-ink bg-yellow px-3.5 py-2 text-[0.8rem] transition-colors hover:bg-ink hover:text-base sm:px-5"
          >
            La botella · 22 €
          </Link>
        </div>
      </nav>
      {/* La banda de prelanzamiento. TEMPORAL: se quita el día que Stripe
          cobre — su único trabajo es que la lista de espera no pille por
          sorpresa a nadie después de decidirse a comprar. */}
      <Link
        href="/botella"
        className="block border-t-2 border-ink bg-yellow px-5 py-2 text-center transition-colors hover:bg-ink hover:text-yellow"
      >
        <span className="u-cond text-[0.72rem] tracking-[0.08em]">
          Primer lote en producción — apúntate y te guardamos el número
        </span>
      </Link>
    </header>
  );
}
