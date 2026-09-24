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
/** La franja del hombro que se dibuja encima, indicativa. Creció de 62 a
 * 100 mm para alojar, además del lockup, las SEIS FILAS del hombro que la
 * botella de la web ya lleva: antes esas piezas se recolocaban dentro del
 * cilindro y los dos soportes contaban composiciones distintas — el taller
 * no tenía arte del cono. */
const H_HOMBRO = 100 * MM;
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
const COL54  = { x: 236*MM, y: H_HOMBRO + 26*MM, w: 42*MM, h: 84*MM };
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
/**
 * LA COLA COMPLETA: las 57 piezas más los remates.
 *
 * Aquí van TODAS, y en la web solo la cara frontal (~40 % del perímetro, que
 * es lo que un cilindro deja ver de una vez). Es la misma diferencia que hay
 * entre una foto de la botella y su desarrollo: el taller necesita la vuelta
 * entera, el comprador ve un tercio. Los dos empaquetan igual — filas
 * justificadas de canto a canto con el mismo ritmo de alturas — para que la
 * mancha sea reconocible de un soporte a otro.
 */
const COLA = [
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
const RITMO = [1.28, 0.84, 1.06, 0.78, 1.34, 0.9, 1.15, 0.8, 1.22, 0.93];

/**
 * Cuántas piezas se lleva el HOMBRO. La cola es una sola y se parte aquí: si
 * el hombro tuviera su propia tabla, las mismas piezas saldrían dos veces en
 * la lámina (pasó: FACHA, FANGO y BULOS aparecían arriba y abajo).
 */
const PIEZAS_HOMBRO = 12;

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
  + `HOMBRO CÓNICO · desarrollo real = sector</text>`
  + `<text x="8" y="${H_HOMBRO + 14}" fill="#9FB07A" font-family="monospace" font-size="9" letter-spacing="1">`
  + `CUERPO CILÍNDRICO · 330 × 140 mm · 360° · la única zona recta</text>`;

const arteRemate = (slug) => {
  const f = join(WEB, "public/iconos", slug + ".svg");
  if (!existsSync(f)) return null;
  const t = readFileSync(f, "utf8");
  const vb = t.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!vb) return null;
  return { x: +vb[1], y: +vb[2], w: +vb[3], h: +vb[4], cuerpo: t.replace(/<\/?svg[^>]*>/g, "") };
};
const arteDeId = (id) => (typeof id === "string" ? arteRemate(id) : arteDe(id));
const pesoDe = (id) => (typeof id === "string" ? 0.5 : 1);

/** Empaqueta la cola en filas justificadas dentro del cilindro. */
function empaquetar(cola, yIni, yFin, altoIdeal) {
  const piezas = [];
  let i = 0, y = yIni, fila = 0;
  while (i < cola.length && y < yFin) {
    const alto = altoIdeal * RITMO[fila % RITMO.length];
    fila++;
    const libres = segmentos(y, alto);
    if (!libres.length) { y += alto + 2; continue; }
    let altoFila = alto;
    const enFila = [];
    for (let t = 0; t < libres.length && i < cola.length; t++) {
      const [ta, tb] = libres[t];
      const util = tb - ta;
      let suma = 0, lleno = false;
      const mias = [];
      while (i < cola.length) {
        const id = cola[i];
        const a = arteDeId(id);
        if (!a) { i++; continue; }
        suma += (a.w / a.h) * pesoDe(id);
        mias.push({ id, a });
        i++;
        if ((util - 6 * (mias.length - 1)) / suma <= alto) { lleno = true; break; }
      }
      // Fila incompleta: NO se justifica (si no, la última pieza sale de cartel).
      const h = lleno ? (util - 6 * (mias.length - 1)) / suma : alto;
      altoFila = Math.min(altoFila, Math.max(alto * 0.55, Math.min(alto * 1.9, h)));
      mias.forEach((m) => enFila.push({ ...m, tramo: t, lleno }));
    }
    for (let t = 0; t < libres.length; t++) {
      const suyas = enFila.filter((m) => m.tramo === t);
      if (!suyas.length) continue;
      const [ta, tb] = libres[t];
      const anchos = suyas.map((m) => (m.a.w / m.a.h) * pesoDe(m.id) * altoFila);
      const usado = anchos.reduce((a, b) => a + b, 0);
      const suelta = !suyas[0].lleno;
      const hueco = suelta || suyas.length < 2 ? 15 : (tb - ta - usado) / (suyas.length - 1);
      const ocupa = usado + hueco * (suyas.length - 1);
      let x = suelta || suyas.length < 2 ? ta + (tb - ta - ocupa) / 2 : ta;
      suyas.forEach((m, k) => {
        const h = altoFila * pesoDe(m.id);
        piezas.push({ ...m, x, y: y + (altoFila - h) / 2, w: anchos[k], h });
        x += anchos[k] + hueco;
      });
    }
    y += altoFila + 2 * MM;
  }
  return piezas;
}

// ── El HOMBRO: la cabecera de la cola, en filas centradas que se ensanchan
// con el cono. Sin justificar a los cantos: ahí el perímetro se cierra.
{
  let y = 56 * MM, i = 0, fila = 0;
  const anchos = [52, 62, 72, 82, 92, 102].map((m) => m * MM);
  while (i < PIEZAS_HOMBRO && fila < anchos.length) {
    const alto = 7.2 * MM * RITMO[fila % RITMO.length];
    const util = anchos[fila];
    let suma = 0;
    const mias = [];
    while (i < PIEZAS_HOMBRO) {
      const id = COLA[i];
      const a = arteDeId(id);
      if (!a) { i++; continue; }
      suma += (a.w / a.h) * pesoDe(id);
      mias.push({ id, a });
      i++;
      if ((util - 5 * (mias.length - 1)) / suma <= alto) break;
    }
    const h = Math.min(alto * 1.5, (util - 5 * (mias.length - 1)) / suma);
    const ws = mias.map((m) => (m.a.w / m.a.h) * pesoDe(m.id) * h);
    const usado = ws.reduce((a, b) => a + b, 0);
    const hueco = mias.length > 1 ? (util - usado) / (mias.length - 1) : 0;
    let x = W / 2 - util / 2;
    mias.forEach((m, k) => {
      const hh = h * pesoDe(m.id);
      const kk = hh / m.a.h;
      out += `<g transform="translate(${x.toFixed(1)} ${(y + (h - hh) / 2).toFixed(1)}) `
           + `scale(${kk.toFixed(4)}) translate(${-m.a.x} ${-m.a.y})" fill="#F6F1E6">${m.a.cuerpo}</g>`;
      colocadas++;
      x += ws[k] + hueco;
    });
    y += h + 1.5 * MM;
    fila++;
  }
}

const COLA_CUERPO = COLA.slice(PIEZAS_HOMBRO);
const Y_INI = H_HOMBRO + 4 * MM, Y_FIN = H - 6 * MM;
let ideal = 13 * MM;
let puestas = empaquetar(COLA_CUERPO, Y_INI, Y_FIN, ideal);
for (let k = 0; k < 4; k++) {
  const fondo = puestas.reduce((m, p) => Math.max(m, p.y + p.h), Y_INI);
  const f = (Y_FIN - Y_INI) / (fondo - Y_INI);
  if (Math.abs(f - 1) < 0.02) break;
  ideal = ideal * Math.sqrt(f);
  puestas = empaquetar(COLA_CUERPO, Y_INI, Y_FIN, ideal);
}
for (const p of puestas) {
  const k = p.h / p.a.h;
  out += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) `
       + `scale(${k.toFixed(4)}) translate(${-p.a.x} ${-p.a.y})" fill="#F6F1E6">${p.a.cuerpo}</g>`;
  colocadas++;
}
COLA.forEach((id) => { if (typeof id === "number" && !arteDe(id)) saltadas.add(nombreDe[id] || id); });

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
