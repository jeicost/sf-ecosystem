import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { DemoForm } from "@/components/b360/DemoForm";
import { Section } from "@/components/b360/Bits";

export const metadata: Metadata = buildMetadata({
  title: "Pedir una demo | discoolver 360",
  description:
    "Media hora con la plataforma funcionando y el despliegue de Ronda abierto. Salimos con una propuesta de por qué módulo empezar y qué cuesta.",
  path: "/360/demo",
});

export default function Demo360() {
  return (
    <Section>
      <div className="split" style={{ paddingTop: 40 }}>
        <div>
          <span className="label">Demo</span>
          <h1 className="h-hero" style={{ fontSize: "clamp(32px,4.6vw,58px)" }}>
            Media hora, tu destino sobre la mesa
          </h1>
          <p className="lead">
            Sin compromiso y sin presentación de cuarenta diapositivas. Enseñamos la plataforma
            funcionando y el despliegue de Ronda abierto, no capturas de pantalla.
          </p>
          <ul className="ticks" style={{ marginTop: 26 }}>
            <li>
              <strong>Qué ves:</strong> marketplace, punto de venta y cuadro de mando en vivo, con
              datos reales de un destino desplegado.
            </li>
            <li>
              <strong>Qué te llevas:</strong> por qué módulo empezar en tu caso, qué cuesta y en qué
              plazo puede estar operativo.
            </li>
            <li>
              <strong>Quién la hace:</strong> alguien del equipo que conoce el producto, no un
              comercial de guion.
            </li>
            <li>
              <strong>Cuánto dura:</strong> 30 minutos. Si hace falta una segunda, se cuadra.
            </li>
          </ul>
          <div
            style={{
              marginTop: 30,
              paddingTop: 24,
              borderTop: "1px solid var(--b-line-soft)",
              display: "grid",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "var(--b-mono)", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--b-slate)" }}>
              También puedes escribir
            </span>
            <a href="mailto:info@discoolver.com" style={{ fontFamily: "var(--b-mono)", fontSize: 13.5, color: "var(--b-primary)" }}>
              info@discoolver.com
            </a>
            <span style={{ fontFamily: "var(--b-mono)", fontSize: 13, color: "var(--b-slate)" }}>
              C/ María de Molina 39, 28006 Madrid
            </span>
          </div>
        </div>

        <div className="card" style={{ borderColor: "var(--b-line)", padding: 30 }}>
          <DemoForm />
        </div>
      </div>
    </Section>
  );
}
