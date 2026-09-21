#!/usr/bin/env node
/**
 * Genera el desarrollo plano de la botella DEFINITIVA (Estal SM BG MG Essentia,
 * magnum 150 cl): la banda de 330 × 140 mm del cuerpo cilíndrico con las piezas
 * de arte montadas, más la franja del hombro. Es la lámina de referencia para
 * ilustrador y serigrafista.
 *
 *   node generar-desarrollo.mjs
 *
 * OJO — esto es un MONTAJE DE REFERENCIA, no arte final. Una retícula compuesta
 * por máquina nunca iguala a una compuesta a mano: sirve para ver densidad,
 * reservas y peso óptico, y para que el ilustrador parta de algo. La
 * composición definitiva es trabajo suyo.
 *
 * LA GEOMETRÍA (19-sep). El cuerpo cilíndrico es ø105 → perímetro 329,9 mm, y
 * mide 140 mm de alto: esa es la única zona recta y la única con registro fácil.
 * Por encima hay 126 mm de hombro CÓNICO, cuyo desarrollo real no es un
 * rectángulo sino un sector de corona — aquí se dibuja como franja indicativa
 * y lo resuelve el serigrafista con la botella delante.
 *
 * El LOCKUP se fue al hombro: un halo de 84 mm en una banda de 140 se comía el
 * 60 % del cilindro, y en la botella real la marca cae justo donde el cono ya
 * abre y la superficie es casi plana.
 *
 * Dos reglas que costaron dos intentos:
 * - Las piezas se dimensionan por ALTO DE BANDA con un tope de ancho generoso.
 *   Escalarlas al ancho del segmento las encoge hasta lo ilegible cuando el
 *   segmento es estrecho.
 * - Cada banda esquiva las zonas reservadas: si el halo del lockup o la
 *   contraetiqueta cruzan su franja, se parte en los segmentos libres.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const WEB = join(AQUI, "..", "web");

const src = readFileSync(join(WEB, "lib/piezas.ts"), "utf8");
const rx = /\{ n: (\d+), bloque: "(\w)", texto: "([^"]+)"(?:, objeto: "([^"]+)")?(?:, historia: "([^"]+)")? \}/g;
const nombreDe = Object.fromEntries([...src.matchAll(rx)].map(m => [+m[1], m[3]]));
const mapa = JSON.parse(readFileSync(join(WEB, "lib/iconos.ts"), "utf8")
  .match(/\{([\s\S]*?)\n\};/)[1].split("\n").filter(l => /^\s*\d+:/.test(l))
  .reduce((a, l) => { const m = l.match(/(\d+):\s*"([^"]+)"/); return a + `"${m[1]}":"${m[2]}",`; }, "{")
  .replace(/,$/, "") + "}");

const MM = 4;
/** El cuerpo cilíndrico: perímetro 329,9 mm × 140 mm de alto. */
const W = 330 * MM, H_CUERPO = 140 * MM;
/** La franja del hombro que se dibuja encima, indicativa. */
const H_HOMBRO = 62 * MM;
const H = H_HOMBRO + H_CUERPO;

/** El lockup vive en el hombro, así que no reserva sitio en el cilindro. */
const HALO   = { x: 100*MM, y: 8*MM, w: 130*MM, h: 46*MM };
/** La contraetiqueta sí: va en la trasera, que en esta lámina son los bordes. */
const CONTRA = { x: 10*MM, y: H_HOMBRO + 70*MM, w: 80*MM, h: 58*MM };
/**
 * El LAGRIMÓMETRO (54) es una COLUMNA-INSTRUMENTO vertical, como el
 * trompímetre de la referencia: cruza todas las bandas de arriba abajo, así
 * que reserva su carril y las bandas fluyen a los lados. En la botella real
 * cae en la cara trasera, a un cuarto de vuelta del lockup.
 */
const COL54  = { x: 236*MM, y: H_HOMBRO + 6*MM, w: 42*MM, h: 128*MM };
const RESERVAS = [CONTRA, COL54];

/**
 * [alto de banda mm, piezas]. NUEVE bandas, no doce: el cilindro perdió 55 mm
 * de alto y ganó 55 de ancho. Suma exacta: 114 mm de bandas + 8 separaciones de
 * 2 mm + 4 de margen superior + 6 de inferior = 140 mm. Si se toca una altura
 * hay que compensar en otra, o la última fila se sale del lienzo.
 *
 * Las tres bandas altas (17, 16 y 13) son las anclas: el contraste de escala es
 * lo que separa esta retícula de una nube de palabras. Van repartidas, nunca
 * seguidas. Están las 56 piezas de banda; la 57.ª es el lagrimómetro, que no
 * va en banda: cruza el cilindro en vertical por su carril reservado (COL54).
 */
const BANDAS = [
  [11, [26, 30, 20, 17, 35, 19, 44, 49]],
  [17, [34, 22, 12, 1]],
  [12, [3, 51, 37, 10, 4, 55]],
  [13, [23, 40, 2, 18, 33]],
  [11, [36, 47, 29, 45, 6, 25, 53]],
  [16, [42, 13, 5, 38, 56]],
  [11, [50, 28, 46, 11, 21, 7, 31]],
  [12, [14, 43, 9, 39, 32, 24]],
  [11, [16, 27, 52, 15, 57, 8, 48, 41]],
];

const arteDe = (n) => {
  const slug = mapa[n];
  if (!slug) return null;
  const f = join(WEB, "public/iconos", slug + ".svg");
  if (!existsSync(f)) return null;
  const s = readFileSync(f, "utf8");
  // Los iconos vienen CEÑIDOS a su dibujo (diseno/iconos/ajustar-viewbox.py),
  // así que su viewBox ya no empieza en 0 0: hay que leer el origen y
  // descontarlo al colocarlos, o la pieza se va fuera de su hueco.
  const vb = s.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!vb) return null;
  return { x: +vb[1], y: +vb[2], w: +vb[3], h: +vb[4], cuerpo: s.replace(/<\/?svg[^>]*>/g, "") };
};

function segmentos(y, alto) {
  const cortes = RESERVAS.filter(r => y + alto > r.y && y < r.y + r.h)
    .map(r => [r.x, r.x + r.w]).sort((a, b) => a[0] - b[0]);
  const libres = [];
  let x = 7 * MM;
  for (const [a, b] of cortes) {
    if (a - x > 26 * MM) libres.push([x, a - 3 * MM]);
    x = Math.max(x, b + 3 * MM);
  }
  if (W - 7 * MM - x > 26 * MM) libres.push([x, W - 7 * MM]);
  return libres;
}

let y = H_HOMBRO + 4 * MM, colocadas = 0;
const saltadas = new Set();
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
  // El vidrio ANTICO desarrollado: oscuro en los cantos (donde el cilindro
  // gira y se va de vista) y abierto en el centro, que es la cara que mira.
  + `<defs><linearGradient id="v" x1="0" x2="1"><stop offset="0" stop-color="#0A0C03"/>`
  + `<stop offset=".17" stop-color="#1E2208"/><stop offset=".47" stop-color="#414A16"/>`
  + `<stop offset=".79" stop-color="#1E2208"/><stop offset="1" stop-color="#0A0C03"/></linearGradient></defs>`
  + `<rect width="${W}" height="${H}" fill="url(#v)"/>`
  // La franja del hombro, más apagada: no es superficie recta y aquí solo se
  // indica. El serigrafista la desarrolla como sector con la botella delante.
  + `<rect width="${W}" height="${H_HOMBRO}" fill="#060802" opacity="0.42"/>`
  + `<line x1="0" y1="${H_HOMBRO}" x2="${W}" y2="${H_HOMBRO}" stroke="#E0685C" stroke-width="1.4" stroke-dasharray="9 6"/>`
  + `<text x="8" y="${H_HOMBRO - 7}" fill="#E0685C" font-family="monospace" font-size="9" letter-spacing="1">`
  + `HOMBRO CÓNICO · 126 mm · piezas sueltas, el perímetro se cierra al subir · desarrollo real = sector, no rectángulo</text>`
  + `<text x="8" y="${H_HOMBRO + 14}" fill="#9FB07A" font-family="monospace" font-size="9" letter-spacing="1">`
  + `CUERPO CILÍNDRICO · 330 × 140 mm · 360° · la única zona recta</text>`;

for (const [altoMM, ns] of BANDAS) {
  const alto = altoMM * MM;
  const libres = segmentos(y, alto);
  const arte = ns.map(n => ({ n, a: arteDe(n) })).filter(x => x.a);
  ns.forEach(n => { if (!arteDe(n)) saltadas.add(nombreDe[n] || n); });
  if (!arte.length || !libres.length) { y += alto + 2 * MM; continue; }

  const anchoTotal = libres.reduce((s, [a, b]) => s + (b - a), 0);
  let idx = 0;
  libres.forEach(([xa, xb], si) => {
    const cuota = si === libres.length - 1
      ? arte.length - idx
      : Math.max(1, Math.round(arte.length * ((xb - xa) / anchoTotal)));
    const grupo = arte.slice(idx, idx + cuota); idx += cuota;
    if (!grupo.length) return;
    // El alto de banda manda; el ancho solo pone un techo holgado.
    const items = grupo.map(g => {
      const k = Math.min(alto / g.a.h, ((xb - xa) * 0.9) / grupo.length / g.a.w);
      return { ...g, k, w: g.a.w * k, h: g.a.h * k };
    });
    const usado = items.reduce((s, i) => s + i.w, 0);
    const hueco = Math.max(3 * MM, ((xb - xa) - usado) / (items.length + 1));
    let x = xa + hueco;
    for (const it of items) {
      // El mismo baile de línea base que la web (components/Botella.tsx):
      // determinístico por número de pieza, ±3 px. Es lo que convierte una
      // retícula en tejido — y al ser la misma fórmula, la lámina y la
      // botella de la web cuentan la misma historia.
      const dy = ((it.n * 37) % 7) - 3;
      out += `<g transform="translate(${x.toFixed(1)} ${(y + (alto - it.h) / 2 + dy).toFixed(1)}) `
           + `scale(${it.k.toFixed(4)}) translate(${-it.a.x} ${-it.a.y})" fill="#F6F1E6">${it.a.cuerpo}</g>`;
      x += it.w + hueco; colocadas++;
    }
  });
  y += alto + 2 * MM;
}

// La columna-instrumento, centrada en su carril y a toda su altura.
const a54 = arteDe(54);
if (a54) {
  const k54 = Math.min(COL54.h / a54.h, COL54.w / a54.w);
  const x54 = COL54.x + (COL54.w - a54.w * k54) / 2;
  const y54 = COL54.y + (COL54.h - a54.h * k54) / 2;
  out += `<g transform="translate(${x54.toFixed(1)} ${y54.toFixed(1)}) `
       + `scale(${k54.toFixed(4)}) translate(${-a54.x} ${-a54.y})" fill="#F6F1E6">${a54.cuerpo}</g>`;
  colocadas++;
} else {
  saltadas.add(nombreDe[54] || 54);
}

out += `<g transform="translate(${HALO.x + HALO.w / 2} ${HALO.y + 26 * MM})" fill="#F6F1E6" text-anchor="middle">`
  + `<text y="0" font-size="42" font-family="Bodoni Moda, Georgia, serif">LÁGRIMAS</text>`
  + `<text y="27" font-size="24" letter-spacing="2.5" font-family="Bodoni Moda, Georgia, serif">DE SÁNCHEZ</text>`
  + `<rect x="-60" y="38" width="120" height="1.3"/>`
  + `<text y="56" font-size="9.5" letter-spacing="3.8" font-family="Barlow Condensed, sans-serif" font-weight="600">VINOS DE MADRID</text></g>`
  + `<rect x="${CONTRA.x}" y="${CONTRA.y}" width="${CONTRA.w}" height="${CONTRA.h}" fill="none" stroke="#E0685C" stroke-width="1.3" stroke-dasharray="6 5"/>`
  + `<text x="${CONTRA.x + CONTRA.w / 2}" y="${CONTRA.y + CONTRA.h / 2}" text-anchor="middle" fill="#FFD9D4" font-family="monospace" font-size="8.5" letter-spacing="1">CONTRAETIQUETA</text>`
  + `<text x="${CONTRA.x + CONTRA.w / 2}" y="${CONTRA.y + CONTRA.h / 2 + 13}" text-anchor="middle" fill="#FFD9D4" font-family="monospace" font-size="7">80 × 58 mm · solo vino</text>`
  + `<text x="${W - 8}" y="${H - 8}" text-anchor="end" fill="#7E8C5E" font-family="monospace" font-size="8.5">`
  + `Estal SM BG MG ESSENTIA · 150 cl · ANTICO · 1 tinta blanca · montaje de referencia, no arte final</text>`
  + `<rect x="${HALO.x}" y="${HALO.y}" width="${HALO.w}" height="${HALO.h}" fill="none" stroke="#E0685C" stroke-width="1.1" stroke-dasharray="3 5"/>`
  + `<rect width="${W}" height="${H}" fill="none" stroke="#14100B" stroke-width="2"/></svg>`;

writeFileSync(join(AQUI, "desarrollo-plano.svg"), out);

/**
 * La lámina se valida antes de darla por buena. Un SVG mal formado NO falla al
 * escribirlo ni al abrirlo: el navegador lo descarta y la lámina sale EN
 * BLANCO, que es la peor forma de romperse porque parece que no has generado
 * nada. Ya pasó: dos iconos de solo texto tenían `letter-spacing` duplicado y
 * se llevaron por delante el desarrollo entero.
 */
const { DOMParser } = await import("@xmldom/xmldom").catch(() => ({}));
const errores = [];
if (DOMParser) {
  new DOMParser({ onError: (_, m) => errores.push(m) }).parseFromString(out, "image/svg+xml");
} else {
  // Sin dependencia: al menos la comprobación que ya nos mordió.
  for (const m of out.matchAll(/<[^>]+>/g)) {
    const attrs = [...m[0].matchAll(/([\w-]+)=/g)].map((a) => a[1]);
    if (new Set(attrs).size !== attrs.length) errores.push(`atributo duplicado en ${m[0].slice(0, 90)}`);
  }
}
if (errores.length) {
  console.error(`\n⛔ La lámina está MAL FORMADA y saldría en blanco:`);
  for (const e of errores.slice(0, 5)) console.error("   " + e);
  process.exit(1);
}

console.log(`${colocadas} piezas colocadas · sin arte aún: ${[...saltadas].join(", ") || "ninguna"}`);
