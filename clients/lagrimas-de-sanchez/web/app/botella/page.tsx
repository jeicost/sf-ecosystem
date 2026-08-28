import type { Metadata } from "next";
import Link from "next/link";
import { FichaProducto } from "@/components/FichaProducto";
import { CATALOGO } from "@/lib/catalogo";
import { site } from "@/lib/site";

/** Datos estructurados: la ficha que Google enseña en resultados enriquecidos. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "La botella — Lágrimas de Sánchez",
  description: CATALOGO.botella.descripcion,
  brand: { "@type": "Brand", name: "Lágrimas de Sánchez" },
  url: `${site.url}/botella`,
  offers: {
    "@type": "Offer",
    price: (CATALOGO.botella.precio / 100).toFixed(2),
    priceCurrency: "EUR",
    availability: "https://schema.org/PreOrder",
    url: `${site.url}/botella`,
  },
};

export const metadata: Metadata = {
  alternates: { canonical: "/botella" },
  title: "La botella",
  description:
    "Botella de 750 ml en vidrio ámbar con 57 piezas horneadas en el cristal a 600 grados. Vacía, rellenable y apta para lavavajillas.",
};

export default function PaginaBotella() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FichaProducto
        sku="botella"
        capsula={false}
        eyebrow="Producto"
        titular={"La botella\nvacía"}
        foto="botella vacía sobre mesa, luz lateral, vertical 3:4"
        entradilla={
          <>
            <p>
              Viene vacía a propósito. La llenas de agua en la mesa, de vino a granel o de lo
              que te salga, y la lavas las veces que hagan falta: la serigrafía es cerámica
              vitrificada y forma parte del vidrio.
            </p>
            <p className="mt-4 text-ink">El contenido lo pones tú. Los motivos ya vienen puestos.</p>
          </>
        }
        ficha={[
          ["Capacidad", "750 ml"],
          ["Vidrio", "Ámbar, 500 g"],
          ["Cierre", "Corcho con cabeza metálica"],
          ["Decoración", "Serigrafía cerámica, 600 °C"],
          ["Piezas", "57"],
          ["Lavavajillas", "Sí"],
          ["Numeración", "A mano"],
          ["Tirada", "1.000"],
          ["Envío", "25 países"],
        ]}
        cierre={
          <div className="flex flex-col gap-3 border-2 border-ink p-5">
            <p className="u-cond text-[1.05rem] tracking-[0.04em]">Se compra por lo que pone. Se queda por lo que es.</p>
            <p className="text-[0.95rem] leading-snug tracking-normal text-muted">
              Es el producto que más margen deja y el que menos explicación necesita: se compra
              por lo que pone y se queda en la estantería después.
            </p>
            <Link href="/estampado" className="u-mono w-fit text-[0.72rem] text-ink underline underline-offset-4 hover:text-ink">
              Ver las 57 piezas
            </Link>
          </div>
        }
      />
    </main>
  );
}
