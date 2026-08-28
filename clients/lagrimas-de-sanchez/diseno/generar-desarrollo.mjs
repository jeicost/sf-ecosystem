#!/usr/bin/env node
/**
 * Genera el desarrollo plano: la banda de 275 × 195 mm con las piezas de arte
 * montadas, que es la lámina de referencia para ilustrador y serigrafista.
 *
 *   node generar-desarrollo.mjs
 *
 * OJO — esto es un MONTAJE DE REFERENCIA, no arte final. Una retícula compuesta
 * por máquina nunca iguala a una compuesta a mano: sirve para ver densidad,
 * reservas y peso óptico, y para que el ilustrador parta de algo. La
 * composición definitiva es trabajo suyo.
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

const MM = 4, W = 275 * MM, H = 195 * MM;
const HALO   = { x: 118*MM, y: 30*MM, w: 130*MM, h: 84*MM };
const CONTRA = { x: 8*MM,   y: 66*MM, w: 80*MM,  h: 54*MM };
const RESERVAS = [HALO, CONTRA];

/** [alto de banda mm, piezas]. Las bandas suman 195 mm con sus separaciones. */
// Suma exacta: 12 bandas (158 mm) + 11 separaciones de 2 mm + 5 de margen
// superior + 10 de margen inferior = 195 mm. Si se toca una altura hay que
// compensar en otra, o la última fila se sale del lienzo.
const BANDAS = [
  [12, [26, 30, 41, 17, 20]],
  [13, [35, 40, 24, 37, 29]],
  [18, [22, 34]],
  [13, [3, 51]],
  [14, [23, 12]],
  [11, [10, 36, 47]],
  [13, [2, 13]],
  [11, [50, 28, 46]],
  [15, [24, 1]],
  [11, [11, 45, 49]],
  [13, [16, 27]],
  [14, [21, 25, 31, 48, 53]],
];

const arteDe = (n) => {
  const slug = mapa[n];
  if (!slug) return null;
  const f = join(WEB, "public/iconos", slug + ".svg");
  if (!existsSync(f)) return null;
  const s = readFileSync(f, "utf8");
  const vb = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return { w: +vb[1], h: +vb[2], cuerpo: s.replace(/<\/?svg[^>]*>/g, "") };
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

let y = 5 * MM, colocadas = 0;
const saltadas = new Set();
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
  + `<defs><linearGradient id="v" x1="0" x2="1"><stop offset="0" stop-color="#3F2308"/>`
  + `<stop offset=".17" stop-color="#7A4A18"/><stop offset=".47" stop-color="#A0702E"/>`
  + `<stop offset=".79" stop-color="#7A4A18"/><stop offset="1" stop-color="#3F2308"/></linearGradient></defs>`
  + `<rect width="${W}" height="${H}" fill="url(#v)"/>`;

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
      out += `<g transform="translate(${x.toFixed(1)} ${(y + (alto - it.h) / 2).toFixed(1)}) `
           + `scale(${it.k.toFixed(4)})" fill="#F6F1E6">${it.a.cuerpo}</g>`;
      x += it.w + hueco; colocadas++;
    }
  });
  y += alto + 2 * MM;
}

out += `<g transform="translate(${HALO.x + HALO.w / 2} ${HALO.y + 30 * MM})" fill="#F6F1E6" text-anchor="middle">`
  + `<text y="0" font-size="42" font-family="Bodoni Moda, Georgia, serif">LÁGRIMAS</text>`
  + `<text y="27" font-size="24" letter-spacing="2.5" font-family="Bodoni Moda, Georgia, serif">DE SÁNCHEZ</text>`
  + `<rect x="-60" y="38" width="120" height="1.3"/>`
  + `<text y="56" font-size="9.5" letter-spacing="3.8" font-family="Barlow Condensed, sans-serif" font-weight="600">VINOS DE MADRID</text></g>`
  + `<rect x="${CONTRA.x}" y="${CONTRA.y}" width="${CONTRA.w}" height="${CONTRA.h}" fill="none" stroke="#E0685C" stroke-width="1.3" stroke-dasharray="6 5"/>`
  + `<text x="${CONTRA.x + CONTRA.w / 2}" y="${CONTRA.y + CONTRA.h / 2}" text-anchor="middle" fill="#FFD9D4" font-family="monospace" font-size="8.5" letter-spacing="1">CONTRAETIQUETA</text>`
  + `<text x="${CONTRA.x + CONTRA.w / 2}" y="${CONTRA.y + CONTRA.h / 2 + 13}" text-anchor="middle" fill="#FFD9D4" font-family="monospace" font-size="7">80 × 58 mm · solo vino</text>`
  + `<rect x="${HALO.x}" y="${HALO.y}" width="${HALO.w}" height="${HALO.h}" fill="none" stroke="#E0685C" stroke-width="1.1" stroke-dasharray="3 5"/>`
  + `<rect width="${W}" height="${H}" fill="none" stroke="#14100B" stroke-width="2"/></svg>`;

writeFileSync(join(AQUI, "desarrollo-plano.svg"), out);
console.log(`${colocadas} piezas colocadas · sin arte aún: ${[...saltadas].join(", ")}`);
