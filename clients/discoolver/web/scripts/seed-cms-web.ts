/**
 * Re-siembra `home` e `influencers` (la tienda de guías) en SF-CMS con el set
 * de campos actual de lib/content/{home,influencers}.ts.
 *
 *   npx tsx scripts/seed-cms-web.ts [--dry]
 *
 * Env (están en apps/sf-cms/.env.local):
 *   SF_CMS_SUPABASE_URL          = NEXT_PUBLIC_SUPABASE_URL
 *   SF_CMS_SUPABASE_SERVICE_KEY  = SUPABASE_SERVICE_ROLE_KEY
 *
 * Regla de web/CLAUDE.md: re-sembrar ANTES de desplegar cada vez que se
 * reescriba el copy — el CMS pisa al código y las claves viejas resucitan el
 * texto anterior (40 colisiones reales en agosto; los nombres de creadores sin
 * firma volvieron a aparecer así el 10-ago). El reemplazo es del sections_json
 * ENTERO: purga real, no merge.
 */
import { defaultHomeContent } from "../lib/content/home";
import { defaultInfluencersContent } from "../lib/content/influencers";
import { defaultAppHomeContent } from "../lib/content/app-home";
import { defaultHomeContent as homeEn } from "../lib/content/en/home";
import { defaultInfluencersContent as influencersEn } from "../lib/content/en/influencers";
import { defaultAppHomeContent as appHomeEn } from "../lib/content/en/app-home";

const PROJECT_ID = "674dda33-f0dd-4d2f-8433-92aa86941caf";
const SUPABASE_URL = process.env.SF_CMS_SUPABASE_URL;
const SERVICE_KEY = process.env.SF_CMS_SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");
// Slugs sueltos como argumento: `npx tsx scripts/seed-cms-web.ts app-home app-home-en`.
// La siembra REEMPLAZA el sections_json entero, así que sembrar las seis
// páginas cuando solo se ha tocado una tira cualquier edición hecha desde el
// CMS en las otras cinco. Al ir página a página, se siembra solo la que toca.
const SOLO = process.argv.slice(2).filter((a) => !a.startsWith("--"));

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Faltan SF_CMS_SUPABASE_URL / SF_CMS_SUPABASE_SERVICE_KEY (ver apps/sf-cms/.env.local)");
  process.exit(1);
}

const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// `app-home` faltaba aquí y por eso el CMS seguía pisando la home de la
// plataforma con el copy anterior: los seis testimonios inventados, la FAQ que
// decía «usar Discoolver es gratis» junto a una tienda con precios, y una lista
// de nueve ciudades de las que solo cuatro estaban abiertas. Sembrar solo
// `home` no bastaba: son dos páginas distintas desde la reestructura del
// 12-ago (la plataforma en la raíz, la tienda en /guias).
const PAGES: { slug: string; data: Record<string, string> }[] = [
  { slug: "home", data: defaultHomeContent },
  { slug: "influencers", data: defaultInfluencersContent },
  { slug: "app-home", data: defaultAppHomeContent },
  { slug: "home-en", data: homeEn },
  { slug: "influencers-en", data: influencersEn },
  { slug: "app-home-en", data: appHomeEn },
  // TAILANDÉS (26-ago-2026): se siembra con el contenido INGLÉS a propósito,
  // como punto de partida para que Nirada traduzca desde el CMS. No se siembra
  // tailandés de máquina: publicar una traducción sin revisar en hostelería y
  // turismo es exactamente lo que se decidió no hacer. Mientras tanto las rutas
  // /th van con noindex, así que Google no ve páginas a medias.
  { slug: "home-th", data: homeEn },
  { slug: "influencers-th", data: influencersEn },
  { slug: "app-home-th", data: appHomeEn },
];

async function main() {
  const objetivo = SOLO.length ? PAGES.filter((p) => SOLO.includes(p.slug)) : PAGES;
  if (SOLO.length && objetivo.length !== SOLO.length) {
    const faltan = SOLO.filter((s) => !PAGES.some((p) => p.slug === s));
    throw new Error(`slug desconocido: ${faltan.join(", ")}`);
  }
  console.log(DRY ? "— simulacro —" : `Sembrando en ${SUPABASE_URL}`);
  console.log(`Páginas: ${objetivo.map((p) => p.slug).join(", ")}`);
  for (const page of objetivo) {
    const fields = Object.keys(page.data).length;
    if (DRY) {
      console.log(`· ${page.slug.padEnd(12)} UPDATE  ${fields} campos`);
      continue;
    }
    const q = `${SUPABASE_URL}/rest/v1/pages?project_id=eq.${PROJECT_ID}&slug=eq.${page.slug}`;
    const existing = (await (await fetch(`${q}&select=id`, { headers: H })).json()) as { id: string }[];
    const body = {
      project_id: PROJECT_ID,
      client_slug: "discoolver",
      slug: page.slug,
      title: page.slug,
      sections_json: [{ id: "content", type: "flat-fields", data: page.data }],
      status: "published",
    };
    const res = existing[0]
      ? await fetch(`${SUPABASE_URL}/rest/v1/pages?id=eq.${existing[0].id}`, {
          method: "PATCH", headers: H,
          body: JSON.stringify({ sections_json: body.sections_json, status: "published", updated_at: new Date().toISOString() }),
        })
      : await fetch(`${SUPABASE_URL}/rest/v1/pages`, {
          method: "POST", headers: H,
          body: JSON.stringify({ ...body, section_id: `page-${page.slug}` }),
        });
    if (!res.ok) throw new Error(`${page.slug}: ${res.status} ${await res.text()}`);
    console.log(`✅ ${page.slug.padEnd(16)} ${existing[0] ? "actualizada" : "creada"}  ${fields} campos`);
  }
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
