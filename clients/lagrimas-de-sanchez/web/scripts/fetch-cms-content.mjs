#!/usr/bin/env node
/**
 * Trae el contenido editable desde SF-CMS y lo deja en content/pages.json.
 *
 * El CMS aquí NO manda: la web funciona entera sin él. Lo que trae es una capa
 * de override para titulares y textos, de modo que se pueda retocar el copy sin
 * tocar código. Si la API no responde, se conserva el JSON anterior y el build
 * sigue — nunca se rompe un despliegue por un CMS frío.
 *
 * OJO al cold start de Vercel: el primer build después de un despliegue del CMS
 * puede devolver 0 páginas. Si pasa, redesplegar; el segundo siempre las trae.
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "content/pages.json");
const API = process.env.CMS_API_URL || "https://cms.startupsfactory.es";
const SLUG = process.env.CMS_CLIENT_SLUG || "lagrimas-de-sanchez";

async function main() {
  if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });
  try {
    const res = await fetch(`${API}/api/pages?client=${SLUG}`, {
      headers: process.env.CMS_API_KEY ? { "x-api-key": process.env.CMS_API_KEY } : {},
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const pages = Array.isArray(json) ? json : (json.pages ?? []);
    // Se indexa por section.id, NUNCA por section.type: hay varias secciones
    // del mismo tipo en una página y keyar por tipo las pisa entre sí.
    const out = {};
    for (const page of pages) {
      const sections = {};
      for (const s of page.sections_json ?? page.sections ?? []) {
        sections[s.id ?? s.type] = { type: s.type, data: s.data ?? {} };
      }
      out[page.slug] = sections;
    }
    writeFileSync(OUT, JSON.stringify(out, null, 2));
    console.log(`✅  CMS · ${Object.keys(out).length} páginas`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (existsSync(OUT)) {
      console.warn(`⚠️  CMS no disponible (${msg}) — se usa el content/pages.json cacheado`);
    } else {
      writeFileSync(OUT, "{}");
      console.warn(`⚠️  CMS no disponible (${msg}) — se sigue solo con el copy del código`);
    }
  }
}
main();
