/**
 * Comprueba el copy visible contra las reglas de la casa.
 *
 *   node scripts/revisar-copy.mjs
 *
 * Existe porque estas reglas vivían en conversaciones y volvían solas: el
 * repaso del 19-ago-2026 encontró «curación humana», «vibra» y «edición
 * limitada» en páginas que ya se habían corregido meses antes. Una lista en un
 * chat no la cumple nadie; un script que devuelve 1 sí.
 *
 * Revisa SOLO los ficheros de copy (`lib/content/**`), y dentro de ellos solo
 * los valores, nunca los comentarios: el comentario que explica por qué una
 * palabra está prohibida tiene que poder nombrarla.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const RAICES = [
  "lib/content",
  // Los metadatos viven en las páginas, no en el copy, y son lo que enseña
  // Google: dos títulos llevaban «curadas» y este script no los veía.
  "app",
];

/**
 * Prohibidas en copy visible en español. El motivo va al lado porque una
 * prohibición sin motivo se salta en cuanto cambia quien escribe.
 */
const PROHIBIDAS = [
  ["curado", "calco de «curated»; no dice qué hace el editor"],
  ["curada", "íd."],
  ["curación", "íd."],
  ["curaduría", "íd."],
  ["curamos", "íd."],
  ["curator", "íd., y además en inglés"],
  ["vibra", "calco de «vibe»"],
  ["elegido a mano", "lo dice el hero con verbos"],
  ["universos", "vocabulario de marca vacío"],
  ["armas secretas", "metáfora bélica, fuera del universo del club"],
  ["edición limitada", "falso: la producción es bajo demanda"],
  ["tirada limitada", "íd."],
  ["ejemplares numerados", "íd."],
  ["monetizable", "vocabulario de pitch a inversores"],
  ["escalable", "íd."],
];

/** Cifras que deben salir de base de datos, nunca escritas en el copy. */
const CIFRAS = /\b(858|1\.099|1\.629|1\.500|12 ciudades)\b/;

async function ficheros(dir) {
  const salida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    if (entrada.name === "node_modules" || entrada.name.startsWith(".")) continue;
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) salida.push(...(await ficheros(ruta)));
    else if (entrada.name.endsWith(".ts") || entrada.name.endsWith(".tsx")) salida.push(ruta);
  }
  return salida;
}

/** Solo el texto entre comillas dobles: fuera comentarios y nombres de clave. */
function valores(linea) {
  return [...linea.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
}

let fallos = 0;
const todos = (await Promise.all(RAICES.map((r) => ficheros(r)))).flat();
for (const fichero of todos) {
  const lineas = (await readFile(fichero, "utf8")).split("\n");
  let enComentario = false;
  lineas.forEach((linea, i) => {
    const limpia = linea.trim();
    if (limpia.startsWith("/*")) enComentario = true;
    if (enComentario) {
      if (limpia.includes("*/")) enComentario = false;
      return;
    }
    if (limpia.startsWith("//") || limpia.startsWith("*")) return;
    for (const texto of valores(linea)) {
      const bajo = texto.toLowerCase();
      for (const [palabra, motivo] of PROHIBIDAS) {
        if (bajo.includes(palabra)) {
          console.log(`✗ ${fichero}:${i + 1}  «${palabra}» — ${motivo}`);
          fallos++;
        }
      }
      const cifra = texto.match(CIFRAS);
      if (cifra) {
        console.log(`✗ ${fichero}:${i + 1}  cifra a mano «${cifra[0]}» — usa {sitios} o {sitios_ciudad}`);
        fallos++;
      }
    }
  });
}

if (fallos) {
  console.log(`\n${fallos} incumplimiento(s). Reglas en web/CLAUDE.md.`);
  process.exit(1);
}
console.log("✅ Copy limpio: sin palabras prohibidas ni cifras a mano.");
