#!/usr/bin/env node
/**
 * Convierte a TRAZADOS todo el texto de los iconos.
 *
 *   node vectorizar.mjs            reescribe los SVG con el texto en paths
 *   node vectorizar.mjs --ver      dice qué haría
 *
 * POR QUÉ, Y SON DOS RAZONES QUE APUNTAN AL MISMO SITIO.
 *
 * 1 · LA WEB ESTABA MINTIENDO. Un SVG cargado con <img> se renderiza en un
 *     documento AISLADO: no hereda el CSS de la página y **no puede descargar
 *     fuentes**. Nuestros iconos pedían "Barlow Condensed" y el navegador les
 *     daba Arial Narrow, que es más ancha — por eso frases como NO DORMIRÍA
 *     TRANQUILO aparecían cortadas por los lados en la botella y no en la hoja
 *     de contactos. El viewBox estaba bien medido; lo que cambiaba era la
 *     letra con la que se pintaba.
 *
 * 2 · LA SERIGRAFÍA LO EXIGE. Ningún taller acepta arte final con texto vivo:
 *     si la fuente no está instalada en su RIP, imprime otra cosa o no imprime.
 *     El texto vectorizado es requisito, no preferencia.
 *
 * A partir de aquí los SVG no dependen de ninguna fuente y se ven igual en
 * cualquier sitio: la web, la lámina del serigrafista y el correo del
 * ilustrador. El precio es que ya no se puede corregir una errata editando el
 * SVG — se corrige en el generador y se vuelve a vectorizar. Es el trato
 * normal en arte final.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ICONOS = join(AQUI, "..", "..", "web", "public", "iconos");
const FUENTES = join(AQUI, "fuentes");

const ver = process.argv.includes("--ver");

/** family+weight+style del SVG → el fichero que hay que cargar. */
const CARGA = {
  "barlow-700": "BarlowCondensed-Bold.ttf",
  "barlow-400": "BarlowCondensed-Regular.ttf",
  "bodoni-700": "BodoniModa.ttf",
  "bodoni-400": "BodoniModa.ttf",
  "bodoni-italic": "BodoniModa-Italic.ttf",
  // La ESTÁTICA, no la variable: opentype.js no instancia ejes fvar y con la
  // variable vectoriza el máster por defecto (Regular). «Ecologetas» salió
  // fina en la botella por esto — pedía un logotipo gordo y llegó UI text.
  "franklin-800": "LibreFranklin-ExtraBold.ttf",
  "plex-600": "IBMPlexMono-SemiBold.ttf",
  // El registro de ROTULISTA (24-sep). Comparada al lado de Barlow, Fjalla y
  // Big Shoulders sobre las palabras ancla, es la única con el trazo de
  // cartel de la referencia: astas con flare, formas apretadas, carácter de
  // letrero pintado. Barlow es limpia y moderna, que es justo lo que hacía
  // que nuestras palabras parecieran compuestas y las suyas dibujadas.
  "cartel": "Staatliches-Regular.ttf",
};

const fuentes = {};
for (const [clave, fichero] of Object.entries(CARGA)) {
  try {
    fuentes[clave] = opentype.parse(readFileSync(join(FUENTES, fichero)).buffer);
  } catch (e) {
    console.error(`No pude cargar ${fichero}: ${e.message}`);
    process.exit(1);
  }
}

/** Qué fuente toca según los atributos del <text>. */
function eligeFuente(attrs) {
  const fam = (attrs["font-family"] || "").toLowerCase();
  const peso = String(attrs["font-weight"] || "400");
  const italica = (attrs["font-style"] || "") === "italic";
  let clave;
  if (fam.includes("bodoni")) clave = italica ? "bodoni-italic" : peso === "700" ? "bodoni-700" : "bodoni-400";
  else if (fam.includes("franklin")) clave = "franklin-800";
  else if (fam.includes("plex")) clave = "plex-600";
  else if (fam.includes("staatliches")) clave = "cartel";
  else clave = peso === "700" ? "barlow-700" : "barlow-400";
  const f = fuentes[clave];
  if (!f) {
    console.error(`Sin fuente para family="${fam}" weight=${peso} italic=${italica} → clave ${clave}`);
    process.exit(1);
  }
  return f;
}

function atributos(etiqueta) {
  const out = {};
  for (const m of etiqueta.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

/**
 * El tracking (`letter-spacing`) hay que aplicarlo a mano: opentype coloca los
 * glifos con el avance de la fuente y no sabe nada del atributo SVG.
 */
function trazaTexto(texto, fuente, tam, x, y, anclaje, tracking) {
  // El TRACKING se aplica aquí, desplazando cada glifo, y NO con la opción
  // `letterSpacing` de opentype: esa opción produce coordenadas NaN en algunos
  // glifos —«CABALGAR» salía «CABALG R» con la A convertida en un palito— y un
  // NaN dentro de un atributo `d` invalida el resto del trazado sin dar ningún
  // error. Se pide el texto sin espaciado (así conserva el KERNING de la
  // fuente) y luego cada letra se mueve lo suyo.
  const anchoBase = fuente.getAdvanceWidth(texto, tam);
  const glifos = fuente.stringToGlyphs(texto);
  const extra = Math.max(0, glifos.length - 1) * tracking;

  let inicio = x;
  if (anclaje === "middle") inicio -= (anchoBase + extra) / 2;
  else if (anclaje === "end") inicio -= anchoBase + extra;

  return fuente
    .getPaths(texto, inicio, y, tam)
    .map((p, i) => ({ d: serializa(p), dx: i * tracking }))
    .filter((t) => t.d);
}

/**
 * Convierte los comandos de un Path de opentype en un atributo `d`.
 *
 * Se escribe a mano en vez de usar `path.toPathData()` porque ese serializador
 * mete literales `NaN` en la cadena aunque los comandos de origen sean
 * numéricos y correctos (comprobado: 0 comandos con NaN, salida con NaN). Un
 * NaN dentro de `d` no da error: el navegador pinta hasta ahí y descarta el
 * resto, así que la letra se queda a medias sin que nada avise.
 */
function serializa(path) {
  const n = (v) => {
    if (!Number.isFinite(v)) throw new Error(`coordenada no finita: ${v}`);
    return Number(v.toFixed(3)).toString();
  };
  const out = [];
  for (const c of path.commands) {
    if (c.type === "M") out.push(`M${n(c.x)} ${n(c.y)}`);
    else if (c.type === "L") out.push(`L${n(c.x)} ${n(c.y)}`);
    else if (c.type === "C") out.push(`C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`);
    else if (c.type === "Q") out.push(`Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`);
    else if (c.type === "Z") out.push("Z");
  }
  return out.join("");
}

let tocados = 0,
  textos = 0;

for (const nombre of readdirSync(ICONOS).filter((f) => f.endsWith(".svg"))) {
  const ruta = join(ICONOS, nombre);
  let svg = readFileSync(ruta, "utf8");
  if (!svg.includes("<text")) continue;

  const nuevo = svg.replace(
    /<text\s([^>]*)>([^<]*)<\/text>/g,
    (todo, crudo, contenido) => {
      const a = atributos(`<x ${crudo}>`);
      const fuente = eligeFuente(a);
      const tam = parseFloat(a["font-size"] || "16");
      const x = parseFloat(a.x || "0");
      const y = parseFloat(a.y || "0");
      const tracking = parseFloat(a["letter-spacing"] || "0");
      const trozos = trazaTexto(
        contenido,
        fuente,
        tam,
        x,
        y,
        a["text-anchor"] || "start",
        tracking,
      );
      textos++;
      // Se conservan TODOS los atributos de pintura, no solo el relleno: las
      // piezas «huecas» son fill="none" + stroke, y si se pierde el trazo el
      // path queda invisible — otra forma de salir en blanco sin fallar.
      // `class` viaja también: es el marcador de gobierno del grosor
      // (`talla`, `engorde`) que normalizar-trazo.py lee para saber si un
      // trazo se fija, se respeta o se sube al mínimo. Al perderse, la talla
      // de las cajas caladas se inflaba al mínimo de texto y FACHA salía
      // soldada en un bloque ilegible.
      const pintura = ["class", "fill", "stroke", "stroke-width", "stroke-linejoin", "opacity"]
        .filter((k) => a[k] !== undefined)
        .map((k) => ` ${k}="${a[k]}"`)
        .join("");
      for (const t of trozos) {
        // Un NaN en el `d` no da error: el navegador dibuja hasta ahí y
        // descarta el resto en silencio. Se detiene el proceso.
        if (t.d.includes("NaN")) {
          console.error(`\n⛔ ${nombre}: trazado con NaN en "${contenido}".`);
          process.exit(1);
        }
      }
      return trozos
        .map((t) =>
          t.dx
            ? `<path${pintura} transform="translate(${t.dx.toFixed(3)} 0)" d="${t.d}"/>`
            : `<path${pintura} d="${t.d}"/>`,
        )
        .join("");
    },
  );

  if (nuevo !== svg) {
    tocados++;
    if (!ver) writeFileSync(ruta, nuevo);
    console.log(`  ${ver ? "(vería)" : "✓"} ${nombre}`);
  }
}

console.log(`\n${tocados} iconos con el texto vectorizado · ${textos} bloques de texto`);
console.log("Los SVG ya no dependen de ninguna fuente instalada.");
