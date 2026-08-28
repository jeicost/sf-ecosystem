import type { Metadata } from "next";
import Link from "next/link";
import { Botella } from "@/components/Botella";
import { BotonComprar } from "@/components/BotonComprar";
import { FichaProducto } from "@/components/FichaProducto";
import { PuertaEdad } from "@/components/PuertaEdad";
import { CATALOGO, precioES } from "@/lib/catalogo";

export const metadata: Metadata = {
  alternates: { canonical: "/vino" },
  title: "El vino",
  description:
    "Tinto de la DO Vinos de Madrid en la botella serigrafiada. El estuche completo o el pack de tres.",
  robots: { index: true, follow: true },
};

/**
 * El estuche de 39 € abre la página: es el producto al que la home manda con
 * "desde 39 €" y el que mejor explica el concepto. Recibir con el de 69 era
 * prometer una cosa y enseñar otra. El pack de tres queda como segunda opción.
 */
export default function PaginaVino() {
  return (
    <main>
      <PuertaEdad />

      <FichaProducto
        sku="estuche"
        eyebrow="Producto · contiene alcohol"
        titular={"El estuche completo"}
        foto="estuche abierto con las dos botellas, 4:5"
        entradilla={
          <>
            <p>
              Dos botellas idénticas: una llena de tinto de la DO Vinos de Madrid, subzona de
              Arganda, y otra vacía para que la rellenes. Te bebes una y te quedas la otra —
              el concepto entero en una caja.
            </p>
            <p className="mt-4 text-ink">El chiste va por fuera.</p>
          </>
        }
        ficha={[
          ["Contenido", "1 llena + 1 vacía"],
          ["Denominación", "DO Vinos de Madrid"],
          ["Subzona", "Arganda"],
          ["Bodega, uva y añada", "Con el primer lote"],
          ["Envío", "España peninsular"],
        ]}
        cierre={
          <div className="flex flex-col gap-3 border-2 border-ink p-5">
            <p className="u-cond text-[1.05rem] tracking-[0.04em]">Lo que aún no pone aquí</p>
            <p className="text-[0.95rem] leading-snug text-muted">
              Bodega, uva, añada y grado se publican cuando el primer lote esté embotellado.
              Preferimos una ficha corta a una ficha inventada.
            </p>
          </div>
        }
      />

      {/* ── El pack de tres ──────────────────────────────────────────────── */}
      <section className="border-b-2 border-ink bg-base-2">
        <div className="mx-auto grid max-w-[86rem] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <span className="u-eyebrow">También</span>
            <h2 className="u-display text-[2.1rem] leading-tight sm:text-[2.75rem]">
              Tres vinos
            </h2>
            <p className="max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">
              Tres botellas de tinto en su estuche, numeradas a mano. Es un tinto de verdad, no
              un souvenir con líquido dentro: si la botella no tuviera nada escrito, seguiría
              siendo un vino que te bebes.
            </p>
            <div className="flex flex-wrap items-end gap-6 pt-2">
              <div className="flex flex-col gap-1.5">
                <span className="u-display text-[2.2rem] leading-none">
                  {precioES(CATALOGO["pack-tres"].precio)}
                </span>
                <span className="u-mono text-[0.68rem] text-muted">
                  23 € por botella. La vacía sola vale 22.
                </span>
              </div>
              <div className="w-full max-w-[220px]">
                <BotonComprar sku="pack-tres">Comprar el pack</BotonComprar>
              </div>
            </div>
            <Link
              href="/botella"
              className="u-mono inline-block w-fit py-2 text-[0.72rem] underline decoration-2 underline-offset-4 transition-colors hover:text-muted"
            >
              O solo la botella vacía, 22 €
            </Link>
          </div>

          <div className="relative flex aspect-4/5 items-end justify-center gap-8 overflow-hidden border-2 border-ink bg-[#111110] p-8">
            <span
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(70% 46% at 50% 80%, rgba(192,139,62,0.28), transparent 72%)",
              }}
            />
            <p className="u-mono absolute left-4 top-4 text-[0.6rem] uppercase tracking-[0.16em] text-[#96907F]">
              Las fotos, con el primer lote
            </p>
            <Botella alto={330} />
            <Botella alto={330} capsula={false} />
          </div>
        </div>
      </section>
    </main>
  );
}
