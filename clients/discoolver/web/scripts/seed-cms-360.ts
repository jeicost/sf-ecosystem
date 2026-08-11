/**
 * Siembra las cinco páginas de /360 en SF-CMS (proyecto `discoolver`).
 *
 *   npx tsx scripts/seed-cms-360.ts [--dry]
 *
 * Env (están en apps/sf-cms/.env.local):
 *   SF_CMS_SUPABASE_URL          = NEXT_PUBLIC_SUPABASE_URL
 *   SF_CMS_SUPABASE_SERVICE_KEY  = SUPABASE_SERVICE_ROLE_KEY
 *
 * POR QUÉ EXISTE: el CMS PISA al código. `mergeContent` recorre las claves del
 * fallback y, si una coincide con la del CMS, gana el CMS — y en local no se nota
 * porque sin .env.local la web solo renderiza fallbacks. La regla de web/CLAUDE.md
 * es re-sembrar ANTES de desplegar cada vez que se reescriba el copy, o se publica
 * el texto viejo. En agosto costó 40 colisiones reales en `home` e `influencers`.
 *
 * Es idempotente: si la página existe, actualiza; si no, la crea. La fuente de
 * verdad del copy son los ficheros de lib/content/b360/, nunca el CMS.
 */
import { defaultHome360Content } from "../lib/content/b360/home";
import { defaultDestinos360Content } from "../lib/content/b360/destinos";
import { defaultAlojamientos360Content } from "../lib/content/b360/alojamientos";
import { defaultAgencias360Content } from "../lib/content/b360/agencias";
import { defaultDemo360Content } from "../lib/content/b360/demo";
import { defaultHome360Content as home360En } from "../lib/content/b360/en/home";
import { defaultDestinos360Content as destinos360En } from "../lib/content/b360/en/destinos";
import { defaultAlojamientos360Content as alojamientos360En } from "../lib/content/b360/en/alojamientos";
import { defaultAgencias360Content as agencias360En } from "../lib/content/b360/en/agencias";
import { defaultDemo360Content as demo360En } from "../lib/content/b360/en/demo";

const PROJECT_ID = "674dda33-f0dd-4d2f-8433-92aa86941caf";
const CLIENT_SLUG = "discoolver";

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
  seoTitle: string;
  seoDescription: string;
  data: Record<string, string>;
}

/** Los seo_* replican lo que buildMetadata() emite en cada página. */
const PAGES: Seed[] = [
  {
    slug: "360-home",
    title: "360 — Home",
    seoTitle: "discoolver 360 — plataforma para destinos turísticos",
    seoDescription:
      "Marketplace, punto de venta, rutas, eventos, asistente de voz, señalética y business intelligence para destinos, alojamientos y agencias. Módulos desde 100 €/mes.",
    data: defaultHome360Content,
  },
  {
    slug: "360-destinos",
    title: "360 — Destinos",
    seoTitle: "Soluciones para destinos turísticos | discoolver 360",
    seoDescription:
      "Plataforma SaaS para ayuntamientos, patronatos y DMO: redistribuye el flujo de visitantes, da datos propios del destino y monetiza el comercio local.",
    data: defaultDestinos360Content,
  },
  {
    slug: "360-alojamientos",
    title: "360 — Alojamientos",
    seoTitle: "Concierge digital para alojamientos | discoolver 360",
    seoDescription:
      "El concierge digital que entra en tu check-in, responde al huésped 24/7 y convierte tus recomendaciones en una línea de ingresos para el alojamiento.",
    data: defaultAlojamientos360Content,
  },
  {
    slug: "360-agencias",
    title: "360 — Agencias y DMC",
    seoTitle: "Agencias, DMC y touroperadores receptivos | discoolver 360",
    seoDescription:
      "Digitalizamos el catálogo local del destino y te damos marketplace y punto de venta para venderlo. Módulos desde 100 €/mes y comisión del 10-15%.",
    data: defaultAgencias360Content,
  },
  {
    slug: "360-demo",
    title: "360 — Pedir demo",
    seoTitle: "Pedir una demo | discoolver 360",
    seoDescription:
      "Media hora con la plataforma funcionando y el despliegue de Ronda abierto. Salimos con una propuesta de por qué módulo empezar y qué cuesta.",
    data: defaultDemo360Content,
  },
  {
    slug: "360-home-en",
    title: "360 — Home (EN)",
    seoTitle: "discoolver 360 — the platform for tourist destinations",
    seoDescription:
      "Marketplace, point of sale, routes, events, voice assistant, signage and Business Intelligence for destinations, accommodation and agencies. Modules from €100/month.",
    data: home360En,
  },
  {
    slug: "360-destinos-en",
    title: "360 — Destinations (EN)",
    seoTitle: "Solutions for tourist destinations | discoolver 360",
    seoDescription:
      "SaaS platform for city councils, tourism boards and DMOs: redistribute visitor flow, own your destination's data and monetize local commerce.",
    data: destinos360En,
  },
  {
    slug: "360-alojamientos-en",
    title: "360 — Accommodation (EN)",
    seoTitle: "Digital concierge for accommodation | discoolver 360",
    seoDescription:
      "The digital concierge that joins your check-in, answers guests 24/7 and turns your recommendations into a revenue line for your property.",
    data: alojamientos360En,
  },
  {
    slug: "360-agencias-en",
    title: "360 — Agencies (EN)",
    seoTitle: "Agencies, DMCs and inbound operators | discoolver 360",
    seoDescription:
      "We digitize the destination's local catalog and give you a marketplace and point of sale to sell it. Net rates for the trade channel.",
    data: agencias360En,
  },
  {
    slug: "360-demo-en",
    title: "360 — Book a demo (EN)",
    seoTitle: "Book a demo | discoolver 360",
    seoDescription:
      "Half an hour with the platform running and the Ronda deployment open. You leave with a proposal: which module to start with and what it costs.",
    data: demo360En,
  },
];

async function findPage(slug: string): Promise<{ id: string } | null> {
  const url = `${SUPABASE_URL}/rest/v1/pages?select=id&project_id=eq.${PROJECT_ID}&slug=eq.${slug}`;
  const res = await fetch(url, { headers: H });
  if (!res.ok) throw new Error(`GET ${slug}: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as { id: string }[];
  return rows[0] ?? null;
}

async function seed(page: Seed) {
  const fields = Object.keys(page.data).length;
  const body = {
    project_id: PROJECT_ID,
    client_slug: CLIENT_SLUG,
    slug: page.slug,
    title: page.title,
    seo_title: page.seoTitle,
    seo_description: page.seoDescription,
    status: "published",
    sections_json: [{ id: "content", type: "flat-fields", data: page.data }],
  };

  const existing = await findPage(page.slug);

  if (DRY) {
    console.log(`· ${page.slug.padEnd(18)} ${existing ? "UPDATE" : "CREATE"}  ${fields} campos`);
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
        body: JSON.stringify({ ...body, section_id: `page-${page.slug}` }),
      });

  if (!res.ok) throw new Error(`${page.slug}: ${res.status} ${await res.text()}`);
  console.log(`✅ ${page.slug.padEnd(18)} ${existing ? "actualizada" : "creada"}  ${fields} campos`);
}

async function main() {
  console.log(DRY ? "— simulacro, no escribe —" : `Sembrando en ${SUPABASE_URL}`);
  for (const page of PAGES) await seed(page);
  const total = PAGES.reduce((n, p) => n + Object.keys(p.data).length, 0);
  console.log(`\n${PAGES.length} páginas · ${total} campos de copy en total`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
