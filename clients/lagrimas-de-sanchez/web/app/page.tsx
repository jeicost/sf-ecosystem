import Link from "next/link";
import { Botella } from "@/components/Botella";
import { BotonComprar } from "@/components/BotonComprar";
import { Cinta } from "@/components/Cinta";
import { FotoProducto } from "@/components/FotoProducto";
import { CATALOGO, precioES, type Sku } from "@/lib/catalogo";

/**
 * La home vende la BOTELLA VACÍA, no el vino.
 *
 * No es una preferencia de diseño. Una portada que vende alcohol necesita
 * verificación de edad y queda fuera de la publicidad de Meta y de Google. Con
 * la botella vacía delante, la home es anunciable y el vino vive en /vino con
 * su puerta de edad. La diferencia se mide en coste de adquisición.
 */

const FICHA: [string, string][] = [
  ["Capacidad", "750 ml"],
  ["Vidrio", "Ámbar, 500 g"],
  ["Decoración", "Serigrafía cerámica a 600 °C"],
  ["Tinta", "Una, blanca"],
  ["Piezas", "57"],
  ["Lavavajillas", "Sí"],
  ["Etiqueta frontal", "Ninguna"],
  ["Numeración", "A mano"],
];

const CIFRAS: [string, string][] = [
  ["57", "frases en el vidrio"],
  ["600°", "de horno"],
  ["0", "etiquetas"],
  ["2", "vidas por botella"],
];

const ORDEN: Sku[] = ["botella", "estuche", "pack-tres"];

export default function Home() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────────────
          A sangre. El panel negro llega al borde derecho de la ventana, no al
          del contenedor: con max-width se quedaba una franja blanca que parecía
          un error de maquetación.

          La botella CRUZA la frontera entre el panel y el blanco. Ese solape es
          lo que compone el hero en vez de dejar dos columnas mirándose. */}
      <section className="u-grain relative overflow-hidden border-b-2 border-ink">
        {/* El panel, a sangre por la derecha. */}
        <div
          className="absolute inset-y-0 right-0 hidden lg:block lg:left-[53%]"
          style={{ background: "#111110" }}
        >
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(52% 46% at 42% 74%, rgba(192,139,62,0.30), transparent 72%)",
            }}
          />
        </div>

        {/* La botella vive DENTRO del panel, centrada en él y sangrando solo
            por abajo. Cruzarla sobre el texto pisaba el titular y el filete de
            la ficha le pasaba por encima: eso no es tensión, es colisión. */}
        <div className="pointer-events-none absolute bottom-[-3.5rem] hidden lg:block lg:left-[77%] lg:-translate-x-1/2">
          <Botella alto={820} />
        </div>

        <div className="relative mx-auto max-w-[86rem] px-5 sm:px-8">
          <div className="flex flex-col justify-center gap-9 py-16 sm:py-24 lg:min-h-[44rem] lg:w-[47%] lg:py-32">
            <div className="u-sube flex flex-col gap-8">
              <span className="u-eyebrow">Aranjuez, Madrid · Edición numerada</span>

              {/* "Cincuenta y siete" va en nowrap y el cuerpo dimensionado para
                  que las tres líneas quepan en la columna: con los tamaños
                  anteriores "ocho" caía huérfano a su propia línea en TODOS
                  los anchos de escritorio. */}
              <h1 className="u-display text-[2.9rem] sm:text-[4rem] lg:text-[4.15rem] xl:text-[4.6rem]">
                <span className="whitespace-nowrap">Cincuenta y siete</span>
                <br />
                motivos para
                <br />
                <span className="u-marca">llorar.</span>
              </h1>

              <p className="u-lead max-w-[34ch]">
                <span className="text-ink">Horneados en el vidrio a 600 grados.</span> No es una
                etiqueta. No se despega. No se va nunca.
              </p>

              <div className="flex flex-wrap items-center gap-5">
                {/* "Ver la botella" NAVEGA a la ficha: un botón que dice ver
                    y pide el correo rompe la promesa en el primer clic. */}
                <Link
                  href="/botella"
                  className="u-cond inline-flex w-full max-w-[17rem] items-center justify-center border-2 border-ink bg-ink px-6 py-4 text-[0.95rem] tracking-[0.1em] text-base transition-colors hover:bg-yellow hover:text-ink"
                >
                  Ver la botella · {precioES(CATALOGO.botella.precio)}
                </Link>
                <Link
                  href="/estampado"
                  className="u-mono -my-3 inline-block py-3 text-[0.78rem] underline decoration-2 underline-offset-[6px] transition-colors hover:text-muted"
                >
                  Ver las 57 piezas
                </Link>
              </div>
            </div>

            {/* Los datos del producto en el propio hero: es lo que separa una
                página de producto de un cartel bonito. */}
            <dl className="flex flex-wrap gap-x-10 gap-y-3 border-t-2 border-ink pt-5">
              {[
                ["750 ml", "vidrio ámbar"],
                ["57", "piezas horneadas"],
                ["1.000", "primera tirada"],
              ].map(([v, k]) => (
                <div key={k} className="flex flex-col">
                  <dt className="u-cond text-[1.05rem]">{v}</dt>
                  <dd className="u-eyebrow text-[0.6rem]! text-muted">
                    {k}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Móvil y tablet: la botella debajo, sobre su propio bloque negro. */}
        <div className="relative flex justify-center overflow-hidden border-t-2 border-ink bg-[#111110] lg:hidden">
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(58% 48% at 50% 78%, rgba(192,139,62,0.30), transparent 72%)",
            }}
          />
          <div className="flex h-[420px] items-end overflow-hidden sm:h-[560px]">
            <div className="origin-bottom scale-[0.66] sm:scale-[0.88]">
              <Botella alto={640} />
            </div>
          </div>
        </div>
      </section>

      <Cinta />

      {/* ── Cifras ───────────────────────────────────────────────────────── */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-[86rem] grid-cols-2 lg:grid-cols-4">
          {CIFRAS.map(([n, l], i) => (
            <div
              key={l}
              className={`flex flex-col gap-1 px-5 py-9 sm:px-8 sm:py-12 ${
                i < 2 ? "border-b border-line lg:border-b-0" : ""
              } ${i % 2 === 0 ? "border-r border-line" : ""} ${
                i === 1 ? "lg:border-r lg:border-line" : ""
              }`}
            >
              <span className="u-display text-[3rem] leading-none sm:text-[4.25rem]">{n}</span>
              <span className="u-eyebrow text-[0.62rem]! text-muted">
                {l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── El estampado ─────────────────────────────────────────────────── */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto grid max-w-[86rem] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <h2 className="u-display text-[2.3rem] sm:text-[2.9rem] lg:text-[3.4rem]">
            57 piezas.
            <br />
            <span className="u-marca">Ni una sola cara.</span>
          </h2>
          <div className="flex flex-col gap-7 lg:pt-4">
            <p className="u-lead max-w-[44ch]">
              Apodos, frases y pictogramas de la última década, compuestos en doce bandas
              alrededor de la botella. Todo lo dice el texto. El dibujo lo pones tú, que también has visto la década.
            </p>
            <p className="max-w-[44ch] text-[1rem] leading-relaxed text-muted">
              Una caricatura envejece con el cargo. Los apodos se quedan, como la hemeroteca.
            </p>
          </div>
        </div>

        {/* Seis piezas REALES sobre ámbar: el producto enseñándose a sí mismo.
            A sangre, sin contenedor: la franja es parte del cartel. */}
        <ul className="grid grid-cols-2 border-t-2 border-ink sm:grid-cols-3 lg:grid-cols-6">
          {[
            "01-galgo-de-paiporta",
            "12-tucan",
            "04-chiqui",
            "03-chirimoyas",
            "13-charo",
            "09-el-portero",
          ].map((slug, i) => (
            <li key={slug} className={`border-ink ${i < 5 ? "border-r-2" : ""} border-b-0 max-lg:[&:nth-child(2n)]:border-r-0 max-lg:border-b-2 sm:max-lg:[&:nth-child(2n)]:border-r-2 sm:max-lg:[&:nth-child(3n)]:border-r-0`}>
              <Link
                href="/estampado"
                className="relative block aspect-square overflow-hidden transition-opacity hover:opacity-85"
                style={{
                  background:
                    "linear-gradient(115deg,#3F2308 0%,#7A4A18 22%,#A0702E 52%,#7A4A18 80%,#3F2308 100%)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/iconos/${slug}.svg`} alt="" className="absolute inset-0 h-full w-full object-contain p-[13%]" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Las dos vidas ────────────────────────────────────────────────── */}
      <section className="s-dark border-b-2 border-ink">
        <div className="mx-auto flex max-w-[86rem] flex-col gap-14 px-5 py-20 sm:px-8 sm:py-28">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
            <h2 className="u-display text-[2.3rem] sm:text-[2.9rem] lg:text-[3.4rem]">
              Agua para toda la familia.
              <br />
              <span className="text-yellow">Vino para reír por no llorar.</span>
            </h2>
            <p className="u-lead max-w-[42ch] lg:pt-4">
              La misma botella sirve para las dos cosas. Se vende vacía y la llenas tú: de agua
              en la mesa, de vino a granel o de lo que te salga. La serigrafía es cerámica
              vitrificada, así que aguanta el lavavajillas mil veces y sigue ahí.
            </p>
            <p className="u-cond max-w-[26ch] text-[1.35rem] leading-[1.05] text-yellow sm:text-[1.6rem]">
              Una botella recargable.
              <br />
              Como los objetivos 2030,
              <br />
              pero de verdad.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Link href="/botella" className="group flex flex-col gap-4">
              <FotoProducto
                descripcion="botella vacía con agua en la mesa, vertical 3:4"
                ratio="3/4"
                capsula={false}
              />
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <span className="u-cond text-[1.3rem] transition-colors group-hover:text-yellow">
                  Vacía
                </span>
                <span className="u-mono text-[0.95rem]">{precioES(CATALOGO.botella.precio)}</span>
              </div>
            </Link>
            <Link href="/vino" className="group flex flex-col gap-4">
              <FotoProducto
                descripcion="botella con vino, corcho y cápsula, vertical 3:4"
                ratio="3/4"
              />
              <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <span className="u-cond text-[1.3rem] transition-colors group-hover:text-yellow">
                  Con vino
                </span>
                <span className="u-mono text-[0.95rem]">
                  desde {precioES(CATALOGO.estuche.precio)}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Comprar ──────────────────────────────────────────────────────── */}
      <section id="comprar" className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-[86rem] flex-col gap-10 px-5 py-20 sm:px-8 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex flex-col gap-2">
              <span className="u-mono text-[0.66rem] uppercase tracking-[0.2em] text-muted">
                Modelo 039 · Solicitud de lágrimas
              </span>
              <h2 className="u-display text-[2.3rem] sm:text-[3rem]">Tres maneras de llorar</h2>
            </div>
            <span className="u-eyebrow">Envío en 3-5 días</span>
          </div>

          <div className="grid border-l-2 border-t-2 border-ink md:grid-cols-3">
            {ORDEN.map((sku) => {
              const p = CATALOGO[sku];
              const destacada = sku === "estuche";
              return (
                <article
                  key={sku}
                  className={`relative flex flex-col gap-7 border-b-2 border-r-2 border-ink p-7 sm:p-8 ${
                    destacada ? "bg-yellow" : ""
                  }`}
                >
                  <div className="flex flex-col gap-3 md:min-h-[9.5rem]">
                    {destacada && (
                      <span className="u-mono w-fit bg-ink px-2 py-1 text-[0.56rem] uppercase tracking-[0.14em] text-base">
                        El chiste completo
                      </span>
                    )}
                    <h3 className="u-cond flex items-center gap-3 text-[1.6rem]">
                      <span aria-hidden="true" className="inline-block h-[0.85em] w-[0.85em] shrink-0 border-2 border-ink" />
                      {p.nombre}
                    </h3>
                    <p className={`text-[0.98rem] leading-snug ${destacada ? "text-ink/75" : "text-muted"}`}>
                      {p.reclamo}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-1.5">
                    <p className="u-display text-[3rem] leading-none">{precioES(p.precio)}</p>
                    {sku === "estuche" && (
                      <p className="u-mono text-[0.68rem] text-ink/70">
                        Te bebes una, te quedas la otra. Se regala tal cual, sin envolver.
                      </p>
                    )}
                    {sku === "pack-tres" && (
                      <p className="u-mono text-[0.68rem] text-muted">
                        23 € por botella. La vacía sola vale 22.
                      </p>
                    )}
                  </div>

                  {destacada && (
                    /* El sello del impreso: puro atrezzo, y por eso aria-hidden. */
                    <span
                      aria-hidden="true"
                      className="u-mono pointer-events-none absolute -top-5 right-4 flex h-24 w-24 rotate-[12deg] items-center justify-center rounded-full border-[3px] border-ink/60 text-center text-[0.52rem] uppercase leading-[1.4] tracking-[0.12em] text-ink/60"
                    >
                      Edición
                      <br />
                      numerada
                      <br />
                      Aranjuez
                    </span>
                  )}
                  <BotonComprar sku={sku} variante={destacada ? "solido" : "linea"}>
                    Comprar
                  </BotonComprar>

                  {p.alcohol && (
                    <p className={`u-mono text-[0.62rem] ${destacada ? "text-ink/70" : "text-muted"}`}>
                      Contiene alcohol · solo mayores de 18 · envío a España
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── La añada ─────────────────────────────────────────────────────
          La mecánica de recurrencia: el lote no se reimprime, se reescribe.
          Convierte la tirada corta en un motivo para volver, y da a la lista
          de espera un privilegio real sin inventar urgencia. */}
      <section className="s-dark border-b-2 border-ink">
        <div className="mx-auto grid max-w-[86rem] gap-6 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-14">
          <h2 className="u-display text-[2rem] sm:text-[2.5rem]">
            La añada <span className="text-yellow">2026</span>
          </h2>
          <p className="max-w-[56ch] text-[1.02rem] leading-relaxed text-muted">
            Cuando el primer lote se agote, no se reimprime: se escriben frases nuevas y cambia
            la añada, como en el vino. <span className="text-ink">La lista de espera recibe la
            primera numeración de cada una.</span> La hemeroteca no se acaba nunca.
          </p>
        </div>
      </section>

      {/* ── Ficha técnica ────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto grid max-w-[86rem] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <div className="flex flex-col gap-6">
            <h2 className="u-display text-[2.2rem] sm:text-[2.8rem]">
              Numerada a mano,
              <br />
              una por una.
            </h2>
            <p className="max-w-[40ch] text-[1.02rem] leading-relaxed text-muted">
              No es una serie limitada de mentira: la primera tirada son mil botellas, y cada
              una lleva su número escrito a mano en el hueco que la serigrafía deja para eso.
            </p>
          </div>

          <dl className="grid grid-cols-1 border-t-2 border-ink">
            {FICHA.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 border-b border-line py-4"
              >
                <dt className="u-mono text-[0.68rem] uppercase text-muted">{k}</dt>
                <dd className="u-cond text-[1rem]">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
