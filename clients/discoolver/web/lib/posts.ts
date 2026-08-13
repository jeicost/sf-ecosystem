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
 *
 * Lo que entra por `cargar()` viene del rescate del WordPress viejo y NO está
 * limpio: enlaces a rutas que ya no existen, títulos cortados a media palabra
 * por el import y metadatos repetidos entre artículos. Se sanea aquí, al leer,
 * y no en el horneado, porque el `posts.json` que hay en disco puede venir de
 * un build anterior o de un CMS caído: limpiando al leer se limpia siempre,
 * venga de donde venga el fichero. Es una pasada sobre 50 artículos, cacheada
 * en módulo, y el sitio es SSG: se paga una vez por build.
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

/* ── Saneado del rescate ──────────────────────────────────────────────────── */

/**
 * El sufijo que el WordPress viejo pegaba al `<title>` de cada página. Un
 * artículo lo trae dentro del título de verdad, así que salía en el H1 y en el
 * `headline` del JSON-LD, no solo en la pestaña del navegador. El `[^|]*` es
 * para pillarlo también cuando el import lo dejó cortado a la mitad
 * ("… |Blog dis").
 */
const SUFIJO_BLOG_VIEJO = /\s*\|\s*blog\b[^|]*\|?\s*$/i;

function limpiarTitulo(t: string): string {
  return (t ?? "").replace(SUFIJO_BLOG_VIEJO, "").trim();
}

/**
 * Recorta por palabra, nunca por carácter.
 *
 * El import del rescate cortó a pelo por longitud y dejó tres `<title>`
 * partidos a media palabra ("…que han aparecido en Madr"). Un título más corto
 * se lee; un título partido parece un fallo de la web. El "…" va dentro del
 * presupuesto de caracteres, no encima.
 */
function recortar(texto: string, max: number): string {
  const t = (texto ?? "").trim();
  if (t.length <= max) return t;
  const corte = t.slice(0, max - 1);
  const espacio = corte.lastIndexOf(" ");
  const cuerpo = espacio > 0 ? corte.slice(0, espacio) : corte;
  return `${cuerpo.replace(/[\s,.;:–—-]+$/, "")}…`;
}

/** Texto plano del cuerpo, para cuando ni la description ni la entradilla sirven. */
function textoPlano(html: string): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#8217;|&rsquo;/gi, "’")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Los enlaces que el rescate arrastró del blog viejo.
 *
 * El cuerpo de cada artículo trae la barra lateral del WordPress entera, y con
 * ella su vecindario de 2019: ~900 enlaces a /category/*, 322 a fichas de la
 * plataforma vieja (/es/madrid/restaurantes/top/amazonico y compañía), 38 a las
 * mismas fichas sin prefijo de idioma y 31 al espejo inglés que nunca se
 * rescató. Ninguno lleva hoy a donde dice: los de /es rebotan a la portada —el
 * lector pulsa "Amazónico" y aterriza en la home, que es peor que no enlazar—
 * y el resto son 404.
 *
 * Aquí se resuelve lo que ve el lector dentro del artículo; en `next.config.ts`
 * están los 308 equivalentes para lo que Google y los marcadores tienen
 * indexado desde fuera. No es duplicar: son dos públicos distintos, y las
 * reglas de los dos sitios se escribieron con las mismas formas para que no se
 * separen.
 *
 * Conservador a propósito: los enlaces externos (webs de restaurantes,
 * Wikipedia, mapas) no se tocan aunque hayan podido morir por su cuenta — eso
 * no lo podemos verificar desde aquí y desenlazar de más borra información.
 */
const ANCLA = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
const HREF = /\shref\s*=\s*"([^"]*)"/i;

/** `null` = este destino no existe, hay que desenlazar. */
function resolverEnlace(href: string, slugs: Set<string>): string | null {
  const bruto = (href ?? "").trim();
  if (!bruto || bruto.startsWith("#") || /^(mailto:|tel:)/i.test(bruto)) return href;

  // El rescate dejó algún href sin esquema ("parquedeatracciones.es/en"): el
  // navegador lo resuelve contra la ruta del artículo y acaba en un 404 nuestro
  // apuntando a una web ajena que sí existe. Se le pone el https.
  if (!/^https?:\/\//i.test(bruto) && !bruto.startsWith("/")) {
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#]|$)/i.test(bruto) ? `https://${bruto}` : null;
  }

  let u: URL;
  try {
    u = new URL(bruto, "https://discoolver.com");
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "discoolver.com" && host !== "blog.discoolver.com") return href;
  const ruta = u.pathname.replace(/\/+$/, "") || "/";

  if (host === "blog.discoolver.com") {
    // Desde el 13-ago sí hay páginas de categoría (/blog/categoria/<slug>),
    // pero son las 7 de la taxonomía de hoy y estos enlaces traen las 19 del
    // WordPress de 2016 ("restaurantes-en-madrid", "fiesta-en-malaga",
    // "actualidad-discoolver"): emparejarlas una a una sería adivinar, y
    // adivinar mal manda al lector a una lista que no es la que pidió. El
    // destino honesto de las viejas sigue siendo el índice.
    if (ruta === "/" || ruta.startsWith("/category")) return "/blog";
    // Los adjuntos vivían en el hosting que se cayó; no están ni en el archivo.
    if (ruta.startsWith("/wp-content")) return null;
    // El blog usó dos formatos de URL, plano (/slug) y con fecha
    // (/2019/06/14/slug), y algún enlace arrastra un prefijo de ciudad: el
    // último segmento es siempre el slug. Si el artículo no se rescató, el
    // enlace se cae — mejor eso que mandar al lector a un 404.
    const slug = ruta.split("/").filter(Boolean).pop() ?? "";
    return slugs.has(slug) ? `/blog/${slug}` : null;
  }

  // discoolver.com = la plataforma vieja de fichas. Mismos prefijos que las
  // reglas de next.config.ts: /es entero (esta web no tiene rutas /es), y /en
  // y /madrid solo bajo la ciudad, porque /en/guias o /en/360/* sí son páginas
  // reales de hoy y desenlazarlas sería el error contrario.
  if (ruta === "/es" || ruta.startsWith("/es/")) return null;
  if (ruta.startsWith("/en/madrid") || ruta === "/madrid" || ruta.startsWith("/madrid/")) return null;
  return href;
}

function desenlazar(interior: string): string {
  const limpio = interior.trim();
  if (!limpio) return "";
  // Si ya trae markup propio (<strong>, <img>) se desenvuelve tal cual: meterle
  // otro <strong> encima o convertir una imagen en negrita no tiene sentido.
  if (/<[a-z]/i.test(limpio)) return interior;
  // La negrita es para etiquetas cortas ("Amazónico"), que es donde sustituye
  // de verdad al enlace. Las tarjetas del widget de reservas traen un párrafo
  // entero dentro del <a>: en negrita serían un muro.
  return limpio.length <= 80 ? `<strong>${interior}</strong>` : interior;
}

function limpiarEnlaces(html: string, slugs: Set<string>): string {
  return (html ?? "").replace(ANCLA, (entero, attrs: string, interior: string) => {
    // El WordPress dejó 33 `<a>` sin contenido (miniaturas que perdieron su
    // imagen con el hosting). No se ven, pero se rastrean y son enlaces sin
    // nombre accesible: se van, apunten a donde apunten.
    if (!interior.trim()) return "";
    const m = attrs.match(HREF);
    if (!m) return desenlazar(interior);
    const destino = resolverEnlace(m[1], slugs);
    if (destino === null) return desenlazar(interior);
    if (destino === m[1]) return entero;
    return `<a href="${destino}">${interior}</a>`;
  });
}

/**
 * El import del rescate rellenó `seo_title` y `seo_description` cortando a pelo
 * el título y la entradilla por longitud: quedaron 3 títulos y 11 descriptions
 * partidos a media palabra ("…aparecido en Madr", "…una mesa o una sección").
 * Cuando el campo corto no es más que el largo cortado, se vuelve a recortar
 * desde el largo —ahora por palabra—. Si alguien lo escribió a mano, o sea si
 * no es prefijo del otro, se respeta: para eso está el campo.
 */
function reconstruir(corto: string, largo: string): string {
  const c = (corto ?? "").trim();
  return !c || largo.startsWith(c) ? largo : c;
}

function tituloSeo(seoTitle: string, titulo: string): string {
  return recortar(reconstruir(limpiarTitulo(seoTitle), titulo), 60);
}

/**
 * La meta description del artículo.
 *
 * Orden: la del CMS → la entradilla → las primeras frases del cuerpo. Un
 * candidato se descarta si está vacío, si es un resto del import ("Hola") o si
 * lo comparte con otro artículo. Lo segundo importa: tres posts del rescate
 * llevan la MISMA description palabra por palabra (habla de los jueves en los
 * de lunes y miércoles) y también la misma entradilla, así que la entradilla no
 * salva a la description y hay que bajar al cuerpo. El cuerpo es distinto en
 * cada artículo, es texto suyo —no inventado— y sale igual en cada build.
 *
 * Se reemplazan los tres, incluido aquel al que el texto sí le pega: si una
 * description está en tres sitios, no es de ninguno, y elegir cuál se la queda
 * sería adivinar.
 */
const MIN_DESCRIPCION = 60;

function descripcionSeo(desc: string, entradilla: string, cuerpo: string): string {
  if (desc) return recortar(reconstruir(desc, entradilla || desc), 160);
  if (entradilla) return recortar(entradilla, 160);
  return recortar(textoPlano(cuerpo), 160);
}

/** Sirve como texto de SEO, o es un resto del import ("Hola") que no dice nada. */
function utilizable(t: string, repetido: boolean): string {
  const s = (t ?? "").trim();
  return !repetido && s.length >= MIN_DESCRIPCION ? s : "";
}

/* ── Lectura ──────────────────────────────────────────────────────────────── */

function cargar(): Post[] {
  if (cache) return cache;
  try {
    const crudo = JSON.parse(fs.readFileSync(RUTA, "utf-8")) as Post[];
    const vivos = crudo.filter((p) => p.slug && p.title);
    const slugs = new Set(vivos.map((p) => p.slug));

    // Cuántos artículos comparten cada texto. Se mira sobre el set entero antes
    // de tocar nada, porque "repetido" solo se sabe con todos delante.
    const repetidos = (campo: (p: Post) => string) => {
      const cuenta = new Map<string, number>();
      for (const p of vivos) {
        const k = (campo(p) ?? "").trim().toLowerCase();
        if (k) cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
      }
      return (t: string) => (cuenta.get((t ?? "").trim().toLowerCase()) ?? 0) > 1;
    };
    const descRepetida = repetidos((p) => p.seoDescription);
    const entradillaRepetida = repetidos((p) => p.excerpt);

    // Los más nuevos primero. Los que no tienen fecha van al final: sin fecha
    // no se puede ordenar, y colarlos arriba daría una portada aleatoria.
    cache = vivos
      .map((p) => {
        const title = limpiarTitulo(p.title);
        const contentHtml = limpiarEnlaces(p.contentHtml, slugs);
        return {
          ...p,
          title,
          contentHtml,
          seoTitle: tituloSeo(p.seoTitle, title),
          seoDescription: descripcionSeo(
            utilizable(p.seoDescription, descRepetida(p.seoDescription)),
            utilizable(p.excerpt, entradillaRepetida(p.excerpt)),
            contentHtml,
          ),
        };
      })
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

/* ── Categorías ───────────────────────────────────────────────────────────── */

export interface Categoria {
  nombre: string;
  /** El de la URL: /blog/categoria/<slug>. */
  slug: string;
  total: number;
}

/**
 * El slug de una categoría, calculado del nombre y no guardado.
 *
 * La categoría es un campo de texto del artículo en el CMS, no una entidad con
 * ficha propia: si el slug viviera aparte habría que mantener dos cosas a mano
 * y bastaría una errata para que una categoría se quedara sin página. Se
 * transliteran acentos y ñ (NFD + fuera los diacríticos) para que "Con niños"
 * sea /con-ninos y no una URL con %C3%B1 dentro, que es lo que se acaba
 * pegando en un WhatsApp.
 */
export function categoriaSlug(nombre: string): string {
  return (nombre ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Las categorías que existen de verdad, con cuántos artículos tiene cada una.
 *
 * Se agrupa por SLUG y no por nombre porque el slug es lo que decide qué ve el
 * lector: el día que entre por el CMS un "Comer y Beber" con mayúscula habría
 * dos entradas en la lista contando 12 y 2, y las dos llevarían a la misma
 * página con los 14. Agrupando por slug, el número de la lista y lo que hay
 * dentro son siempre lo mismo. El desempate por nombre es para que dos
 * categorías empatadas no bailen de sitio entre builds.
 */
export function getCategories(): Categoria[] {
  const cuenta = new Map<string, Categoria>();
  for (const p of cargar()) {
    const slug = categoriaSlug(p.category);
    if (!slug) continue;
    const ya = cuenta.get(slug);
    if (ya) ya.total += 1;
    else cuenta.set(slug, { nombre: p.category, slug, total: 1 });
  }
  return [...cuenta.values()].sort(
    (a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es"),
  );
}

export function getCategoriaBySlug(slug: string): Categoria | undefined {
  return getCategories().find((c) => c.slug === slug);
}

/** Los artículos de una categoría, en el mismo orden que en el índice. */
export function getPostsByCategoria(slug: string): Post[] {
  return cargar().filter((p) => categoriaSlug(p.category) === slug);
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
 * Si un artículo ya es archivo.
 *
 * El blog está congelado: el más nuevo es de diciembre de 2021 y dentro de los
 * textos hay presentes y futuros que ya no se sostienen ("el 5 de enero los
 * Tres Reyes llegarán…", "entrará en vigor el próximo noviembre de 2018"). A
 * partir de dos años se avisa. No se despublica nada: siguen trayendo el
 * tráfico correcto y borrarlos sería tirar años de posicionamiento. Decirlo
 * también nos protege — recomendar a ciegas un sitio cerrado desgasta la marca;
 * fechar el artículo, no.
 */
const DOS_ANIOS_MS = 2 * 31_557_600_000;

// Sin segundo parámetro a propósito: `posts.filter(esDeArchivo)` le pasaría el
// índice del array como "ahora" y todo saldría reciente.
export function esDeArchivo(p: Post): boolean {
  if (!p.date) return false;
  const t = new Date(`${p.date}T00:00:00Z`).getTime();
  return Number.isFinite(t) && Date.now() - t > DOS_ANIOS_MS;
}

/**
 * Los años que cubre el archivo, sacados de las fechas reales. Calculado y no
 * escrito a mano para que el día que se publique algo nuevo el rótulo del
 * índice se mueva solo en vez de quedarse mintiendo.
 *
 * Acepta un subconjunto para poder fechar también una categoría con SUS
 * artículos ("Compras · 2017-2019"): decirle al lector 2016-2021 en una lista
 * donde no hay nada de 2016 sería exactamente la mentira que este rótulo
 * existe para evitar.
 */
export function periodoDelArchivo(posts: Post[] = cargar()): string {
  const anios = posts
    .map((p) => p.date.slice(0, 4))
    .filter(Boolean)
    .sort();
  if (anios.length === 0) return "";
  const desde = anios[0];
  const hasta = anios[anios.length - 1];
  return desde === hasta ? desde : `${desde}-${hasta}`;
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
