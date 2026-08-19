/**
 * Números REALES de la plataforma (api.discoolver.com) para la landing.
 *
 * Jerarquía de verdad para las cifras: API en vivo (cacheada 24h vía ISR) >
 * bake de build (content/platform-stats.json) > fallback del código. El copy
 * (frases, títulos) sigue siendo del CMS; esto solo pisa los NÚMEROS que
 * envejecen — total de sitios, sitios por ciudad, líneas del ticker — para que
 * la landing nunca prometa un catálogo distinto del que la plataforma enseña
 * al hacer clic.
 *
 * El proyecto NO está conectado a git (deploy manual con vercel --prod), así
 * que no hay deploy hooks ni crons que lo reconstruyan: por eso el dato entra
 * por fetch con `next: { revalidate }` — Next regenera la página como mucho
 * una vez al día y, si la API falla, sigue sirviendo la última buena.
 */
import type { AppHomeContent } from "@/lib/content/app-home";
import type { Locale } from "@/lib/i18n";

type CityStat = {
  id: number;
  slug: string;
  name: string;
  sitios: number;
  /** Nombres REALES de sitios publicados, para el selector de ciudades. */
  destacados: string[];
};
type PlatformStats = { fetchedAt?: string; totalSitios?: number; cities?: CityStat[] };

const API = "https://api.discoolver.com/v3";
const UA = { "User-Agent": "Mozilla/5.0 (discoolver-landing ISR)" };
const REVALIDATE = 86400; // 24h

// La búsqueda pública todavía arrastra ciudades de pruebas antiguas (Londres,
// SHANGAI, TOKIO…). Solo publicamos las decididas por negocio; una ciudad
// nueva entra sola en cuanto Diego la abra en la plataforma.
const CIUDADES_PUBLICADAS = [
  "madrid",
  "barcelona",
  "malaga",
  "ibiza",
  "ronda",
  "aranjuez",
  "punta-cana",
  "santo-domingo",
  "bangkok",
];

async function apiJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: UA,
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function fetchLiveStats(): Promise<PlatformStats> {
  const search = await apiJson<{ items?: { idCity: number; cityRawId?: string; cityName: string }[] }>(
    "/cities/search?q=&lang=es&limit=50",
  );
  const vivas = (search.items ?? []).filter((c) =>
    CIUDADES_PUBLICADAS.includes((c.cityRawId ?? "").toLowerCase()),
  );

  const cities: CityStat[] = [];
  for (const c of vivas) {
    try {
      const sec = await apiJson<{ sections?: { type: string; data?: { recommendedCount?: number }[] }[] }>(
        `/sections/1/es/${c.idCity}?city=${encodeURIComponent(c.cityName)}&interests=&cityid=${c.idCity}`,
      );
      const hashtags = (sec.sections ?? []).find((s) => s.type === "circle_hashtag_plans");
      const sitios = (hashtags?.data ?? []).reduce((n, it) => n + (it.recommendedCount || 0), 0);
      if (sitios > 0) {
        cities.push({
          id: c.idCity,
          slug: c.cityRawId ?? "",
          name: c.cityName,
          sitios,
          destacados: await destacadosDe(c.idCity, c.cityName),
        });
      }
    } catch {
      // una ciudad que falla no tumba el resto
    }
  }
  cities.sort((a, b) => b.sitios - a.sitios);
  return { totalSitios: cities.reduce((n, c) => n + c.sitios, 0), cities };
}

/**
 * Tres nombres reales de sitios publicados en la ciudad.
 *
 * Es lo único de la sección de ciudades que DEMUESTRA: sin ellos la home entera
 * llega al final sin haber enseñado un solo sitio de verdad y todo el argumento
 * editorial se queda en afirmación. Salen de `list_plan`, el mismo listado que
 * enseña la plataforma; si falla, el portal se queda sin la línea (mejor sin
 * ella que con nombres inventados).
 */
async function destacadosDe(idCity: number, nombre: string): Promise<string[]> {
  try {
    const r = await apiJson<{ sections?: { type: string; data?: { title?: string }[] }[] }>(
      `/sections/2/es/${idCity}?city=${encodeURIComponent(nombre)}&cityid=${idCity}`,
    );
    const lista = (r.sections ?? []).find((s) => s.type === "list_plan");
    return (lista?.data ?? [])
      .map((it) => (it.title ?? "").trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

function loadBakedStats(): PlatformStats {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("../content/platform-stats.json") as PlatformStats;
  } catch {
    return {};
  }
}

// Separador manual: el ICU del entorno de build no garantiza es-ES y salía
// "1099" sin punto. Un regex no depende de locales.
const nf = { format: (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") };

/**
 * Los hechos de la plataforma, en una sola llamada, para que TODA la web hable
 * del mismo catálogo: hero, barra de datos, FAQ, cierre y meta description.
 *
 * Antes cada sección escribía su número y su lista de ciudades a mano, y se
 * contradecían: la home nombraba Málaga (0 sitios publicados) en cinco sitios
 * y no nombraba Ibiza (51) en ninguno. Aquí no hay valores por defecto a
 * propósito — si la consulta falla, `ok:false` y quien lo consume esconde el
 * dato en vez de inventarlo.
 */
export type PlatformFacts = {
  ok: boolean;
  /** Total exacto de sitios publicados. */
  total: number;
  /** El total redondeado A LA BAJA al centenar: 1.643 → 1.600. */
  totalRedondeado: number;
  /** Nº de ciudades con al menos un sitio publicado. */
  ciudades: number;
  /** Nombres de esas ciudades, de más a menos catálogo. */
  ciudadesLista: string[];
  /** Las ciudades con su ficha completa, para el selector de la home. */
  ciudadesDatos: { slug: string; nombre: string; sitios: number; destacados: string[] }[];
  /** "Madrid · Barcelona · Ibiza" */
  ciudadesTexto: string;
};

const SIN_DATOS: PlatformFacts = {
  ok: false, total: 0, totalRedondeado: 0, ciudades: 0, ciudadesLista: [], ciudadesDatos: [], ciudadesTexto: "",
};

export async function getPlatformFacts(): Promise<PlatformFacts> {
  let stats: PlatformStats;
  try {
    stats = await fetchLiveStats();
    if (!stats.totalSitios) stats = loadBakedStats();
  } catch {
    stats = loadBakedStats();
  }
  const cities = stats.cities ?? [];
  const total = stats.totalSitios ?? 0;
  if (!total || cities.length === 0) return SIN_DATOS;
  return {
    ok: true,
    total,
    totalRedondeado: Math.floor(total / 100) * 100,
    ciudades: cities.length,
    ciudadesLista: cities.map((c) => c.name),
    ciudadesDatos: cities.map((c) => ({
      slug: c.slug,
      nombre: c.name,
      sitios: c.sitios,
      destacados: c.destacados ?? [],
    })),
    ciudadesTexto: cities.map((c) => c.name).join(" · "),
  };
}

/** "Madrid, Barcelona y Ronda" — con la "y" delante del último. */
function listaEs(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** "Madrid, Barcelona and Ronda" */
function listaEn(nombres: string[]): string {
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} and ${nombres[nombres.length - 1]}`;
}

/**
 * Sustituye los marcadores de cifra en CUALQUIER contenido plano, para que la
 * tienda de guías hable del mismo catálogo que la home. Marcadores:
 *   {sitios}         → total publicado, redondeado a la baja al centenar
 *   {sitios_ciudad}  → los de la ciudad con más catálogo (hoy Madrid)
 *   {ciudades}       → la lista de ciudades abiertas
 *
 * La tienda decía «858 sitios» dos veces mientras la home decía 1.099: cuando
 * lo que vendes es que alguien revisa cada sitio, un número que baila tumba
 * justo el argumento.
 */
export async function aplicarCifras<T extends Record<string, string>>(
  contenido: T,
  locale: Locale = "es",
): Promise<T> {
  const hechos = await getPlatformFacts();
  if (!hechos.ok) return contenido;
  const lista = locale === "en" ? listaEn(hechos.ciudadesLista) : listaEs(hechos.ciudadesLista);
  const mayor = hechos.ciudadesDatos[0]?.sitios ?? 0;
  const salida = { ...contenido };
  for (const clave of Object.keys(salida) as (keyof T)[]) {
    const valor = salida[clave];
    if (typeof valor !== "string" || !valor.includes("{")) continue;
    salida[clave] = valor
      .replace(/\{sitios_ciudad\}/g, formatoMil(mayor, locale))
      .replace(/\{sitios\}/g, formatoMil(hechos.totalRedondeado, locale))
      .replace(/\{ciudades\}/g, lista) as T[keyof T];
  }
  return salida;
}

/**
 * Separador de millar por idioma. `nf` usa el punto (es-ES) y en inglés eso se
 * lee como decimal: "1.300 places" son mil trescientos aquí y uno coma tres
 * allí. La meta description en inglés salía con el separador español.
 */
export function formatoMil(n: number, locale: Locale = "es"): string {
  return locale === "en" ? n.toLocaleString("en-US") : nf.format(n);
}

/** Pisa en el contenido ya mergeado los números que salen de la plataforma. */
export async function applyPlatformStats(content: AppHomeContent, locale: Locale = "es"): Promise<AppHomeContent> {
  let stats: PlatformStats;
  try {
    stats = await fetchLiveStats();
    if (!stats.totalSitios) stats = loadBakedStats();
  } catch {
    stats = loadBakedStats();
  }
  const cities = stats.cities ?? [];
  if (!stats.totalSitios || cities.length === 0) return content;

  const out: AppHomeContent = { ...content };
  const madrid = cities.find((c) => c.slug === "madrid");

  // Barra de datos del hero. Ítems 1 y 2 SIEMPRE de base de datos, nunca a
  // mano; el "+" solo lo lleva el primero y el total va redondeado a la baja al
  // centenar para que no envejezca a diario.
  out.hero_stat1_num = `+${nf.format(Math.floor(stats.totalSitios / 100) * 100)}`;
  out.hero_stat2_num = String(cities.length);
  // Ciudades abiertas: la lista se escribe sola con las que tienen catálogo.
  out.hero_eyebrow =
    locale === "en"
      ? `${cities.map((c) => c.name).join(" · ")} — now live`
      : `${cities.map((c) => c.name).join(" · ")} — ya abiertas`;
  // El subtítulo cita el mismo número maestro que la barra.
  out.hero_sub = out.hero_sub.replace(
    /\{sitios\}/g,
    nf.format(Math.floor(stats.totalSitios / 100) * 100),
  );
  if (madrid) {
    out.hero_social_count = nf.format(madrid.sitios);
  }

  // {ciudades} en cualquier campo: la lista de ciudades abiertas, escrita con
  // el dato vivo. Antes cada sección la escribía a mano y la home nombraba
  // Málaga —cero sitios publicados— en cinco sitios a la vez.
  const listaCiudades =
    locale === "en" ? listaEn(cities.map((c) => c.name)) : listaEs(cities.map((c) => c.name));
  for (const clave of Object.keys(out) as (keyof AppHomeContent)[]) {
    const valor = out[clave];
    if (typeof valor === "string" && valor.includes("{ciudades}")) {
      out[clave] = valor.replace(/\{ciudades\}/g, listaCiudades);
    }
  }

  // Ticker: las líneas impares son ciudades — se regeneran con el dato vivo.
  // Las pares (sitios concretos) se quedan: son picks editoriales.
  //
  // Se VACÍAN todas las impares antes de escribir. Sin esto, si la API
  // devuelve menos ciudades que huecos hay, el hueco sobrante conserva la
  // ciudad estática y acaba contradiciendo a la viva: el 13-ago-2026 la home
  // enseñaba «Ibiza · 51» (dato vivo, hueco 7) e «Ibiza · 50» (dato fósil,
  // hueco 9) a la vez, y Ronda había desaparecido del ticker sin que nadie
  // la quitara. El componente descarta las líneas vacías.
  for (let i = 1; i <= 9; i += 2) {
    out[`ticker_${i}` as keyof AppHomeContent] = "";
  }
  cities.slice(0, 5).forEach((c, i) => {
    const key = `ticker_${i * 2 + 1}` as keyof AppHomeContent;
    out[key] = `${c.name} · ${nf.format(c.sitios)} ${locale === "en" ? "places published" : "sitios publicados"}`;
  });

  return out;
}
