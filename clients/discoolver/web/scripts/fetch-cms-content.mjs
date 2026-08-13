/**
 * Discoolver web — build-time CMS bake (SF-CMS).
 * Runs BEFORE `next build` (see package.json). Fetches the pages listed in
 * PAGE_SLUGS from SF-CMS — each page has a single `flat-fields` section
 * (id: "content") holding editable copy — and writes content/pages.json so the
 * site renders CMS overrides on top of the hardcoded fallbacks in
 * lib/content/{home,influencers}.ts and lib/content/b360/*.ts.
 *
 * Same safety contract as clients/adrian-grooves/scripts/fetch-cms-content.mjs
 * and clients/discoolver/creators-landing/scripts/build-static.mjs: a CMS
 * outage (missing env, network failure, unpublished page) must NEVER fail
 * the build or blank the site. Missing env -> exit(0) with empty content.
 * Fetch failure -> warn, keep cached/empty content, exit(0). Never exit(1).
 *
 * Env (accepts canonical SF_CMS_* or legacy CMS_*):
 *   SF_CMS_API_URL       e.g. https://cms.startupsfactory.es/api/public
 *   SF_CMS_API_KEY        project api_key (sk_...)
 *   SF_CMS_PROJECT_SLUG   default 'discoolver'
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')

const CMS_API_URL = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
const CMS_API_KEY = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
const PROJECT_SLUG = process.env.SF_CMS_PROJECT_SLUG || process.env.CMS_PROJECT_SLUG || 'discoolver'
const HEADERS = { 'x-api-key': CMS_API_KEY }

// Las de 360 van prefijadas: el proyecto `discoolver` del CMS sirve a varias webs
// y los slugs no se pueden repetir entre ellas (`home` ya es el de la tienda de
// guías; `app-home` y `app-influencers`, los de la landing de la app).
const PAGE_SLUGS = [
  // `app-home` es la home del dominio desde el 12-ago-2026: la landing de la
  // plataforma se mudó aquí y la tienda de guías pasó a /guias, que sigue
  // usando el slug `home` de siempre para no re-sembrar el CMS.
  'app-home',
  'app-home-en',
  'home',
  'influencers',
  '360-home',
  '360-destinos',
  '360-alojamientos',
  '360-agencias',
  '360-demo',
  // inglés — espejo -en de cada página
  'home-en',
  'influencers-en',
  '360-home-en',
  '360-destinos-en',
  '360-alojamientos-en',
  '360-agencias-en',
  '360-demo-en',
]

function ensureContentFile() {
  fs.mkdirSync(CONTENT, { recursive: true })
  const p = path.join(CONTENT, 'pages.json')
  if (!fs.existsSync(p)) fs.writeFileSync(p, '{}')
  // El blog es SSG: sin este fichero, /blog reventaría el build en vez de
  // renderizar vacío. Mismo criterio que pages.json — nunca exit(1).
  const q = path.join(CONTENT, 'posts.json')
  if (!fs.existsSync(q)) fs.writeFileSync(q, '[]')
}

if (!CMS_API_URL || !CMS_API_KEY) {
  console.warn('⚠️  SF_CMS_API_URL/SF_CMS_API_KEY not set — skipping fetch, using hardcoded content')
  ensureContentFile()
  process.exit(0)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const pages = {}

  for (const slug of PAGE_SLUGS) {
    try {
      const url = `${CMS_API_URL}/pages?project=${PROJECT_SLUG}&slug=${slug}`
      const data = await fetchJson(url)
      // API may return a single page object or { pages: [...] } depending on query shape.
      const page = Array.isArray(data?.pages) ? data.pages[0] : Array.isArray(data) ? data[0] : data
      if (!page) {
        console.warn(`⚠️  No page found for slug "${slug}" — keeping hardcoded fallback`)
        continue
      }
      const sections = {}
      for (const s of page.sections_json ?? []) {
        const key = s.id ?? s.type
        sections[key] = { type: s.type, data: s.data ?? {} }
      }
      pages[slug] = {
        title: page.title,
        sections,
        updatedAt: page.updated_at,
      }
      console.log(`✅  Fetched "${slug}" (${Object.keys(sections).length} section(s))`)
    } catch (err) {
      console.warn(`⚠️  CMS fetch failed for "${slug}":`, err.message, '— keeping hardcoded fallback')
    }
  }

  fs.mkdirSync(CONTENT, { recursive: true })
  fs.writeFileSync(path.join(CONTENT, 'pages.json'), JSON.stringify(pages, null, 2))
  console.log(`💾  content/pages.json written (${Object.keys(pages).length} page(s) from CMS)`)

  // ── El blog ───────────────────────────────────────────────────────────────
  // Los artículos viven en la tabla `posts` del CMS, no en `pages`, y salen por
  // otro endpoint. Se hornean igual: un JSON que el build convierte en páginas
  // estáticas. Si el CMS no responde, se conserva el posts.json anterior en vez
  // de dejar el blog vacío — un blog que desaparece en un deploy es peor que uno
  // con un artículo desactualizado.
  //
  // Aquí se copia lo que manda el CMS TAL CUAL, sin tocarlo. El saneado del
  // rescate del WordPress viejo (enlaces muertos, títulos cortados a media
  // palabra, meta descriptions repetidas) vive en lib/posts.ts, al leer, y no
  // aquí: precisamente porque este bloque puede no llegar a correr —sin envs o
  // con el CMS caído se conserva el posts.json de antes— y ese fichero también
  // tiene que salir limpio.
  try {
    const data = await fetchJson(`${CMS_API_URL}/posts?project=${PROJECT_SLUG}&limit=200`)
    const crudos = Array.isArray(data?.posts) ? data.posts : Array.isArray(data) ? data : []
    const posts = crudos.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      contentHtml: p.content_html ?? '',
      category: p.category ?? '',
      author: p.author_name ?? 'Discoolver',
      date: p.published_at?.split('T')[0] ?? '',
      seoTitle: p.seo_title || p.title,
      seoDescription: p.seo_description ?? p.excerpt ?? '',
      ogImage: p.og_image_url ?? '',
    }))
    fs.writeFileSync(path.join(CONTENT, 'posts.json'), JSON.stringify(posts, null, 2))
    console.log(`💾  content/posts.json written (${posts.length} post(s) from CMS)`)
  } catch (err) {
    console.warn('⚠️  CMS posts fetch failed:', err.message, '— keeping previous posts.json')
    ensureContentFile()
  }
}

main().catch((err) => {
  // Never exit(1): a CMS outage must never fail this site's build.
  console.warn('⚠️  Unexpected error in fetch-cms-content:', err.message, '— keeping cached/hardcoded content')
  ensureContentFile()
})
