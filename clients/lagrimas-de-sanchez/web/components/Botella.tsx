import { PIEZAS } from "@/lib/piezas";
import { ICONO_DE, rutaArte } from "@/lib/iconos";
import { PROPORCION } from "@/lib/proporciones";

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

/**
 * El hombro va LIMPIO.
 *
 * Tuvo dos bandas y se quitaron: a esa altura el cono se cierra y las piezas
 * caían a 3,6-4,6 mm impresos, con astas de 0,15 mm. Ningún taller imprime
 * eso, y encima contradecía la decisión de composición ya tomada —hombro y
 * cuello desnudos, como en la referencia. Las cinco piezas bajaron al bloque.
 */

/**
 * EL BLOQUE, A LA MANERA DE LA REFERENCIA (21-sep, tras estudiar la trasera
 * del Xitxarel·lo que enseñó el dueño).
 *
 * La trasera de la referencia resuelve la composición así: el TROMPÍMETRE
 * —su instrumento— parte el bloque como una COLUMNA VERTICAL de arriba abajo,
 * y las piezas se empaquetan orgánicamente a los dos lados, con las líneas
 * base desalineadas y los tamaños alternados. No hay filas perceptibles: hay
 * tejido. Nuestra versión anterior (bandas horizontales justificadas) dejaba
 * la rejilla a la vista.
 *
 * Aquí: dos columnas de mini-filas (una o dos piezas por fila), el
 * LAGRIMÓMETRO (pieza 54) como columna central a toda la altura del bloque, y
 * cada pieza con un desplazamiento vertical pequeño y DETERMINÍSTICO (por su
 * índice, nunca aleatorio: el render debe ser idéntico en cada build) que
 * rompe la línea base sin desordenar.
 */
/**
 * EL EMPAQUETADOR (24-sep, tras estudiar diseno/referencias/xixarel-2.png).
 *
 * Las bandas de altura fija se jubilan. El problema que tenían era de
 * DENSIDAD: cada banda repartía su espacio sobrante con `justify-between`,
 * así que una fila con tres piezas anchas quedaba apretada y la de al lado,
 * con dos estrechas, dejaba dos agujeros. A un metro eso no es tejido, es
 * una nube con claros — que es exactamente lo que el dueño veía.
 *
 * La referencia resuelve la densidad como una galería justificada: cada fila
 * se estira hasta tocar los dos cantos del vidrio, y su ALTURA sale de esa
 * cuenta, no al revés. Aquí se hace igual:
 *
 *   alto_fila = (ancho_disponible − huecos) / suma_de_proporciones
 *
 * Con las proporciones reales del arte (lib/proporciones.ts) se sabe cuánto
 * ocupa cada pieza ANTES de pintarla, así que el reparto es exacto y la
 * mancha sale pareja de arriba abajo. La altura se acota para que ninguna
 * pieza se vuelva un cartel ni un pelo, y el ancho disponible se mide en la
 * BÉZIER del hombro a la altura de cada fila: arriba caben tres piezas,
 * abajo siete, igual que en el vidrio real.
 */

/** Medio ancho del vidrio a la altura y, en la caja de 252 × 830. */
function bordeIzquierdo(y: number): number {
  if (y >= 452) return 12;
  if (y <= 244) return 91;
  // La misma cúbica que la silueta: P0(12,452) P1(12,452) P2(91,330) P3(91,244)
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) {
    const t = (lo + hi) / 2;
    const yy = 452 * (1 - t) ** 3 + 452 * 3 * t * (1 - t) ** 2 + 330 * 3 * t * t * (1 - t) + 244 * t ** 3;
    if (yy > y) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return 12 * (1 - t) ** 3 + 12 * 3 * t * (1 - t) ** 2 + 91 * 3 * t * t * (1 - t) + 91 * t ** 3;
}

type Colocada = { slug: string; id: number | string; x: number; y: number; w: number; h: number };

/**
 * El carril del LAGRIMÓMETRO. Como el trompímetre de la referencia: una
 * columna vertical que parte el bloque, con las filas fluyendo a los lados.
 */
// Ancho y alto guardan la proporción REAL del instrumento (0,378): con un
// carril de otra forma, `object-contain` lo encoge y deja aire a los lados.
const CARRIL = { x0: 98, x1: 154, y0: 520, y1: 668 };

/** El aire interior. 3,5 px sobre 252 ≈ 1,6 mm impresos: apretado, como la referencia. */
const HUECO = 3.5;
/** Cuánto puede sobresalir una fila del canto: la silueta la recorta y la pieza «da la vuelta». */
const SANGRADO = 5;

/**
 * Coloca la cola de piezas en filas justificadas entre y0 e y1.
 * Devuelve las piezas con su caja absoluta en la retícula de 252 × 830.
 */
function empaquetar(
  cola: (number | string)[],
  y0: number,
  y1: number,
  altoIdeal: number,
  altoMin: number,
  altoMax: number,
): Colocada[] {
  const fuera: Colocada[] = [];
  const aspecto = (id: number | string) => {
    const slug = typeof id === "number" ? ICONO_DE[id] : id;
    return (slug && PROPORCION[slug]) || 1;
  };
  /** Los remates son argamasa: ocupan poco y no mandan en el alto de fila. */
  const escala = (id: number | string) => (typeof id === "string" ? 0.5 : 1);
  let i = 0;
  let y = y0;
  let fila = 0;

  while (i < cola.length && y < y1) {
    // EL RITMO. Sin él todas las filas salen del mismo alto y el tejido,
    // aun estando bien repartido, se lee como una tabla. En la referencia
    // conviven piezas de 4 mm con anclas del triple: ese contraste es la
    // mitad del carácter. El patrón es fijo (nunca aleatorio: el render
    // debe repetirse build tras build) y suma 1 de media para no descuadrar
    // el ajuste de altura.
    const RITMO = [1.28, 0.84, 1.06, 0.78, 1.34, 0.9, 1.15, 0.8, 1.22, 0.93];
    const altoIdealFila = altoIdeal * RITMO[fila % RITMO.length];
    fila++;
    // El ancho útil se mide en el centro de la fila tentativa, con el
    // hombro ya abierto: medir arriba dejaba las filas cortas.
    const medir = (alto: number) => {
      // El punto MÁS ESTRECHO de la franja, no su centro: en el hombro el
      // vidrio se abre hacia abajo, así que medir a media altura dejaba la
      // fila más ancha que el cristal por arriba y el canto decapitaba las
      // primeras piezas («EBLO PRIMERO», «ALGO AIPORTA»).
      const borde = Math.max(bordeIzquierdo(y), bordeIzquierdo(y + alto)) + 4;
      // El sangrado solo en el cilindro: ahí el vidrio gira y una pieza
      // cortada cuenta la vuelta. En el cono, cortar es un error de registro.
      const sangra = y > 470 ? SANGRADO : 0;
      return { x: borde - sangra, ancho: 252 - (borde - sangra) * 2 };
    };
    let { x, ancho } = medir(altoIdealFila);

    // Tramos libres: el carril del instrumento parte la fila en dos.
    const cortaCarril = y + altoIdealFila > CARRIL.y0 && y < CARRIL.y1;
    const tramos: [number, number][] = cortaCarril
      ? ([
          [x, CARRIL.x0 - HUECO],
          [CARRIL.x1 + HUECO, x + ancho],
        ] as [number, number][]).filter(([a, b]) => b - a > 26)
      : [[x, x + ancho]];

    let altoFila = altoIdealFila;
    let ultimaSuelta = false;
    const deLaFila: { id: number | string; tramo: number }[] = [];

    for (let t = 0; t < tramos.length && i < cola.length; t++) {
      const [ta, tb] = tramos[t];
      const util = tb - ta;
      let suma = 0;
      let lleno = false;
      const mias: (number | string)[] = [];
      while (i < cola.length) {
        const id = cola[i];
        suma += aspecto(id) * escala(id);
        mias.push(id);
        i++;
        // Altura que haría que lo acumulado llenase el tramo exacto.
        const h = (util - HUECO * (mias.length - 1)) / suma;
        if (h <= altoIdealFila) { lleno = true; break; }
      }
      // La ÚLTIMA fila no se justifica. Si la cola se agota a media fila, la
      // cuenta de «estírate hasta el canto» pide un alto enorme y la pieza
      // que queda sale de cartel — MARLASKONA ocupaba media base ella sola.
      const h = lleno
        ? (util - HUECO * (mias.length - 1)) / suma
        : altoIdealFila;
      altoFila = Math.min(altoFila, Math.max(altoMin, Math.min(altoMax, h)));
      if (!lleno) ultimaSuelta = true;
      mias.forEach((id) => deLaFila.push({ id, tramo: t }));
    }

    // Segunda pasada: con el alto ya decidido, justificar cada tramo.
    for (let t = 0; t < tramos.length; t++) {
      const suyas = deLaFila.filter((d) => d.tramo === t).map((d) => d.id);
      if (!suyas.length) continue;
      const [ta, tb] = tramos[t];
      const anchos = suyas.map((id) => aspecto(id) * escala(id) * altoFila);
      const usado = anchos.reduce((a, b) => a + b, 0);
      // Fila suelta: hueco fijo y centrada, en vez de estirada al canto.
      const hueco = ultimaSuelta
        ? HUECO * 2.5
        : suyas.length > 1
          ? (tb - ta - usado) / (suyas.length - 1)
          : 0;
      const ocupa = usado + hueco * (suyas.length - 1);
      let cx = ultimaSuelta || suyas.length === 1 ? ta + (tb - ta - ocupa) / 2 : ta;
      suyas.forEach((id, k) => {
        const slug = typeof id === "number" ? ICONO_DE[id] : id;
        const h = altoFila * escala(id);
        // Centrado vertical en la fila: un remate a media altura flotaría
        // pegado al techo de su franja.
        if (slug) fuera.push({ slug, id, x: cx, y: y + (altoFila - h) / 2, w: anchos[k], h });
        cx += anchos[k] + hueco;
      });
    }
    y += altoFila + HUECO;
  }
  return fuera;
}

/**
 * EL ORDEN DE LA COLA, que es la composición.
 *
 * No es el inventario: está barajado A MANO para que dos piezas del mismo
 * registro no caigan juntas (dos frases largas seguidas hacen un párrafo;
 * dos pictogramas seguidos, un muestrario) y para que las anchas y las
 * estrechas se turnen — de ahí sale la variedad de tamaño de fila, que es
 * lo que la referencia tiene y una retícula regular no puede fingir.
 *
 * Los remates (`r-*`) van donde el ojo necesita una pausa corta.
 */
const COLA: (number | string)[] = [
  26, 35, 3, "r-estrella", 22, 30,
  34, "r-puntos", 51, 10, 44, 12, 45,
  1, 20, "r-flecha-e", 4, 19, 36, 13,
  5, 42, 38, "r-cruz", 23, 39,
  47, 21, "r-rombos", 9, 40, 28, 43,
  27, 31, "r-flecha-ne", 6, 7, 48,
  37, "r-barras", 41, 49, 8, 15, 11,
  25, "r-asterisco", 17, 32, 50, 29, 18,
  46, "r-flecha-n", 57, 33, 55, 52, 16,
  56, "r-flecha-se", 2, 53, 24, "r-rombos", 14, "r-estrella",
];

/**
 * El tejido, calculado UNA vez al cargar el módulo. Va de y=366 (bajo el
 * lockup) a y=800 (sobre el talón) en la retícula de 830; el componente lo
 * pinta desplazado 286 px, que es donde arranca su lienzo.
 */
// El alto ideal de fila NO es un gusto: sale del área. 60 piezas de
// proporción media 1,8 repartidas en los ~436 × 228 px del vidrio, contando
// un 75 % de aprovechamiento, piden ~27 px de alto. Con 17 sobraba media
// botella vacía; con 40 no cabrían ni la mitad de las piezas.
/**
 * Empaqueta AJUSTANDO el alto de fila hasta que el tejido llene su zona.
 * Adivinar ese número a mano era inútil: cambia con cada pieza que entra o
 * sale de la cola. Tres iteraciones convergen de sobra.
 */
function empaquetarAjustado(
  cola: (number | string)[],
  y0: number,
  y1: number,
): Colocada[] {
  let ideal = 30;
  let salida = empaquetar(cola, y0, y1, ideal, 15, 52);
  for (let k = 0; k < 4; k++) {
    const fondo = salida.reduce((m, p) => Math.max(m, p.y + p.h), y0);
    const factor = (y1 - y0) / (fondo - y0);
    if (Math.abs(factor - 1) < 0.02) break;
    ideal = Math.max(15, Math.min(52, ideal * Math.sqrt(factor)));
    salida = empaquetar(cola, y0, y1, ideal, 15, 52);
  }
  return salida;
}

const TEJIDO: Colocada[] = empaquetarAjustado(COLA, 366, 800).map((p) => ({
  ...p,
  y: p.y - 286,
}));

/** La pieza, ya colocada: posición y tamaño los decide el empaquetador. */
function PiezaColocada({ p }: { p: Colocada }) {
  const rellena = typeof p.id === "string";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={rutaArte(p.slug)}
      alt={rellena ? "" : (TEXTO_DE[p.id as number] ?? "")}
      aria-hidden={rellena || undefined}
      className="absolute"
      style={{
        left: p.x,
        top: p.y,
        width: p.w,
        height: p.h,
        // El tamaño ya viene del empaquetador (los remates entran con la
        // mitad de peso), así que aquí no se escala nada más.
      }}
      loading="lazy"
      decoding="async"
    />
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
          className="absolute inset-x-0 bottom-[22px] top-[286px]"
          style={{ color: TINTA }}
        >
          {/* El lockup, pequeño y con su aire. Es lo único que se lee a un
              metro, y solo se lee porque no compite con nada. */}
          <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-[1px] pt-[11px]">
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

          {/* El tejido: 66 piezas empaquetadas en filas justificadas al ancho
              REAL del vidrio a cada altura, fluyendo alrededor del carril del
              lagrimómetro. Posiciones absolutas en la retícula de 252 × 830,
              calculadas una vez al cargar el módulo: el render es idéntico en
              cada build y no depende de flexbox. */}
          <div className="pointer-events-none absolute inset-0">
            {TEJIDO.map((p, i) => (
              <PiezaColocada key={`${p.slug}-${i}`} p={p} />
            ))}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rutaArte(ICONO_DE[54])}
              alt={TEXTO_DE[54] ?? "Lagrimómetro"}
              className="absolute"
              style={{
                left: CARRIL.x0,
                top: CARRIL.y0 - 286,
                width: CARRIL.x1 - CARRIL.x0,
                height: CARRIL.y1 - CARRIL.y0,
                objectFit: "contain",
              }}
              loading="lazy"
              decoding="async"
            />
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
