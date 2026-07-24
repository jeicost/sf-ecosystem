/**
 * Adrian Grooves — build-time CMS bake (SF-CMS).
 * Runs BEFORE `next build` (see package.json). Writes content/pages.json +
 * content/settings.json from the CMS so the site renders CMS overrides on top
 * of the hardcoded fallbacks. A CMS outage must NEVER fail the build:
 * missing env → exit(0); fetch failure → keep cached content, exit(0).
 *
 * Env (accepts canonical SF_CMS_* or legacy CMS_*):
 *   SF_CMS_API_URL   e.g. https://cms.startupsfactory.es/api/public
 *   SF_CMS_API_KEY   project api_key (sk_...)
 *   SF_CMS_PROJECT_SLUG  default 'adrian-grooves'
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')

const CMS_API_URL = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
const CMS_API_KEY = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
const PROJECT_SLUG = process.env.SF_CMS_PROJECT_SLUG || process.env.PROJECT_SLUG || 'adrian-grooves'
const HEADERS = { 'x-api-key': CMS_API_KEY }

function ensureContentFiles() {
  fs.mkdirSync(CONTENT, { recursive: true })
  const files = { 'pages.json': '{}', 'settings.json': '{"ga_measurement_id":null,"gtm_container_id":null}' }
  for (const [name, empty] of Object.entries(files)) {
    const p = path.join(CONTENT, name)
    if (!fs.existsSync(p)) fs.writeFileSync(p, empty)
  }
}

if (!CMS_API_URL || !CMS_API_KEY) {
  console.warn('⚠️  SF_CMS_API_URL/SF_CMS_API_KEY not set — skipping fetch, using hardcoded content')
  ensureContentFiles()
  process.exit(0)
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  try {
    console.log(`📡  Fetching CMS content (project: ${PROJECT_SLUG})…`)
    const [{ pages }, settings] = await Promise.all([
      fetchJson(`${CMS_API_URL}/pages?project=${PROJECT_SLUG}`),
      fetchJson(`${CMS_API_URL}/settings?project=${PROJECT_SLUG}`).catch(() => ({})),
    ])

    // Normalize pages: keyed by slug → { sections keyed by section.id, pixels }
    const normalizedPages = {}
    for (const page of pages ?? []) {
      const sections = {}
      for (const s of page.sections_json ?? []) {
        const key = s.id ?? s.type
        sections[key] = { type: s.type, data: s.data ?? {} }
      }
      normalizedPages[page.slug] = {
        title: page.title,
        seoTitle: page.seo_title || page.title,
        seoDescription: page.seo_description ?? '',
        sections,
        pixels: page.pixels ?? {},
        updatedAt: page.updated_at,
      }
    }

    fs.mkdirSync(CONTENT, { recursive: true })
    fs.writeFileSync(path.join(CONTENT, 'pages.json'), JSON.stringify(normalizedPages, null, 2))
    fs.writeFileSync(
      path.join(CONTENT, 'settings.json'),
      JSON.stringify(
        { ga_measurement_id: settings?.ga_measurement_id ?? null, gtm_container_id: settings?.gtm_container_id ?? null },
        null,
        2,
      ),
    )
    console.log(`✅  Baked ${Object.keys(normalizedPages).length} page(s) from CMS`)
  } catch (err) {
    // Never exit(1): keep whatever cached content exists (or empty), build on.
    console.warn('⚠️  CMS fetch failed:', err.message, '— using cached/hardcoded content')
    ensureContentFiles()
  }
}

main()
