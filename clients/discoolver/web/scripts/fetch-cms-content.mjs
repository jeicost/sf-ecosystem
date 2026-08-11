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
}

main().catch((err) => {
  // Never exit(1): a CMS outage must never fail this site's build.
  console.warn('⚠️  Unexpected error in fetch-cms-content:', err.message, '— keeping cached/hardcoded content')
  ensureContentFile()
})
