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
import type { HomeContent } from "@/lib/content/home";
import type { Locale } from "@/lib/i18n";

type CityStat = { id: number; slug: string; name: string; sitios: number };
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
      if (sitios > 0) cities.push({ id: c.idCity, slug: c.cityRawId ?? "", name: c.cityName, sitios });
    } catch {
      // una ciudad que falla no tumba el resto
    }
  }
  cities.sort((a, b) => b.sitios - a.sitios);
  return { totalSitios: cities.reduce((n, c) => n + c.sitios, 0), cities };
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

/** Pisa en el contenido ya mergeado los números que salen de la plataforma. */
export async function applyPlatformStats(content: HomeContent, locale: Locale = "es"): Promise<HomeContent> {
  let stats: PlatformStats;
  try {
    stats = await fetchLiveStats();
    if (!stats.totalSitios) stats = loadBakedStats();
  } catch {
    stats = loadBakedStats();
  }
  const cities = stats.cities ?? [];
  if (!stats.totalSitios || cities.length === 0) return content;

  const out: HomeContent = { ...content };
  const madrid = cities.find((c) => c.slug === "madrid");

  out.hero_stat1_num = nf.format(stats.totalSitios);
  out.hero_stat2_num = String(cities.length);
  if (madrid) {
    out.hero_stat3_num = nf.format(madrid.sitios);
    out.hero_social_count = nf.format(madrid.sitios);
  }

  // Ticker: las líneas impares son ciudades — se regeneran con el dato vivo.
  // Las pares (sitios concretos) se quedan: son picks editoriales.
  cities.slice(0, 5).forEach((c, i) => {
    const key = `ticker_${i * 2 + 1}` as keyof HomeContent;
    out[key] = `${c.name} · ${nf.format(c.sitios)} ${locale === "en" ? "places published" : "sitios publicados"}`;
  });

  return out;
}
