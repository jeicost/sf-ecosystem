import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Gracias", robots: { index: false, follow: false } };

/**
 * Esta página NO confirma nada.
 *
 * Cualquiera puede escribir /gracias en la barra del navegador. El único sitio
 * que da un pago por bueno es el webhook de Stripe, que va firmado. Aquí solo
 * se agradece y se explica qué pasa ahora.
 */
export default function Gracias() {
  return (
    <main className="flex min-h-[70vh] items-center">
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-6 py-20 text-center">
        <span className="u-eyebrow mx-auto">Pedido recibido</span>
        <h1 className="u-display text-[2.75rem] leading-[0.95] sm:text-[3.5rem]">
          Gracias.
        </h1>
        <p className="mx-auto max-w-[44ch] text-[1.1rem] leading-relaxed tracking-normal text-muted">
          Te llega un correo con la confirmación en cuanto el pago quede registrado. Si no
          aparece en unos minutos, mira en spam antes de preocuparte y escríbenos si sigue sin
          estar.
        </p>
        <div className="mx-auto flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/estampado" className="u-cond border border-line px-6 py-3.5 text-[0.88rem] tracking-[0.12em] text-muted transition-colors hover:border-ink hover:text-ink">
            Ver las 57 piezas
          </Link>
          <Link href="/" className="u-cond bg-ink px-6 py-3.5 text-[0.88rem] tracking-[0.12em] text-base transition-colors hover:bg-yellow hover:text-ink">
            Volver a la portada
          </Link>
        </div>
      </div>
    </main>
  );
}
