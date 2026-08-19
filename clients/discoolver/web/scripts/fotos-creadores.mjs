/**
 * Normaliza las fotos de perfil de los creadores y las deja listas para la web.
 *
 *   node scripts/fotos-creadores.mjs fotos.json            ← lo normal
 *   node scripts/fotos-creadores.mjs ~/Desktop/fotos       ← si las tienes ya
 *
 * Con un **fotos.json** (el que deja `scripts/urls-fotos-instagram.js` en el
 * portapapeles: `{ "arroba": "https://…" }`) se descargan y se normalizan las
 * 47 de una vez.
 *
 * Con una **carpeta**, espera un fichero por creador llamado como su ARROBA,
 * en cualquier formato y tamaño: `cenandoconpablo.jpg`, `travisleon1.png`…
 * Deja en `public/assets/creadores/{arroba}.jpg` un cuadrado de 224 px, que es
 * el doble del tamaño al que se pinta el avatar.
 *
 * Después imprime las líneas de `foto:` que hay que pegar en lib/creators.ts —
 * la ruta no se rellena sola a propósito: que un fichero exista en el disco no
 * significa que haya permiso para publicar esa cara.
 *
 * POR QUÉ HACE FALTA EL PASO DEL NAVEGADOR. Comprobado el 19-ago-2026: sin
 * sesión, el perfil sirve muro de login y ya no lleva `og:image`, la API
 * `web_profile_info` responde `status: fail` y unavatar.io pide plan de pago
 * para Instagram. Con una sesión humana delante, esa misma API contesta — por
 * eso las URL las saca el snippet y la descarga la hace este script.
 */
import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const ejecutar = promisify(execFile);
const ORIGEN = process.argv[2];
const DESTINO = "public/assets/creadores";
const LADO = 224;

if (!ORIGEN || !existsSync(ORIGEN)) {
  console.error("Uso: node scripts/fotos-creadores.mjs <fotos.json | carpeta con las fotos>");
  process.exit(1);
}

await mkdir(DESTINO, { recursive: true });

/** Deja cada imagen en un fichero temporal y devuelve [arroba, ruta]. */
async function reunirEntradas() {
  if (ORIGEN.endsWith(".json")) {
    const urls = JSON.parse(await readFile(ORIGEN, "utf8"));
    const entradas = [];
    for (const [handle, url] of Object.entries(urls)) {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`✗ ${handle} — ${res.status}`);
        continue;
      }
      // Las URL del CDN de Instagram van firmadas y caducan: hay que bajarlas
      // ya, no guardarlas para luego.
      const tmp = path.join(DESTINO, `_tmp-${handle}`);
      await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
      entradas.push([handle.toLowerCase(), tmp]);
    }
    return entradas;
  }
  const ficheros = (await readdir(ORIGEN)).filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f));
  return ficheros.map((f) => [
    path.parse(f).name.replace(/^@/, "").toLowerCase(),
    path.join(ORIGEN, f),
  ]);
}

const entradas = await reunirEntradas();
if (!entradas.length) {
  console.error(`No hay imágenes en ${ORIGEN}`);
  process.exit(1);
}

const hechos = [];
for (const [handle, entrada] of entradas) {
  const salida = path.join(DESTINO, `${handle}.jpg`);
  // sips viene con macOS: recorta al cuadrado por el centro y reescala.
  await ejecutar("sips", [
    "-s", "format", "jpeg",
    "-s", "formatOptions", "82",
    "-Z", String(LADO * 2),
    entrada,
    "--out", salida,
  ]);
  await ejecutar("sips", ["-c", String(LADO), String(LADO), salida]);
  if (path.basename(entrada).startsWith("_tmp-")) await ejecutar("rm", ["-f", entrada]);
  hechos.push(handle);
  console.log(`✅ ${handle}`);
}

console.log(`\n${hechos.length} foto(s) en ${DESTINO}\n`);
console.log("Pega estas líneas en el creador que corresponda de lib/creators.ts:\n");
for (const h of hechos) console.log(`    foto: "/assets/creadores/${h}.jpg",   // @${h}`);
