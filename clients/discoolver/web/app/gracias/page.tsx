import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Gracias — Discoolver",
  description: "Tu pedido está confirmado.",
  path: "/gracias",
  noindex: true,
});

export default function Gracias() {
  return (
    <>
      <Nav locale="es" />
      <main>
        <section className="section" style={{ minHeight: "55vh", display: "flex", alignItems: "center" }}>
          <div className="container" style={{ maxWidth: 720 }}>
            <span className="eyebrow">Pedido confirmado</span>
            <h1 className="display-lg" style={{ margin: "16px 0 20px" }}>
              Tu guía está <span style={{ color: "var(--primary)" }}>en camino.</span>
            </h1>
            <p className="section__lead" style={{ maxWidth: "58ch" }}>
              Te hemos enviado el recibo al correo. La edición digital te llega en ese mismo buzón
              en unos minutos; si has pedido papel, la imprimimos bajo demanda y sale en 5-8 días
              laborables con su número de seguimiento.
            </p>
            <p className="section__lead" style={{ maxWidth: "58ch" }}>
              ¿Algo raro? Escríbenos a{" "}
              <a href="mailto:hola@discoolver.com" style={{ color: "var(--primary-2)" }}>
                hola@discoolver.com
              </a>{" "}
              y lo resolvemos.
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: 12 }}>
              Volver a la tienda
            </Link>
          </div>
        </section>
      </main>
      <Footer locale="es" />
    </>
  );
}
