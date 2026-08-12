/**
 * Siembra las dos páginas de la landing de MIRA en SF-CMS (proyecto `mira`).
 *
 *   # las credenciales están en apps/sf-cms/.env.local
 *   SF_CMS_SUPABASE_URL=… SF_CMS_SUPABASE_SERVICE_KEY=… npx tsx scripts/seed-cms-mira.ts [--dry]
 *
 * Env:
 *   SF_CMS_SUPABASE_URL          = NEXT_PUBLIC_SUPABASE_URL de apps/sf-cms/.env.local
 *   SF_CMS_SUPABASE_SERVICE_KEY  = SUPABASE_SERVICE_ROLE_KEY de ese mismo fichero
 *
 * ── POR QUÉ HAY QUE RE-SEMBRAR ANTES DE CADA DESPLIEGUE ──────────────────────
 *
 * EL CMS PISA AL CÓDIGO. `mergeContent` (lib/cms-pages.ts) recorre las claves del
 * fallback y, si el CMS trae esa misma clave con un string no vacío, gana el CMS.
 * O sea: reescribir el copy en lib/content/ NO cambia lo que se publica mientras
 * el CMS siga guardando el texto anterior bajo las mismas claves.
 *
 * Y en local no se nota, porque sin las variables del CMS el bake sale vacío y
 * la web renderiza justamente el copy nuevo. El fallo solo aparece en producción.
 *
 * En Discoolver esto costó 40 colisiones reales (34 en `home`, 6 en
 * `influencers`): habrían publicado el copy viejo de una web reposicionada.
 *
 * REGLA: cada vez que se reescriba el copy de lib/content/{home,en/home}.ts, se
 * ejecuta este script ANTES de desplegar. Es idempotente —crea o actualiza por
 * slug— y reemplaza el `sections_json` entero, así que las claves del set viejo
 * que ya no existen desaparecen en vez de quedarse esperando a colisionar.
 *
 * La fuente de verdad del copy son los ficheros de lib/content/, nunca el CMS.
 * El CMS es la capa de edición para quien no toca código.
 *
 * NOTA: la API pública del CMS cachea 60s. Justo después de sembrar, un
 * fetch-cms-content.mjs puede traerse todavía lo anterior — no es un fallo de la
 * siembra, es el CDN. Esperar el minuto o comprobar contra Supabase.
 */
import { defaultHomeContent } from "../lib/content/home";
import { defaultHomeContent as homeEnContent } from "../lib/content/en/home";

const PROJECT_ID = "7de0e72f-89e6-4f3e-98f6-94411a9b424c";
const CLIENT_SLUG = "mira";

const SUPABASE_URL = process.env.SF_CMS_SUPABASE_URL;
const SERVICE_KEY = process.env.SF_CMS_SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes("--dry");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "✗ Faltan SF_CMS_SUPABASE_URL / SF_CMS_SUPABASE_SERVICE_KEY (ver apps/sf-cms/.env.local)",
  );
  process.exit(1);
}

const H = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

interface Seed {
  slug: string;
  title: string;
  data: Record<string, string>;
}

const PAGES: Seed[] = [
  { slug: "home", title: "MIRA — Home", data: defaultHomeContent },
  { slug: "home-en", title: "MIRA — Home (EN)", data: homeEnContent },
];

interface ExistingPage {
  id: string;
  sections_json: { id?: string; type?: string; data?: Record<string, unknown> }[] | null;
}

async function findPage(slug: string): Promise<ExistingPage | null> {
  const url = `${SUPABASE_URL}/rest/v1/pages?select=id,sections_json&project_id=eq.${PROJECT_ID}&slug=eq.${slug}`;
  const res = await fetch(url, { headers: H });
  if (!res.ok) throw new Error(`GET ${slug}: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as ExistingPage[];
  return rows[0] ?? null;
}

/** Claves que la página ya tiene guardadas en el CMS, para poder compararlas. */
function clavesEnCms(page: ExistingPage | null): string[] {
  const content = page?.sections_json?.find((s) => (s.id ?? s.type) === "content");
  return Object.keys(content?.data ?? {});
}

async function seed(page: Seed) {
  const claves = Object.keys(page.data);
  // El SEO no se escribe a mano: sale de los propios campos meta_* del copy, así
  // que traducción y metadatos no se pueden desincronizar.
  const seoTitle = page.data.meta_title;
  const seoDescription = page.data.meta_description;
  if (!seoTitle || !seoDescription) {
    throw new Error(`${page.slug}: faltan meta_title / meta_description en el copy`);
  }

  const existing = await findPage(page.slug);

  const body = {
    project_id: PROJECT_ID,
    client_slug: CLIENT_SLUG,
    slug: page.slug,
    title: page.title,
    seo_title: seoTitle,
    seo_description: seoDescription,
    status: "published",
    // Se reemplaza la sección entera. Es lo que evita que sobreviva una clave
    // del set anterior y pise al copy nuevo en el próximo build.
    sections_json: [{ id: "content", type: "flat-fields", data: page.data }],
  };

  if (DRY) {
    const previas = clavesEnCms(existing);
    const nuevas = claves.filter((k) => !previas.includes(k));
    const retiradas = previas.filter((k) => !claves.includes(k));
    console.log(`· ${page.slug.padEnd(9)} ${existing ? "UPDATE" : "CREATE"}  ${claves.length} campos`);
    console.log(`    seo_title: ${seoTitle}`);
    if (existing) {
      console.log(`    ${nuevas.length} claves nuevas · ${retiradas.length} claves retiradas`);
      if (retiradas.length) console.log(`    retiradas: ${retiradas.join(", ")}`);
    }
    return;
  }

  const res = existing
    ? await fetch(`${SUPABASE_URL}/rest/v1/pages?id=eq.${existing.id}`, {
        method: "PATCH",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
      })
    : await fetch(`${SUPABASE_URL}/rest/v1/pages`, {
        method: "POST",
        headers: { ...H, Prefer: "return=minimal" },
        // section_id es NOT NULL en producción (deriva del esquema viejo), así
        // que hay que darle un valor aunque el modelo flat-fields no lo use.
        body: JSON.stringify({ ...body, section_id: `page-${page.slug}` }),
      });

  if (!res.ok) throw new Error(`${page.slug}: ${res.status} ${await res.text()}`);
  console.log(`✅ ${page.slug.padEnd(9)} ${existing ? "actualizada" : "creada"}  ${claves.length} campos`);
}

async function main() {
  console.log(DRY ? "— simulacro, no escribe —" : `Sembrando en ${SUPABASE_URL}`);
  for (const page of PAGES) await seed(page);
  const total = PAGES.reduce((n, p) => n + Object.keys(p.data).length, 0);
  console.log(`\n${PAGES.length} páginas · ${total} campos de copy en total`);
  if (!DRY) console.log("Recuerda: el build siguiente es el que publica esto (bake en build-time).");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
