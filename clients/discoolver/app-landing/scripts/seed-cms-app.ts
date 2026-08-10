/**
 * Re-siembra la página `app-home` en SF-CMS con el set de campos actual y
 * despublica `app-influencers` (esa ruta ahora redirige a la web de guías).
 *
 *   npx tsx scripts/seed-cms-app.ts [--dry]
 *
 * Env (están en apps/sf-cms/.env.local):
 *   SF_CMS_SUPABASE_URL          = NEXT_PUBLIC_SUPABASE_URL
 *   SF_CMS_SUPABASE_SERVICE_KEY  = SUPABASE_SERVICE_ROLE_KEY
 *
 * POR QUÉ EXISTE: el CMS PISA al código (mergeContent). El 2026-08-10 el repaso
 * de negocio encontró la landing sirviendo el copy viejo del CMS — 120.000
 * usuarios, 500 plazas, 8.742 en lista, ratings inventados — aunque el código
 * ya estaba limpio: los commits de limpieza nunca se desplegaron y el CMS
 * conservaba los campos antiguos. Desplegar sin re-sembrar habría devuelto todo
 * aquello al siguiente build. Fuente de verdad del copy: lib/content/home.ts.
 */
import { defaultHomeContent } from "../lib/content/home";

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

async function patch(slug: string, body: Record<string, unknown>) {
  if (DRY) {
    console.log(`· ${slug}: PATCH`, Object.keys(body).join(", "));
    return;
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pages?project_id=eq.${PROJECT_ID}&slug=eq.${slug}`,
    { method: "PATCH", headers: H, body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }) },
  );
  if (!res.ok) throw new Error(`${slug}: ${res.status} ${await res.text()}`);
  console.log(`✅ ${slug} actualizada`);
}

async function main() {
  const fields = Object.keys(defaultHomeContent).length;
  console.log(DRY ? "— simulacro —" : `Sembrando en ${SUPABASE_URL}`);

  // app-home: el set de campos nuevo reemplaza ENTERO al viejo (purga real:
  // las claves que ya no existen desaparecen, no se quedan pisando).
  await patch("app-home", {
    sections_json: [{ id: "content", type: "flat-fields", data: defaultHomeContent }],
    status: "published",
  });
  console.log(`   ${fields} campos (antes 206 — los retirados eran las cifras inventadas)`);

  // app-influencers: la ruta redirige a la web de guías; se despublica para
  // que la API deje de servir los handles sin verificar.
  await patch("app-influencers", { status: "draft" });
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
