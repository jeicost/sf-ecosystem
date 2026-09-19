import { PIEZAS } from "@/lib/piezas";
import { ICONO_DE } from "@/lib/iconos";

/**
 * La botella, dibujada.
 *
 * Mientras no exista fotografía de producto —no la habrá hasta que el palé esté
 * en el garaje— la botella se dibuja. Y ahora se dibuja con el ARTE REAL: cada
 * pieza es su propio SVG, el mismo que irá a la pantalla de serigrafía. Antes
 * se simulaba con texto y glifos, que era más indexable pero mentía sobre el
 * resultado; hoy el estampado de la web es lo que se va a hornear.
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
 * la ventana, no el de la botella, y descuadran el estampado.
 *
 * LA COMPOSICIÓN (19-sep, tras medirse contra la referencia). El estampado del
 * Xitxarel·lo, a un metro, se lee como UNA MANCHA DE TEXTURA. El nuestro se
 * deshacía en piezas sueltas flotando. Tres cosas lo arreglan y son las que
 * gobiernan este fichero:
 *
 *   1. El bloque se CONCENTRA. Arranca donde muere el hombro y acaba sobre el
 *      talón. Cuello y hombro alto quedan limpios, como en la referencia.
 *   2. Las piezas se APIÑAN: separaciones de 3-5 px sobre 252 de ancho, no de
 *      quince. La ocupación objetivo es del 70-78 %.
 *   3. El lockup se REDUCE y se sube a la zona limpia. Antes competía con el
 *      estampado; ahora flota encima, que es lo que lo hace legible.
 *
 * El lagrimómetro dejó de ser una columna que partía la botella en dos: es una
 * pieza más, alta y estrecha, metida en el tejido.
 */

/** La tinta cerámica: una sola, blanca. El mismo hueso que los SVG del estampado. */
const TINTA = "#F6F1E6";

/**
 * LA BOTELLA REAL — Estal SM BG MG ESSENTIA, Sommelier Long, 150 cl (19-sep).
 * La caja de 252 × 830 se mantiene; dentro, la silueta va a escala de la ficha
 * técnica (830 px = 380,9 mm → 2,18 px/mm): cuerpo ø105 = 228 px, cuello ø32
 * = 70 px y 115 mm = 250 px de largo, cilindro inferior 140 mm = 305 px, y el
 * hombro sommelier es la curva larga entre ambos.
 */
const SILUETA =
  "path('M 30,828 Q 12,828 12,810 L 12,523 C 12,452 91,330 91,244 L 91,2 L 161,2 L 161,244 C 161,330 240,452 240,523 L 240,810 Q 240,828 222,828 Z')";

const TEXTO_DE: Record<number, string> = Object.fromEntries(
  PIEZAS.map((p) => [p.n, p.texto]),
);

/**
 * Las bandas del estampado: [alto en px, piezas].
 *
 * Las piezas se nombran por su número de inventario y se dibujan con su SVG
 * real, así que el ancho de cada una lo decide su propio arte — que es
 * exactamente lo que pasa al maquetar una serigrafía. Los remates (`r-*`) no
 * significan nada: rellenan los huecos de 3-4 px que, sin ellos, convierten el
 * tejido en un colador.
 *
 * Arriba, sobre la curva del hombro, solo caben piezas sueltas y pequeñas: el
 * cono se cierra y la silueta se las come.
 */
type Banda = [number, (number | string)[]];

/**
 * El ancho útil de cada banda, en píxeles de la caja de 252.
 *
 * El contenedor del estampado es un rectángulo, pero la botella es una curva:
 * si todas las bandas usan el mismo ancho, las de arriba se salen por los
 * costados y aparecen cortadas por el canto.
 *
 * Va DECLARADO y no calculado a partir de la Bézier: el reparto vertical real
 * lo hace flexbox con el espacio sobrante, así que acumular alturas a mano para
 * deducir a qué altura cae cada banda daba un número que no era el de la
 * pantalla, y las primeras filas seguían saliéndose. Esta tabla sube del ancho
 * del hombro al del cilindro en seis bandas y luego se queda plana, que es
 * exactamente la forma de la botella.
 */
const ANCHOS_HOMBRO = [62, 84];


const HOMBRO: Banda[] = [
  [8, [26, "r-estrella", 30]],
  [10, [20, 12, "r-flecha-e", 19]],
];

/**
 * El bloque denso. MENOS bandas y MÁS piezas por banda que en el primer
 * intento: con dos piezas por fila y justificación de lado a lado, lo que
 * queda entre ellas es un agujero, no un hueco. Con cinco, la fila se sostiene
 * sola y aparece el tejido.
 *
 * Los remates se repiten a propósito — en la referencia la misma flechita sale
 * cuatro veces. Son argamasa: nadie los cuenta, pero sin ellos no hay muro.
 */
const CUERPO: Banda[] = [
  [19, [22, "r-asterisco", 2]],
  [23, [34, "r-cruz", 35]],
  [18, [3, "r-rombos", 51, "r-flecha-ne"]],
  [24, [36, 19, 44]],
  [18, [1, 10, 37, 28]],
  [23, [42, 13, "r-doble", 45]],
  [18, [11, "r-flecha-se", 14, "r-estrella"]],
  [24, [5, 29, "r-puntos", 39]],
  [18, ["r-manecilla", 23, 43, "r-rombos"]],
  [23, [47, 9, "r-flecha-n", 38]],
  [18, [33, "r-asterisco", 50, 18]],
  [24, [40, 8, "r-doble", 46]],
  [18, [21, "r-estrella", 55, 7, "r-cruz"]],
  [23, [48, 32, "r-flecha-e", 41]],
  [18, [4, "r-rombos", 49, 15]],
  [24, [52, 6, "r-cruz", 53]],
  [18, [17, "r-barras", 31, "r-flecha-ne"]],
  [21, [56, 27, 25, "r-puntos"]],
  [21, [57, "r-flecha-e", 24]],
];

const ANCHOS = CUERPO.map((_, i) => Math.min(206, 88 + i * 22));

const LAGRIMOMETRO = ["OJO SECO", "PUCHERO", "MOQUEO", "LLORERA", "MOCO TENDIDO", "DESEMBALSE"];

/**
 * Una pieza del estampado: su SVG real, escalado por el ALTO de su banda.
 *
 * El ancho lo decide el propio arte, porque cada SVG viene ceñido a su dibujo.
 * Eso es justo lo que pasa al maquetar una serigrafía de verdad: las piezas no
 * caben en casillas, se acomodan unas a otras.
 */
function Pieza({ id, alto }: { id: number | string; alto: number }) {
  const slug = typeof id === "number" ? ICONO_DE[id] : id;
  if (!slug) return null;
  const rellena = typeof id === "string"; // los remates no dicen nada
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/iconos/${slug}.svg`}
      alt={rellena ? "" : (TEXTO_DE[id as number] ?? "")}
      aria-hidden={rellena || undefined}
      style={{ height: rellena ? alto * 0.62 : alto, width: "auto" }}
      className="shrink-0"
    />
  );
}

/** Una banda justificada de lado a lado. El gap pequeño es la densidad. */
function Banda({
  alto,
  piezas,
  ancho,
}: {
  alto: number;
  piezas: (number | string)[];
  ancho: number;
}) {
  return (
    <div
      className="mx-auto flex items-center justify-between gap-[3px]"
      style={{ width: ancho }}
    >
      {piezas.map((id, i) => (
        <Pieza key={`${id}-${i}`} id={id} alto={alto} />
      ))}
    </div>
  );
}

/**
 * El lagrimómetro. FUERA DEL BLOQUE por ahora, y a propósito: es la pieza 54 y
 * los medidores siguen siendo decisión abierta del dueño
 * (`producto/medidores-abierto.md`). Metido a la fuerza al final del tejido se
 * salía por el talón, y una pieza que no está decidida no merece romper la
 * composición. Se queda aquí, montado y listo, para el día que se cierre.
 */
function Lagrimometro({ alto }: { alto: number }) {
  return (
    <div className="relative flex flex-col items-center" style={{ height: alto, width: 168 }}>
      <span className="u-cond" style={{ fontSize: 5, letterSpacing: "0.22em" }}>
        LAGRIMÓMETRO
      </span>
      <div className="relative mt-[2px] flex w-full items-start justify-between">
        <span className="absolute inset-x-0 top-0 h-[1.1px] bg-current" />
        {/* Clavado a la derecha: el chiste es que el medidor está reventado. */}
        <span className="absolute right-0 top-[-2px] h-[5px] w-[2.6px] bg-current" />
        {LAGRIMOMETRO.map((m) => (
          <span
            key={m}
            className="u-cond origin-top-left rotate-90 whitespace-nowrap leading-none"
            style={{ fontSize: 3.9, letterSpacing: "0.02em", marginLeft: 3 }}
          >
            {m}
          </span>
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
      aria-label="Botella Lágrimas de Sánchez: magnum sommelier de 150 cl en vidrio antico serigrafiado en blanco con cincuenta y siete piezas"
    >
      <div
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: 252,
          height: 830,
          transform: `scale(${alto / 830})`,
          transformOrigin: "top left",
          clipPath: SILUETA,
          // Capa 1 — el cuerpo del vidrio ANTICO de Estal: oliva oscurísimo,
          // casi negro, que solo se abre a verde donde pasa la luz. Cantos
          // negros: es el grosor del cristal visto de canto, y sin eso parece
          // plástico. NO es ámbar: el ámbar dora, el antico verdea.
          background:
            "linear-gradient(97deg, #05060299 0%, #090B03 4%, #1A1E08 14%, #2E350E 30%, #414A16 42%, #2B310C 58%, #191D06 74%, #0A0C03 92%, #050601 100%)",
        }}
      >
        {/* Capa 2 — brillo especular. Estrecho y descentrado, como en la foto. */}
        <span
          className="pointer-events-none absolute inset-y-0 left-[26%] w-[13%]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(214,226,168,0.34) 45%, rgba(228,236,196,0.12) 70%, transparent)",
            filter: "blur(2px)",
          }}
        />
        {/* Capa 3 — velo del hombro, donde la superficie gira hacia la luz. */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-[300px]"
          style={{
            background:
              "radial-gradient(70% 100% at 42% 100%, rgba(206,218,158,0.16), transparent 72%)",
          }}
        />
        {/* Capa 4 — el culo de la botella y la sombra de la base. */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[190px]"
          style={{
            background:
              "linear-gradient(to top, rgba(4,6,1,0.62), rgba(4,6,1,0.22) 42%, transparent)",
          }}
        />
        {/* Capa 5 — luz de relleno por el canto derecho. Una sola luz deja el
            lado oscuro plano; esto le devuelve el volumen cilíndrico. */}
        <span
          className="pointer-events-none absolute inset-y-0 right-[7%] w-[6%]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(198,214,150,0.16) 60%, transparent)",
            filter: "blur(2px)",
          }}
        />
        {/* Capa 6 — el punt: los 30 mm de culo hundido de la Essentia se leen
            como una elipse clara justo encima del talón. */}
        <span
          className="pointer-events-none absolute bottom-[10px] left-1/2 h-[46px] w-[150px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(closest-side, rgba(188,206,146,0.13), transparent 78%)",
          }}
        />
        {/* Capa 7 — la junta del molde. Dos hilos verticales casi invisibles:
            están en toda botella soplada y es lo que delata que es vidrio.
            Solo en el cuerpo: en el cuello la junta no se ve, y trazada de
            arriba abajo parecía el borde de un panel pegado encima. */}
        <span
          className="pointer-events-none absolute bottom-0 left-[13%] top-[55%] w-px"
          style={{ background: "rgba(226,238,190,0.06)" }}
        />
        <span
          className="pointer-events-none absolute bottom-0 right-[13%] top-[55%] w-px"
          style={{ background: "rgba(226,238,190,0.04)" }}
        />

        {capsula ? (
          <>
            {/* La cápsula del vino. En magnum es larga: baja 80 mm por el
                cuello, que en esta caja son 175 px. */}
            <div
              className="absolute left-[84px] top-0 h-[175px] w-[84px]"
              style={{
                background:
                  "linear-gradient(97deg, #060504 0%, #191612 22%, #423A31 46%, #1C1813 70%, #050403 100%)",
              }}
            />
            <div className="absolute left-[84px] top-[171px] h-[4px] w-[84px] bg-[#070605]" />
            {/* El resalte del gollete bajo el estaño: la cápsula no es un tubo
                liso, marca el anillo que tiene debajo. */}
            <div className="absolute left-[84px] top-[38px] h-[7px] w-[84px] bg-[#0B0A08]/70" />
          </>
        ) : (
          <>
            {/* El corcho asomando en la boca de la botella vacía. */}
            <div
              className="absolute left-[96px] top-[2px] h-[24px] w-[60px]"
              style={{ background: "linear-gradient(97deg,#7C5327 0%,#C89A5F 45%,#8A6134 100%)" }}
            />
            <div className="absolute left-[96px] top-[24px] h-[3px] w-[60px] bg-[#3F2308]/70" />
            {/* El anillo del gollete: el vidrio engorda en el labio, y ese
                escalón es lo que distingue una boca de corcho de un tubo. */}
            <div
              className="absolute left-[91px] top-[30px] h-[15px] w-[70px]"
              style={{ background: "linear-gradient(97deg,rgba(226,238,190,0.16),rgba(226,238,190,0.03) 60%,transparent)" }}
            />
            <div className="absolute left-[91px] top-[45px] h-px w-[70px] bg-[#040601]/60" />
          </>
        )}

        {/* ── El estampado ─────────────────────────────────────────────
            En la Sommelier Long el cuello desnudo llega hasta 244 y el hombro
            es una curva larga: arriba solo caben piezas sueltas, el lockup se
            asienta donde el cono ya abre (~160 px de ancho útil) y la densidad
            vive en el cilindro inferior (523 → base), como en la real. */}
        {/* La tinta es UNA y es BLANCA: color fijo, nunca heredado del tema.
            Sobre antico no hay alternativa — es el único dato de producto que
            la página no puede decidir. */}
        <div
          className="absolute inset-x-0 bottom-[22px] top-[286px] flex flex-col"
          style={{ color: TINTA }}
        >
          {/* El hombro: piezas sueltas y pequeñas. El cono se cierra al subir
              y la silueta se come todo lo que sea más ancho. */}
          <div className="flex flex-col items-center gap-[5px]">
            {HOMBRO.map(([alto, piezas], i) => (
              <Banda
                key={i}
                alto={alto}
                piezas={piezas}
                ancho={ANCHOS_HOMBRO[i]}
              />
            ))}
          </div>

          {/* El lockup, pequeño y con su aire. Es lo único que se lee a un
              metro, y solo se lee porque no compite con nada. */}
          <div className="flex flex-col items-center gap-[1px] pb-[8px] pt-[11px]">
            <span className="u-cond text-[5px] tracking-[0.5em]">✦✦✦</span>
            <span className="font-[family-name:var(--font-display)] text-[17px] font-normal leading-none tracking-[0.01em]">
              LÁGRIMAS
            </span>
            <span className="font-[family-name:var(--font-display)] text-[9.5px] font-normal leading-none tracking-[0.1em]">
              DE SÁNCHEZ
            </span>
            <span className="my-[2px] h-px w-[54px] bg-current" />
            <span className="u-cond text-[4.6px] font-semibold tracking-[0.3em]">
              VINOS DE MADRID
            </span>
          </div>

          {/* El bloque denso. Aquí es donde se gana o se pierde la prueba del
              metro: separaciones de 3 px, no de quince. */}
          <div className="flex flex-1 flex-col justify-between gap-[2px] pb-[2px]">
            {CUERPO.map(([alto, piezas], i) => (
              <Banda
                key={i}
                alto={alto}
                piezas={piezas}
                ancho={ANCHOS[i]}
              />
            ))}
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
              left: 76, top: -22, width: 100, height: 32, borderRadius: 10,
              background: "linear-gradient(97deg,#26231F 0%,#6E675D 42%,#8C8478 50%,#3A3630 100%)",
              boxShadow: "0 2px 3px rgba(0,0,0,0.4)",
            }}
          />
          <span className="absolute" style={{ left: 84, top: 9, width: 84, height: 5, background: "#0B0906", opacity: 0.3 }} />
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
