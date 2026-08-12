import fs from "fs";
import path from "path";

/**
 * El blog — horneado en build-time desde SF-CMS.
 *
 * Mismo patrón que el resto del contenido de esta web y que el blog de NC
 * Global: `scripts/fetch-cms-content.mjs` baja los artículos antes de
 * `next build` y los deja en `content/posts.json` (gitignored). Aquí solo se
 * leen. Un cambio en el CMS se ve en el siguiente deploy, no al instante.
 *
 * Se sirve estático a propósito: son artículos que cambian poco y que tienen
 * que cargar rápido y ser indexables. Nada de fetch en cliente.
 */
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  category: string;
  author: string;
  /** ISO corto, YYYY-MM-DD. Vacío si el CMS no tiene fecha de publicación. */
  date: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
}

const RUTA = path.join(process.cwd(), "content/posts.json");

let cache: Post[] | null = null;

function cargar(): Post[] {
  if (cache) return cache;
  try {
    const crudo = JSON.parse(fs.readFileSync(RUTA, "utf-8")) as Post[];
    // Los más nuevos primero. Los que no tienen fecha van al final: sin fecha
    // no se puede ordenar, y colarlos arriba daría una portada aleatoria.
    cache = crudo
      .filter((p) => p.slug && p.title)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch {
    // Sin fichero (o corrupto) el blog sale vacío, no revienta el build.
    cache = [];
  }
  return cache;
}

export function getAllPosts(): Post[] {
  return cargar();
}

export function getPostBySlug(slug: string): Post | undefined {
  return cargar().find((p) => p.slug === slug);
}

export function getPostSlugs(): string[] {
  return cargar().map((p) => p.slug);
}

/** Las categorías que existen de verdad, con cuántos artículos tiene cada una. */
export function getCategories(): { nombre: string; total: number }[] {
  const cuenta = new Map<string, number>();
  for (const p of cargar()) {
    if (!p.category) continue;
    cuenta.set(p.category, (cuenta.get(p.category) ?? 0) + 1);
  }
  return [...cuenta.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
}

/** Otros artículos para el pie de uno: misma categoría primero. */
export function getRelated(slug: string, limite = 3): Post[] {
  const todos = cargar();
  const actual = todos.find((p) => p.slug === slug);
  if (!actual) return todos.slice(0, limite);
  const mismos = todos.filter((p) => p.slug !== slug && p.category === actual.category);
  const resto = todos.filter((p) => p.slug !== slug && p.category !== actual.category);
  return [...mismos, ...resto].slice(0, limite);
}

/** Fecha legible. Devuelve "" si no hay, para poder ocultarla sin inventarla. */
export function fechaLegible(iso: string, locale: "es" | "en" = "es"): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale === "en" ? "en-GB" : "es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * De qué ciudad habla un artículo.
 *
 * El blog rescatado es casi todo Madrid, con algún artículo de Barcelona y de
 * Málaga. Se detecta del título y del cuerpo para poder ofrecer LA guía de esa
 * ciudad al pie del artículo, en vez de un "ver las guías" genérico: quien
 * acaba de leer sobre bares de Barcelona no quiere el catálogo entero.
 */
const CIUDADES: [string, RegExp][] = [
  ["Barcelona", /barcelona/i],
  ["Málaga", /m[áa]laga/i],
  ["Madrid", /madrid/i],
];

export function ciudadDelPost(p: Post): string {
  const donde = `${p.title} ${p.excerpt} ${p.contentHtml.slice(0, 2000)}`;
  for (const [nombre, patron] of CIUDADES) {
    if (patron.test(donde)) return nombre;
  }
  return "Madrid";                    // el blog nació siendo el blog de Madrid
}
