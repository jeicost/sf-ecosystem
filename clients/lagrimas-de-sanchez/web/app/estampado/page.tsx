import type { Metadata } from "next";
import Link from "next/link";
import { Glifo, GLIFO_POR_PIEZA } from "@/components/Glifos";
import { PIEZAS, BLOQUES, CON_PICTOGRAMA, type Bloque } from "@/lib/piezas";
import { Recorrido } from "@/components/Recorrido";
import { rutaIcono } from "@/lib/iconos";

export const metadata: Metadata = {
  alternates: { canonical: "/estampado" },
  title: "El estampado",
  description:
    "Las 57 piezas horneadas en el vidrio: apodos, frases y aforismos de la última década española. Ni una sola cara.",
};

/**
 * El catálogo enseña cada pieza COMO IRÁ HORNEADA — condensada en mayúsculas,
 * a la escala de su banda, con su pictograma cuando lo tiene — y no como una
 * lista administrativa. Es la página donde el producto se demuestra: si aquí
 * las piezas no tienen gracia, no la tendrán en el vidrio.
 */

const ORDEN: Bloque[] = ["A", "B", "D", "C"];

/** Las anclas de la composición: en el vidrio cruzan la botella, aquí cruzan la retícula. */
const ANCLAS = new Set([22, 23, 24, 31, 42]);

export default function Estampado() {
  return (
    <main>
      {/* ── Cabecera ──────────────────────────────────────────────────── */}
      <section className="u-grain relative border-b-2 border-ink">
        <div className="mx-auto flex max-w-[86rem] flex-col gap-6 px-5 py-16 sm:px-8 sm:py-24">
          <span className="u-eyebrow">El estampado</span>
          <h1 className="u-display max-w-[16ch] text-[2.75rem] sm:text-[4rem]">
            {PIEZAS.length} piezas.
            <br />
            <span className="u-marca">Ni una sola cara.</span>
          </h1>
          <p className="u-lead max-w-[54ch]">
            Doce bandas alrededor de la botella, justificadas de lado a lado, con un solo hueco
            de calma en el centro para el nombre. Todo lo dice el texto. El dibujo lo
            pones tú, que también has visto la década.
          </p>

          <dl className="mt-4 flex flex-wrap gap-x-12 gap-y-5 border-t-2 border-ink pt-8">
            {[
              [String(PIEZAS.length), "piezas"],
              [String(CON_PICTOGRAMA), "con pictograma"],
              ["12", "bandas"],
              ["1", "tinta"],
              ["600 °C", "de horno"],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col gap-1">
                <dt className="u-display text-[1.9rem] leading-none">{n}</dt>
                <dd className="u-eyebrow">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Recorrido />

      {/* ── Los bloques ───────────────────────────────────────────────── */}
      {ORDEN.map((b) => {
        const piezas = PIEZAS.filter((p) => p.bloque === b);
        const amarillo = b === "D";
        return (
          <section key={b} className="border-b-2 border-ink">
            <div className="mx-auto flex max-w-[86rem] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-18">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className="u-display text-[2rem] leading-none">{b}</span>
                <h2 className="u-cond text-[1.5rem] tracking-[0.06em]">{BLOQUES[b].nombre}</h2>
                <p className="u-eyebrow ml-auto">{piezas.length} piezas</p>
                <p className="w-full max-w-[64ch] text-[0.98rem] leading-snug text-muted">
                  {BLOQUES[b].nota}
                </p>
              </div>

              <ul className="grid grid-cols-2 border-l-2 border-t-2 border-ink sm:grid-cols-3 lg:grid-cols-4">
                {piezas.map((p) => {
                  const g = GLIFO_POR_PIEZA[p.n];
                  const ancla = ANCLAS.has(p.n);
                  const arte = rutaIcono(p.n);

                  /* Con arte real generado, la pieza se enseña COMO IRÁ EN EL
                     VIDRIO: azulejo de ámbar con el lockup encima. El texto ya
                     vive dentro del arte, así que la celda no lo repite. */
                  if (arte) {
                    return (
                      <li
                        key={p.n}
                        className="flex flex-col border-b-2 border-r-2 border-ink"
                      >
                        <div
                          className="relative aspect-square shrink-0 overflow-hidden"
                          style={{
                            background:
                              "linear-gradient(115deg,#3F2308 0%,#7A4A18 22%,#A0702E 52%,#7A4A18 80%,#3F2308 100%)",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={arte}
                            alt={`${p.texto} — pieza del estampado`}
                            className="absolute inset-0 h-full w-full object-contain p-[11%]"
                          />
                          <span className="u-mono absolute left-3 top-2.5 text-[0.6rem] text-[#F6F1E6]/60">
                            {String(p.n).padStart(2, "0")}
                          </span>
                        </div>
                        {p.historia && (
                          <span className="mt-auto border-t-2 border-ink px-4 py-3 font-[family-name:var(--font-display)] text-[0.88rem] italic leading-snug text-muted">
                            {p.historia}
                          </span>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li
                      key={p.n}
                      className={`flex min-h-[7.5rem] flex-col justify-between gap-4 border-b-2 border-r-2 border-ink p-4 transition-colors sm:p-5 ${
                        amarillo
                          ? "bg-yellow"
                          : ancla
                            ? "col-span-2 min-h-[9rem] hover:bg-base-2"
                            : "hover:bg-base-2"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={`u-mono text-[0.6rem] ${amarillo ? "text-ink/70" : "text-muted"}`}>
                          {String(p.n).padStart(2, "0")}
                        </span>
                        {g && <Glifo n={g} tam={24} grosor={2} />}
                      </div>
                      <span
                        className={`u-cond ${
                          ancla
                            ? "text-[1.55rem] sm:text-[1.95rem]"
                            : amarillo
                              ? "text-[1.02rem] sm:text-[1.15rem]"
                              : "text-[1.15rem] sm:text-[1.35rem]"
                        }`}
                      >
                        {p.texto}
                      </span>
                      {p.historia ? (
                        <span className="font-[family-name:var(--font-display)] text-[0.88rem] italic leading-snug text-muted">
                          {p.historia}
                        </span>
                      ) : p.objeto && !g ? (
                        <span className="u-eyebrow text-[0.56rem]!">{p.objeto}</span>
                      ) : (
                        <span aria-hidden="true" className="min-h-[0.9rem]" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}

      {/* ── El porqué ─────────────────────────────────────────────────── */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-[86rem] flex-col gap-6 px-5 py-14 sm:px-8 sm:py-20">
          <h2 className="u-display max-w-[24ch] text-[1.9rem] sm:text-[2.5rem]">
            ¿Por qué no hay ninguna cara?
          </h2>
          <p className="max-w-[58ch] text-[1.05rem] leading-relaxed text-muted">
            Porque no hace falta. Un apodo y un objeto los completa quien los lee, y eso es más
            gracioso que dibujarlo todo. Además hace la marca registrable y la botella vendible
            en cualquier tienda, que es exactamente lo que una caricatura impediría.
          </p>
          <Link
            href="/botella"
            className="u-cond mt-2 w-fit border-2 border-ink bg-ink px-7 py-4 text-[0.9rem] tracking-[0.1em] text-base transition-colors hover:bg-yellow hover:text-ink"
          >
            Ver la botella · 22 €
          </Link>
        </div>
      </section>
    </main>
  );
}
