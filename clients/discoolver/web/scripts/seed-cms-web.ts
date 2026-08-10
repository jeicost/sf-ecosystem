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

const PROJECT_ID = "674dda33-f0dd-4d2f-8433-92aa86941caf";
const SUPABASE_URL = process.env.SF_CMS_SUPABASE_URL;
const SERVICE_KEY = process.env.SF_CMS_SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Faltan SF_CMS_SUPABASE_URL / SF_CMS_SUPABASE_SERVICE_KEY (ver apps/sf-cms/.env.local)");
  process.exit(1);
}

const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

const PAGES: { slug: string; data: Record<string, string> }[] = [
  { slug: "home", data: defaultHomeContent },
  { slug: "influencers", data: defaultInfluencersContent },
];

async function main() {
  console.log(DRY ? "— simulacro —" : `Sembrando en ${SUPABASE_URL}`);
  for (const page of PAGES) {
    const fields = Object.keys(page.data).length;
    if (DRY) {
      console.log(`· ${page.slug.padEnd(12)} UPDATE  ${fields} campos`);
      continue;
    }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pages?project_id=eq.${PROJECT_ID}&slug=eq.${page.slug}`,
      {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({
          sections_json: [{ id: "content", type: "flat-fields", data: page.data }],
          status: "published",
          updated_at: new Date().toISOString(),
        }),
      },
    );
    if (!res.ok) throw new Error(`${page.slug}: ${res.status} ${await res.text()}`);
    console.log(`✅ ${page.slug.padEnd(12)} ${fields} campos`);
  }
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
