import { Glifo } from "@/components/Glifos";

/**
 * La botella, dibujada.
 *
 * Mientras no exista fotografía de producto —no la habrá hasta que el palé esté
 * en el garaje— la botella se dibuja. Y dibujada tiene una ventaja que la foto
 * no da: las piezas son texto real en el DOM, así que el buscador las indexa y
 * un lector de pantalla las lee.
 *
 * EL VIDRIO. Un degradado plano no parece cristal. Lo que lo hace parecer
 * cristal son cuatro capas superpuestas, y son las mismas que ves en la foto de
 * la referencia: cantos muy oscuros por el grosor del vidrio, un brillo
 * especular estrecho fuera del centro, un velo en el hombro donde la superficie
 * gira hacia la luz, y la base más oscura por el culo de la botella.
 *
 * EL ESPACIO DE COORDENADAS. Todo lo de dentro se mide en la caja original de
 * 252 × 830 y se escala entera con un transform. Por eso los cuerpos van en
 * píxeles fijos y NUNCA con variantes responsive (`sm:`): esas miran el ancho de
 * la ventana, no el de la botella, y descuadran el estampado. Para hacerla más
 * pequeña se baja `alto`.
 *
 * El estampado arranca en el hombro. El cuello va desnudo a propósito: en la
 * versión de vino lo tapa la cápsula y en la vacía el ámbar limpio con el tapón
 * encima queda mejor que cualquier pieza.
 */

type Escala = "xs" | "sm" | "md" | "lg" | "xl";

const CUERPO: Record<Escala, number> = { xs: 8, sm: 11, md: 15, lg: 18, xl: 26 };

const SILUETA =
  "path('M 4,828 L 4,352 C 4,276 82,312 82,208 L 82,34 C 82,22 76,18 76,8 L 76,2 L 176,2 L 176,8 C 176,18 170,22 170,34 L 170,208 C 170,312 248,276 248,352 L 248,828 Z')";

/** El hombro es cónico: solo cabe una pieza por banda o se la come la silueta. */
const HOMBRO: [Escala, string][] = [
  ["xs", "FACHA"],
  ["sm", "TUCÁN"],
];

/** Cuerpo cilíndrico: aquí vive la densidad, como en la referencia. */
const CUERPO_IZQ: Banda[] = [
  ["sm", [["CHEPAS", undefined, "02-chepas"], ["BULOS", "aviso"]]],
  ["md", [["FANGO", "gota"]]],
  ["xs", [["TELEPEDRO", "tele"], ["CEJAS", undefined, "10-cejas"]]],
  ["sm", [["CHIRIMOYAS", undefined, "03-chirimoyas"]]],
  ["xs", [["POR 7 VOTOS"], ["★"]]],
  ["xs", [["MEMA"], ["ECOLOGETAS"]]],
  ["sm", [["PUCHERAZO", "urna"]]],
  ["xs", [["YO ESTOY BIEN"]]],
];

const CUERPO_DER: Banda[] = [
  ["sm", [["EL UNO", "dedo"], ["SAUNAS", "vapor"]]],
  ["md", [["EL PUTO AMO", "corona"]]],
  ["xs", [["FISCAL SOPLÓN"], ["LA CAJERA", undefined, "11-la-cajera"]]],
  ["sm", [["FALCON"], ["GALGO", undefined, "01-galgo-de-paiporta"]]],
  ["xs", [["CHARO", undefined, "13-charo"], ["✱"]]],
  ["xs", [["IZQUIERDA CAVIAR"]]],
  ["sm", [["MARLASKONA"]]],
  ["xs", [["EDICIÓN Nº"]]],
];

/** [texto, glifo?, img?] — con img, la pieza pinta su arte real. */
type Banda = [Escala, [string, string?, string?][]];

const LAGRIMOMETRO = ["OJO SECO", "PUCHERO", "MOQUEO", "LLORERA", "MOCO TENDIDO", "DESEMBALSE"];


function Pieza({ e, t, g, img }: { e: Escala; t: string; g?: string; img?: string }) {
  if (img) {
    /* El arte real, a la escala de su banda. La palabra ya vive dentro del
       arte, así que no se repite debajo. */
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/iconos/${img}.svg`}
        alt={t}
        style={{ height: CUERPO[e] * 2.9, width: "auto" }}
      />
    );
  }
  if (g) {
    return (
      <span className="flex flex-col items-center gap-[2.5px]">
        <Glifo n={g} tam={CUERPO[e] * 1.15} />
        <span
          className="u-cond whitespace-nowrap text-center"
          style={{ fontSize: CUERPO[e] * 0.86, lineHeight: 0.95, letterSpacing: "0.02em" }}
        >
          {t}
        </span>
      </span>
    );
  }
  return (
    <span
      className="u-cond whitespace-nowrap text-center"
      style={{ fontSize: CUERPO[e], lineHeight: 0.95, letterSpacing: "0.02em" }}
    >
      {t}
    </span>
  );
}

function Columna({ bandas }: { bandas: Banda[] }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between">
      {bandas.map(([e, ps], i) => (
        <div key={i} className="flex w-full items-end justify-around gap-1.5">
          {ps.map(([t, g, img]) => (
            <Pieza key={t} e={e} t={t} g={g} img={img} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * El lagrimómetro. Es la pieza ancla del lateral y el equivalente exacto del
 * "trompímetre" de la referencia: escala vertical con sus marcas intermedias y
 * la barra de relleno clavada arriba — un instrumento que solo sabe dar una
 * lectura.
 */
function Lagrimometro() {
  return (
    <div className="relative flex w-[62px] flex-col" style={{ color: "inherit" }}>
      <span
        className="u-cond mb-1.5 text-center"
        style={{ fontSize: 7, letterSpacing: "0.08em" }}
      >
        LAGRIMÓMETRO
      </span>
      <div className="relative flex flex-1 flex-col justify-between pl-[9px]">
        <span className="absolute left-0 top-0 h-full w-[1.2px] bg-current" />
        {/* Clavada arriba: el chiste es que el medidor está reventado. */}
        <span className="absolute left-[-3px] top-0 h-[26%] w-[3px] bg-current" />
        {LAGRIMOMETRO.map((m) => (
          <div key={m} className="flex items-center gap-[3px]">
            <span className="h-[1.2px] w-[7px] bg-current" />
            <span className="u-cond leading-none" style={{ fontSize: 5.6, letterSpacing: "0.04em" }}>
              {m}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Botella({
  alto = 640,
  capsula = true,
  className = "",
}: {
  alto?: number;
  /** false = la botella vacía: tapón de corcho con cabeza de zamak, sin cápsula. */
  capsula?: boolean;
  className?: string;
}) {
  const ancho = Math.round((alto * 252) / 830);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: ancho, height: alto }}
      role="img"
      aria-label="Botella Lágrimas de Sánchez: vidrio ámbar serigrafiado en blanco con cincuenta y siete piezas"
    >
      <div
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: 252,
          height: 830,
          transform: `scale(${alto / 830})`,
          transformOrigin: "top left",
          clipPath: SILUETA,
          // Capa 1 — el cuerpo del vidrio. Cantos casi negros: es el grosor del
          // cristal visto de canto, y sin eso parece plástico.
          background:
            "linear-gradient(97deg, #24140399 0%, #2E1904 4%, #6B3F12 14%, #9A6B2C 30%, #B98A3E 42%, #8E6127 58%, #6A3E11 74%, #331B05 92%, #1D1002 100%)",
        }}
      >
        {/* Capa 2 — brillo especular. Estrecho y descentrado, como en la foto. */}
        <span
          className="pointer-events-none absolute inset-y-0 left-[26%] w-[13%]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,232,190,0.42) 45%, rgba(255,240,210,0.16) 70%, transparent)",
            filter: "blur(2px)",
          }}
        />
        {/* Capa 3 — velo del hombro, donde la superficie gira hacia la luz. */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[300px]"
          style={{
            background:
              "radial-gradient(70% 100% at 42% 100%, rgba(255,226,175,0.20), transparent 72%)",
          }}
        />
        {/* Capa 4 — el culo de la botella y la sombra de la base. */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[190px]"
          style={{
            background:
              "linear-gradient(to top, rgba(18,9,1,0.72), rgba(18,9,1,0.28) 42%, transparent)",
          }}
        />

        {capsula ? (
          <>
            {/* La cápsula del vino. */}
            <div
              className="absolute left-[74px] top-0 h-[112px] w-[104px]"
              style={{
                background:
                  "linear-gradient(97deg, #060504 0%, #191612 22%, #423A31 46%, #1C1813 70%, #050403 100%)",
              }}
            />
            <div className="absolute left-[74px] top-[108px] h-[4px] w-[104px] bg-[#070605]" />
          </>
        ) : (
          <>
            {/* El corcho asomando en la boca de la botella vacía. */}
            <div
              className="absolute left-[78px] top-[2px] h-[26px] w-[96px]"
              style={{ background: "linear-gradient(97deg,#7C5327 0%,#C89A5F 45%,#8A6134 100%)" }}
            />
            <div className="absolute left-[78px] top-[26px] h-[3px] w-[96px] bg-[#3F2308]/70" />
          </>
        )}

        {/* ── El estampado ─────────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-[24px] top-[206px] flex flex-col text-ink">
          <div className="flex h-[150px] flex-col items-center justify-start gap-[11px] pt-[4px]">
            {HOMBRO.map(([e, t]) => (
              <Pieza key={t} e={e} t={t} />
            ))}
          </div>

          {/* El lockup y sus 15 mm de aire: el único momento de calma. */}
          <div className="flex flex-col items-center gap-[2px] py-[9px]">
            <span className="u-cond text-[7px] tracking-[0.55em]">✦✦✦</span>
            <span className="font-[family-name:var(--font-display)] text-[35px] font-normal leading-none tracking-[0.005em]">
              LÁGRIMAS
            </span>
            <span className="font-[family-name:var(--font-display)] text-[21px] font-normal leading-none tracking-[0.09em]">
              DE SÁNCHEZ
            </span>
            <span className="my-[4px] h-px w-[104px] bg-current" />
            <span className="u-cond text-[6.5px] font-semibold tracking-[0.32em]">
              VINOS DE MADRID
            </span>
          </div>

          {/* Una pieza más, no el ancla: el ancla de la botella es su nombre. */}
          <div className="flex justify-center pb-[7px] pt-[2px]">
            <Pieza e="md" t="ESPAÑA VA COMO UN COHETE" />
          </div>

          {/* Tres columnas: texto, lagrimómetro, texto. Es la anatomía de la
              referencia — la escala vertical parte el cuerpo en dos. */}
          <div className="flex flex-1 gap-[6px] px-[12px] pt-[4px]">
            <Columna bandas={CUERPO_IZQ} />
            <Lagrimometro />
            <Columna bandas={CUERPO_DER} />
          </div>
        </div>
      </div>

      {!capsula && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ width: 252, height: 830, transform: `scale(${alto / 830})`, transformOrigin: "top left" }}
        >
          {/* La cabeza de zamak del tapón: más ancha que la boca y por encima del labio. */}
          <span
            className="absolute"
            style={{
              left: 62, top: -22, width: 128, height: 34, borderRadius: 10,
              background: "linear-gradient(97deg,#26231F 0%,#6E675D 42%,#8C8478 50%,#3A3630 100%)",
              boxShadow: "0 2px 3px rgba(0,0,0,0.4)",
            }}
          />
          <span className="absolute" style={{ left: 72, top: 10, width: 108, height: 5, background: "#0B0906", opacity: 0.3 }} />
        </div>
      )}

      {/* La sombra de apoyo. Sin ella la botella flota. */}
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -alto * 0.012,
          width: ancho * 1.15,
          height: alto * 0.035,
          background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)",
        }}
      />
    </div>
  );
}
