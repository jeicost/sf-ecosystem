/**
 * Bake de DATOS REALES de la plataforma (api.discoolver.com) — build-time.
 *
 * La landing enseñaba números horneados a mano del CSV del 6-ago: se quedaban
 * viejos según el equipo revisa fichas. Esto los sustituye por la verdad de la
 * plataforma en cada build: ciudades vivas y sitios publicados por ciudad,
 * desde los mismos endpoints públicos v3 que usa app.discoolver.com.
 *
 * Mismo contrato de seguridad que fetch-cms-content.mjs: si la API falla o
 * devuelve basura, NO se toca el JSON anterior y el build nunca rompe — la
 * web renderiza los últimos números buenos (o los fallbacks del código).
 *
 * La frescura la da el cron diario (app/api/cron/refresh + vercel.json), que
 * dispara el Deploy Hook del proyecto: los números nunca envejecen más de 24h.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "content", "platform-stats.json");
const API = "https://api.discoolver.com/v3";
const UA = { "User-Agent": "Mozilla/5.0 (discoolver-landing build)" };

// La búsqueda pública todavía arrastra ciudades de pruebas antiguas (Londres,
// SHANGAI, TOKIO…). Solo publicamos las que el negocio ha decidido enseñar;
// añadir una ciudad nueva aquí cuando se abra.
const CIUDADES_PUBLICADAS = ["madrid", "barcelona", "malaga", "ibiza", "ronda", "aranjuez", "punta-cana", "santo-domingo", "bangkok"];

async function fetchJson(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function main() {
  const search = await fetchJson(`${API}/cities/search?q=&lang=es&limit=50`);
  const vivas = (search.items ?? []).filter((c) =>
    CIUDADES_PUBLICADAS.includes((c.cityRawId ?? "").toLowerCase()),
  );
  if (vivas.length === 0) throw new Error("la búsqueda no devolvió ninguna ciudad publicada");

  const cities = [];
  for (const c of vivas) {
    try {
      const sec = await fetchJson(
        `${API}/sections/1/es/${c.idCity}?city=${encodeURIComponent(c.cityName)}&interests=&cityid=${c.idCity}`,
      );
      const hashtags = (sec.sections ?? []).find((s) => s.type === "circle_hashtag_plans");
      const sitios = (hashtags?.data ?? []).reduce((n, it) => n + (it.recommendedCount || 0), 0);
      cities.push({ id: c.idCity, slug: c.cityRawId, name: c.cityName, sitios });
      console.log(`  ${c.cityName.padEnd(14)} ${sitios} sitios`);
    } catch (err) {
      console.warn(`  ⚠️ ${c.cityName}: ${err.message} — se omite esta ciudad en este bake`);
    }
  }
  if (cities.length === 0) throw new Error("ninguna ciudad devolvió secciones");

  cities.sort((a, b) => b.sitios - a.sitios);
  const stats = {
    fetchedAt: new Date().toISOString(),
    totalSitios: cities.reduce((n, c) => n + c.sitios, 0),
    cities,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(stats, null, 2));
  console.log(`💾  platform-stats.json · ${stats.totalSitios} sitios en ${cities.length} ciudades`);
}

main().catch((err) => {
  // Nunca exit(1): la landing no puede caerse porque la API tosa un día.
  console.warn("⚠️  fetch-platform-stats:", err.message, "— se conservan los números anteriores");
  if (!fs.existsSync(OUT)) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, "{}");
  }
});
