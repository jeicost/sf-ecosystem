/**
 * Crea las páginas en tailandés en SF-CMS copiando el contenido INGLÉS.
 *
 *   SF_CMS_SUPABASE_URL=… SF_CMS_SUPABASE_SERVICE_KEY=… node scripts/seed-cms-th.mjs [--dry]
 *   (las credenciales están en apps/sf-cms/.env.local)
 *
 * POR QUÉ EL INGLÉS Y NO TAILANDÉS. Es el punto de partida para que Nirada
 * traduzca desde el CMS. Sembrar tailandés de máquina sería publicar una
 * traducción sin revisar, que es justo lo que se decidió no hacer: en este
 * negocio ya hubo un precedente caro —la carta tailandesa de Grab de Salsa
 * llevaba alérgenos sin declarar—. Mientras tanto las rutas /th van con
 * noindex, así que Google no ve páginas a medias.
 *
 * IDEMPOTENTE: si la página -th ya existe NO la toca, para no pisar lo que
 * Nirada haya traducido. Para forzar el reinicio de una, borrarla en el CMS.
 */
const PROJECT_ID = 'e48e7a0b-e6cb-48d9-9633-00fe079d4118' // NC Global Assets
const BASES = ['home', 'about', 'services', 'contact']

const URL = process.env.SF_CMS_SUPABASE_URL?.replace(/\/$/, '')
const KEY = process.env.SF_CMS_SUPABASE_SERVICE_KEY
const DRY = process.argv.includes('--dry')

if (!URL || !KEY) {
  console.error('✗ Faltan SF_CMS_SUPABASE_URL / SF_CMS_SUPABASE_SERVICE_KEY (ver apps/sf-cms/.env.local)')
  process.exit(1)
}
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function pagina(slug) {
  const r = await fetch(
    `${URL}/rest/v1/pages?project_id=eq.${PROJECT_ID}&slug=eq.${slug}&select=id,slug,sections_json,seo_title,seo_description`,
    { headers: H },
  )
  const rows = await r.json()
  return rows[0] ?? null
}

async function main() {
  console.log(DRY ? '— simulacro —' : `Sembrando en ${URL}`)
  for (const base of BASES) {
    const origen = await pagina(base)
    if (!origen) { console.log(`✗ ${base}: no existe en el CMS, se salta`); continue }

    const destinoSlug = `${base}-th`
    const yaEsta = await pagina(destinoSlug)
    if (yaEsta) { console.log(`· ${destinoSlug.padEnd(14)} ya existe — NO se toca`); continue }

    const campos = JSON.stringify(origen.sections_json ?? []).length
    if (DRY) { console.log(`· ${destinoSlug.padEnd(14)} se crearía (${campos} bytes de copy)`); continue }

    const res = await fetch(`${URL}/rest/v1/pages`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        project_id: PROJECT_ID,
        client_slug: 'ncglobalassets',
        slug: destinoSlug,
        title: `${base} (TH)`,
        section_id: `page-${destinoSlug}`,
        sections_json: origen.sections_json,
        seo_title: origen.seo_title,
        seo_description: origen.seo_description,
        status: 'published',
      }),
    })
    if (!res.ok) throw new Error(`${destinoSlug}: ${res.status} ${await res.text()}`)
    console.log(`✅ ${destinoSlug.padEnd(14)} creada  (${campos} bytes de copy en inglés, para traducir)`)
  }
}

main().catch((e) => { console.error('✗', e.message); process.exit(1) })
