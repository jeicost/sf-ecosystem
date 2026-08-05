import Link from "next/link";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <section className="section" style={{ textAlign: "center" }}>
          <div className="container">
            <span className="eyebrow">Error 404</span>
            <h1 className="display-lg section__title">
              Esta guía <span style={{ color: "var(--primary)" }}>no existe.</span>
            </h1>
            <p className="section__lead" style={{ margin: "16px auto 0" }}>
              Puede que el enlace esté roto o la página se haya movido. Vuelve al inicio y sigue explorando.
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: 32 }}>
              Volver al inicio
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
