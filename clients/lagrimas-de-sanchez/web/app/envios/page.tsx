import type { Metadata } from "next";
import { TARIFAS } from "@/lib/envio";
import { precioES } from "@/lib/catalogo";

export const metadata: Metadata = {
  alternates: { canonical: "/envios" },
  title: "Envíos y devoluciones",
  description: "A dónde enviamos, cuánto tarda y qué pasa si llega rota.",
};

const FAQ: [string, React.ReactNode][] = [
  [
    "¿Cuánto cuesta el envío?",
    TARIFAS.map((t) => `${t.nombre}: ${precioES(t.importe)} (${t.diasMin}-${t.diasMax} días laborables)`).join(" · ") +
      ". El vino, de momento, solo España peninsular.",
  ],
  ["¿Se despega el dibujo?", "No. Es tinta cerámica horneada a 600 grados. Forma parte del vidrio."],
  ["¿Puedo meterla en el lavavajillas?", "Sí. Las veces que quieras."],
  ["¿La botella de 22 € trae algo dentro?", "No. Viene vacía a propósito. La llenas tú."],
  ["¿Por qué no hay ninguna cara?", "Porque no hace falta."],
  ["¿Está numerada de verdad?", "Sí, a mano, una por una."],
  [
    "¿Enviáis fuera de España?",
    "La botella vacía, a veinticinco países. El vino, de momento solo a España peninsular: cada país tiene su alta fiscal y las vamos abriendo según se cierran.",
  ],
  ["¿Y si llega rota?", "Te mandamos otra. El vidrio viaja bien embalado, pero pasa. Escríbenos con una foto y lo resolvemos."],
  [
    "¿Puedo devolverla?",
    "Tienes catorce días naturales desde que la recibes para desistir, sin dar explicaciones. La botella tiene que volver sin usar y con su embalaje. Los portes de la devolución corren de tu cuenta.",
  ],
];

export default function Envios() {
  return (
    <main>
      <section className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-4xl flex-col gap-5 px-6 py-16 sm:py-24">
          <span className="u-eyebrow">Envíos y devoluciones</span>
          <h1 className="u-display text-[2.5rem] leading-[0.95] sm:text-[3.5rem]">
            Envíos, roturas y <span className="u-marca">arrepentimientos</span>
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <dl className="border-t border-line">
            {FAQ.map(([q, a]) => (
              <div key={q} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[1fr_1.4fr] sm:gap-10">
                <dt className="u-cond text-[1.1rem] leading-tight tracking-[0.03em]">{q}</dt>
                <dd className="text-[1rem] leading-relaxed tracking-normal text-muted">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
