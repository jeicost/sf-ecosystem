#!/usr/bin/env node
/**
 * Fábrica de iconos, pieza a pieza.
 *
 *   node icono.mjs --n 1                 genera (Mystic, 2k) → descarga → vectoriza
 *   node icono.mjs --n 1 --pulir 1       escala la variante 1 con Magnific y re-vectoriza
 *   node icono.mjs --lista               estado de la cola
 *
 * El flujo es deliberadamente de UNA pieza por vez: cada resultado se mira
 * antes de pasar a la siguiente, que es como se mantiene la consistencia
 * óptica entre 30 iconos — el lote entero de golpe produce 30 estilos.
 *
 * La API es la de Magnific/Freepik (misma clave, dos hosts). La URL del
 * resultado va firmada y CADUCA: se descarga en el momento, nunca se guarda.
 * El SVG sale de potrace en blanco-sobre-transparente, listo para maquetar
 * sobre el ámbar; NO es arte final de serigrafía — eso lo cierra el
 * ilustrador — pero sí sirve para la web y para validar la retícula.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import potrace from "potrace";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CLAVE = process.env.MAGNIFIC_API_KEY || process.env.FREEPIK_API_KEY;
if (!CLAVE) { console.error("Falta MAGNIFIC_API_KEY en el entorno"); process.exit(1); }

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? (args[i+1] ?? true) : null; };

const datos = JSON.parse(readFileSync(join(AQUI, "cola.json"), "utf8"));

if (flag("lista")) {
  for (const p of datos.cola) console.log(`${String(p.n).padStart(2)} ${p.estado.padEnd(10)} ${p.pieza}`);
  process.exit(0);
}

const n = Number(flag("n"));
const pieza = datos.cola.find((p) => p.n === n);
if (!pieza) { console.error(`No hay pieza nº ${n}`); process.exit(1); }
const carpeta = join(AQUI, `${String(n).padStart(2, "0")}-${pieza.slug}`);
mkdirSync(carpeta, { recursive: true });

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function tarea(host, ruta, cuerpo) {
  const res = await fetch(`${host}${ruta}`, {
    method: "POST",
    headers: { "x-magnific-api-key": CLAVE, "content-type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!res.ok) throw new Error(`${ruta} → ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const { data } = await res.json();
  process.stdout.write(`  tarea ${data.task_id} `);
  for (let i = 0; i < 50; i++) {
    await espera(4000);
    const est = await fetch(`${host}${ruta}/${data.task_id}`, { headers: { "x-magnific-api-key": CLAVE } });
    const json = (await est.json()).data;
    process.stdout.write(".");
    if (json.status === "COMPLETED") { console.log(" ✓"); return json.generated ?? []; }
    if (json.status === "FAILED") throw new Error("la tarea falló");
  }
  throw new Error("agotada la espera");
}

async function descarga(url, destino) {
  const res = await fetch(url);
  writeFileSync(destino, Buffer.from(await res.arrayBuffer()));
}

/** Blanco sobre transparente: el color de la tinta cerámica, sin fondo. */
function vectoriza(png, svg) {
  return new Promise((res, rej) =>
    potrace.trace(png, { blackOnWhite: false, threshold: 120, turdSize: 4, color: "#F6F1E6" },
      (err, out) => (err ? rej(err) : (writeFileSync(svg, out), res()))),
  );
}

const pulir = flag("pulir");
if (pulir) {
  const origen = join(carpeta, `gen-${pulir}.png`);
  if (!existsSync(origen)) { console.error(`No existe ${origen}`); process.exit(1); }
  console.log(`Puliendo con Magnific: ${pieza.pieza} (variante ${pulir})`);
  const urls = await tarea("https://api.freepik.com/v1", "/ai/image-upscaler", {
    image: readFileSync(origen).toString("base64"),
    scale_factor: "2x", creativity: 1, hdr: 3, sharpen: 3,
    prompt: "clean flat vector pictogram, solid white on black, crisp edges",
  });
  await descarga(urls[0], join(carpeta, "pulido.png"));
  await vectoriza(join(carpeta, "pulido.png"), join(carpeta, "pulido.svg"));
  console.log(`→ ${carpeta}/pulido.png + pulido.svg`);
} else {
  console.log(`Generando: ${String(n).padStart(2, "0")} · ${pieza.pieza}`);
  /**
   * El registro de la referencia (El Xitxarel·lo): no es icono de sistema, es
   * serigrafía con encanto de sello impreso a mano — formas rotundas, esquinas
   * levemente redondeadas, mezcla de silueta maciza y detalle de trazo grueso.
   * Va como sufijo para aplicarse a TODAS las piezas por igual: la coherencia
   * entre iconos importa más que la perfección de uno.
   */
  const ESTILO_XITXARELLO =
    ", in the style of hand-printed screen printing sticker art for a wine bottle: " +
    "playful chunky simplified shapes with slightly rounded corners, completely " +
    "FLAT 2D like a screen-printed sticker, zero texture, zero hatching, zero " +
    "stippling, zero engraving, no linework shading. STRICTLY monochrome: pure white #FFFFFF shapes on a pure " +
    "black background, one single ink, no red, no cream, no beige, no second color, " +
    "no frame, no border, no background texture, flat with zero shading, and never " +
    "any human face or facial features. The lettering must be crisp, perfectly " +
    "spelled, bold condensed uppercase sans-serif like wood type poster lettering, " +
    "text and pictogram composed together as one unit";
  const urls = await tarea("https://api.magnific.com/v1", "/ai/mystic", {
    prompt: pieza.prompt + ESTILO_XITXARELLO,
    resolution: "2k", aspect_ratio: "square_1_1", model: "realism",
  });
  for (let i = 0; i < urls.length; i++) {
    await descarga(urls[i], join(carpeta, `gen-${i + 1}.png`));
    await vectoriza(join(carpeta, `gen-${i + 1}.png`), join(carpeta, `gen-${i + 1}.svg`));
  }
  pieza.estado = "generado";
  writeFileSync(join(AQUI, "cola.json"), JSON.stringify(datos, null, 2));
  console.log(`→ ${urls.length} variante(s) en ${carpeta} (png + svg)`);
}
