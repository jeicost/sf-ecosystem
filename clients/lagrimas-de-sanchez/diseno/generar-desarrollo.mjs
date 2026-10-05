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
// A TODA la altura del cilindro y con la proporción real del arte (0,15),
// como en la botella: si el carril tuviera otra forma, `object-contain`
// dejaría medio carril vacío y el instrumento no ordenaría nada.
const ALTO_54 = H_CUERPO - 12*MM;
const COL54  = { x: 247*MM - (ALTO_54*0.15)/2, y: H_HOMBRO + 6*MM, w: ALTO_54*0.15, h: ALTO_54 };
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
 * El SUELO de cada pieza: la altura impresa mínima a la que deja de romperse,
 * medida por `iconos/medir-suelo.py`.
 *
 * El RITMO da contraste de escala pero es CIEGO: reparte alto por posición de
 * fila, no por lo que la pieza aguanta. El 5 de octubre arreglar dos piezas de
 * texto recolocó el tejido y tumbó otras tres sin que nadie tocara su dibujo
 * —`15-felpudo` perdió las cerdas, `11-la-cajera` y `55-pucherazo` cayeron de
 * 13,5 a 9 mm—, y la medición enseñó lo de fondo: **ninguna de las 66 piezas
 * está rota por dibujo; todas imprimen a alguna altura**. Lo que estaba roto
 * era el reparto.
 *
 * Así que el reparto pregunta antes de colocar. Una pieza que no cabe en la
 * fila que le toca espera a una más alta en vez de imprimirse muerta.
 */
const SUELO = JSON.parse(readFileSync(join(AQUI, "suelo-piezas.json"), "utf8"));

/**
 * Qué se lleva el HOMBRO, por NOMBRE y no por posición en la cola.
 *
 * El cono se cierra al subir: ahí las piezas imprimen a 5-7 mm. Una frase de
 * tres líneas a 5,1 mm tiene renglones de 1,7 mm y no se lee ni existe —
 * pasó con «AL MENOS NO GOBIERNA LA ULTRADERECHA» y «EL PUEBLO PRIMERO»,
 * que cayeron ahí por ser de las primeras de la cola. Al hombro solo suben
 * pictogramas y palabras de UNA línea.
 */
const HOMBRO_PIEZAS = [26, 35, "r-estrella", 3, 34, "r-puntos", 10, 12, 4, 39, "r-cruz", 37];

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
const _cacheArte = new Map();
const arteDeId = (id) => {
  if (!_cacheArte.has(id)) {
    _cacheArte.set(id, typeof id === "string" ? arteRemate(id) : arteDe(id));
  }
  return _cacheArte.get(id);
};
const pesoDe = (id) => (typeof id === "string" ? 0.5 : 1);
const slugDe = (id) => (typeof id === "string" ? id : mapa[id]);
/** ¿Aguanta esta pieza el alto de esta fila? (los remates van a medio peso) */
const cabeEn = (id, altoPx) => {
  const s = SUELO[slugDe(id)];
  return !s || (altoPx * pesoDe(id)) / MM >= s;
};

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
        i++;
        suma += (a.w / a.h) * pesoDe(id);
        mias.push({ id, a });
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
      const suma = suyas.reduce((s, m) => s + (m.a.w / m.a.h) * pesoDe(m.id), 0);
      // ⚠️ El alto de fila va acotado por abajo (alto*0.55) para que el ritmo
      // no se desfonde, y cuando las piezas de la fila son MUY apaisadas ese
      // suelo deja el ancho necesario por encima del tramo. Antes se repartía
      // igualmente y el hueco salía NEGATIVO: las piezas se montaban unas
      // sobre otras —«rufián», «NO DORMIRÍA TRANQUILO» y «SON LAS 5» salieron
      // apiladas en el mismo sitio y la última recortada a «ON LAS»—. Solapar
      // no es una opción: antes de eso, la fila encoge.
      const altoCabe = (tb - ta - 4 * (suyas.length - 1)) / suma;
      const altoT = Math.min(altoFila, altoCabe);
      const anchos = suyas.map((m) => (m.a.w / m.a.h) * pesoDe(m.id) * altoT);
      const usado = anchos.reduce((a, b) => a + b, 0);
      const suelta = !suyas[0].lleno;
      const hueco = suelta || suyas.length < 2
        ? 15
        : Math.max(4, (tb - ta - usado) / (suyas.length - 1));
      const ocupa = usado + hueco * (suyas.length - 1);
      let x = suelta || suyas.length < 2 ? ta + (tb - ta - ocupa) / 2 : ta;
      suyas.forEach((m, k) => {
        const h = altoT * pesoDe(m.id);
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
const hombro = [];
{
  let y = 52 * MM, i = 0, fila = 0;
  // Filas un punto más altas (9 mm de base): a 7,2 las piezas del cono
  // quedaban en 5 mm y ahí no aguanta ni una palabra corta.
  const anchos = [54, 64, 74, 84, 94, 104].map((m) => m * MM);
  while (i < HOMBRO_PIEZAS.length && fila < anchos.length) {
    const alto = 9 * MM * RITMO[fila % RITMO.length];
    const util = anchos[fila];
    let suma = 0;
    const mias = [];
    while (i < HOMBRO_PIEZAS.length) {
      const id = HOMBRO_PIEZAS[i];
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
      hombro.push({ id: m.id, h: hh });
      colocadas++;
      x += ws[k] + hueco;
    });
    y += h + 1.5 * MM;
    fila++;
  }
}

// El cuerpo se lleva todo lo que no subió al hombro.
const COLA_CUERPO = COLA.filter((id) => !HOMBRO_PIEZAS.includes(id));
const Y_INI = H_HOMBRO + 4 * MM, Y_FIN = H - 6 * MM;
let ideal = 13 * MM;
/** Cuántas piezas quedan por debajo de su suelo medido. */
const porDebajo = (ps) =>
  ps.filter((p) => { const s = SUELO[slugDe(p.id)]; return s && p.h / MM < s - 0.05; });

/**
 * Intercambia piezas de la cola hasta que ninguna caiga por debajo de su suelo.
 *
 * El RITMO da el contraste de escala que hace que el tejido no parezca una
 * tabla, pero reparte por POSICIÓN DE FILA y no sabe qué pieza aguanta qué
 * tamaño. Poner una puerta dentro del empaquetador no vale: ahí solo se
 * conoce el alto NOMINAL de la fila, y la justificada acaba siendo bastante
 * mayor, así que la puerta aplazaba piezas que sí cabían y se amontonaban al
 * final. Con las alturas YA REPARTIDAS sí se sabe quién sufre y quién tiene
 * holgura, y entonces es un cambio de sitio entre dos.
 *
 * Se intercambian solo piezas de PROPORCIÓN parecida: el ancho de cada una
 * sale de su proporción por el alto de su fila, así que cambiar una apaisada
 * por una vertical rehace la fila entera y mueve el tejido que ya está dado
 * por bueno.
 */
function repartirPorSuelo(cola, yIni, yFin, ideal) {
  let mejor = cola.slice();
  let puestas = empaquetar(mejor, yIni, yFin, ideal);
  let falla = porDebajo(puestas).length;
  for (let pase = 0; pase < 8 && falla > 0; pase++) {
    const antes = falla;
    for (const c of porDebajo(puestas)) {
      const sc = SUELO[slugDe(c.id)];
      const pc = c.a.w / c.a.h;
      const candidatas = puestas
        .filter((o) => {
          if (o.id === c.id) return false;
          const so = SUELO[slugDe(o.id)] || 0;
          // El otro tiene que caber donde está la que sufre, y al revés.
          return o.h / MM >= sc && c.h / MM >= so
            && Math.abs((o.a.w / o.a.h) / pc - 1) < 0.4;
        })
        .sort((a, b) => Math.abs(a.a.w / a.a.h - pc) - Math.abs(b.a.w / b.a.h - pc));
      for (const o of candidatas) {
        const prueba = mejor.slice();
        const ic = prueba.indexOf(c.id), io = prueba.indexOf(o.id);
        if (ic < 0 || io < 0) continue;
        prueba[ic] = o.id; prueba[io] = c.id;
        const pp = empaquetar(prueba, yIni, yFin, ideal);
        const ff = porDebajo(pp).length;
        if (ff < falla) { mejor = prueba; puestas = pp; falla = ff; break; }
      }
    }
    if (falla === antes) break;   // no hay más cambios que mejoren
  }
  return { cola: mejor, puestas, falla };
}

let puestas = empaquetar(COLA_CUERPO, Y_INI, Y_FIN, ideal);
for (let k = 0; k < 4; k++) {
  const fondo = puestas.reduce((m, p) => Math.max(m, p.y + p.h), Y_INI);
  const f = (Y_FIN - Y_INI) / (fondo - Y_INI);
  if (Math.abs(f - 1) < 0.02) break;
  ideal = ideal * Math.sqrt(f);
  puestas = empaquetar(COLA_CUERPO, Y_INI, Y_FIN, ideal);
}
{
  // Tres cosas que cumplir, por orden: que ENTREN TODAS, que ninguna baje de
  // su suelo, y que el tejido llene la banda. Las dos primeras mandan: una
  // pieza fuera es una pieza que no se imprime, y el autoajuste solo mira la
  // tercera. Si falta alguna se aprieta el alto ideal y se vuelve a repartir.
  let r = repartirPorSuelo(COLA_CUERPO, Y_INI, Y_FIN, ideal);
  for (let k = 0; k < 8 && r.puestas.length < COLA_CUERPO.length; k++) {
    ideal *= 0.97;
    r = repartirPorSuelo(COLA_CUERPO, Y_INI, Y_FIN, ideal);
  }
  if (r.puestas.length < COLA_CUERPO.length) {
    console.log(`  ⚠️  ${COLA_CUERPO.length - r.puestas.length} pieza(s) siguen sin entrar tras apretar el alto`);
  }
  puestas = r.puestas;
  const cortas = porDebajo(puestas);
  if (cortas.length) {
    console.log(`  ⚠️  ${cortas.length} pieza(s) por debajo de su suelo medido:`);
    for (const p of cortas.sort((a, b) => (SUELO[slugDe(b.id)] - b.h / MM) - (SUELO[slugDe(a.id)] - a.h / MM))) {
      console.log(`       ${slugDe(p.id).padEnd(38)} ${(p.h / MM).toFixed(1)} mm · necesita ${SUELO[slugDe(p.id)]}`);
    }
  } else {
    console.log("  ✓ ninguna pieza por debajo de su suelo medido");
  }
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
 * Las alturas REALES a las que se imprime cada pieza, en milímetros.
 *
 * Antes vivían en una tabla de bandas que había que mantener a mano y que
 * mentía en cuanto el empaquetador cambiaba algo. Ahora las escribe quien
 * las decide —este generador— y las leen `normalizar-trazo.py`,
 * `verificar-arte.py` y `medir-imprimibilidad.py`: una sola verdad, medida.
 */
const alturas = {};
for (const p of [...puestas, ...hombro]) {
  const slug = typeof p.id === "string" ? p.id : mapa[p.id];
  if (!slug) continue;
  alturas[slug] = Math.round((p.h / MM) * 100) / 100;
}
alturas[mapa[54]] = Math.round((COL54.h / MM) * 100) / 100;
writeFileSync(join(AQUI, "alturas-impresion.json"), JSON.stringify(alturas, null, 2) + "\n");

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

// ⚠️ Que dos piezas no se pisen tampoco se ve en la lámina a ojo: salen
// superpuestas, la de abajo asoma por los lados y parece textura. Pasó al
// ensanchar varias piezas —«rufián», «NO DORMIRÍA TRANQUILO» y «SON LAS 5»
// apiladas en el mismo hueco— y solo se vio recortando el PNG al 400 %.
{
  const caja = (p) => [p.x, p.y, p.x + p.w, p.y + p.h];
  const todas = [...puestas, ...hombro.filter((p) => p.x !== undefined)];
  const choques = [];
  for (let i = 0; i < todas.length; i++) {
    for (let j = i + 1; j < todas.length; j++) {
      const [ax0, ay0, ax1, ay1] = caja(todas[i]);
      const [bx0, by0, bx1, by1] = caja(todas[j]);
      // 1 unidad de tolerancia: los remates se tocan a propósito.
      const solapeX = Math.min(ax1, bx1) - Math.max(ax0, bx0);
      const solapeY = Math.min(ay1, by1) - Math.max(ay0, by0);
      if (solapeX > 1 && solapeY > 1) {
        choques.push(`${slugDe(todas[i].id)} ↔ ${slugDe(todas[j].id)} `
          + `(${solapeX.toFixed(0)}×${solapeY.toFixed(0)} u)`);
      }
    }
  }
  if (choques.length) {
    console.error(`\n⛔ ${choques.length} par(es) de piezas se pisan:`);
    for (const c of choques.slice(0, 8)) console.error("   · " + c);
    process.exit(1);
  }
}

// ⚠️ Que el arte EXISTA no es que se haya COLOCADO. El empaquetador corta
// cuando se le acaba el alto, así que una pieza puede quedarse fuera y la
// lámina sale entera, bonita y sin ella — y es la lámina que recibe el
// taller. Al añadir el reparto por suelo pasó: la cuenta bajó de 68 a 67 y
// solo se vio porque alguien miró el número. Ahora se comprueba pieza a
// pieza y se para.
{
  const esperadas = new Set([...COLA, ...HOMBRO_PIEZAS, 54].map(slugDe).filter(Boolean));
  const dentro = new Set([...puestas.map((p) => p.id), ...hombro.map((p) => p.id), 54]
    .map(slugDe).filter(Boolean));
  const fuera = [...esperadas].filter((s) => !dentro.has(s));
  if (fuera.length) {
    console.error(`\n⛔ ${fuera.length} pieza(s) NO han entrado en el desarrollo:`);
    for (const s of fuera) console.error("   · " + s);
    console.error("   El taller recibiría un arte incompleto. Se para.");
    process.exit(1);
  }
}

console.log(`${colocadas} piezas colocadas · sin arte aún: ${[...saltadas].join(", ") || "ninguna"}`);
