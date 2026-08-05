/**
 * Fetches this page's `flat-fields` content from SF-CMS and renders
 * index.template.html -> index.html by replacing {{key}} tokens.
 *
 * Pattern: same safety rules as apps/startup-factory-web/scripts/fetch-cms-content.mjs
 * (established 2026-07-19) — if CMS_API_URL/CMS_API_KEY are unset, or the
 * fetch fails, NEVER touch index.html and NEVER exit(1). The last committed
 * index.html (a fully-rendered snapshot) stays live. A CMS outage must never
 * break this site's deploy or serve a blank page.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const CMS_API_URL = process.env.CMS_API_URL
const CMS_API_KEY = process.env.CMS_API_KEY
const PROJECT_SLUG = process.env.CMS_PROJECT_SLUG || 'discoolver'
const PAGE_SLUG = process.env.CMS_PAGE_SLUG || 'creators-landing'

function render(fields) {
  const templatePath = path.join(ROOT, 'index.template.html')
  const template = fs.readFileSync(templatePath, 'utf8')

  // All-or-nothing: if the CMS page does not carry EVERY token the template
  // needs, we keep the committed index.html untouched. Rendering a partial
  // field set would either ship literal `{{token}}` text to production or,
  // worse, resurrect a stale copy set (2026-08 repositioning renamed every
  // field — an old CMS page must not overwrite the new landing).
  const required = [...new Set([...template.matchAll(/\{\{([a-z0-9_]+)\}\}/g)].map((m) => m[1]))]
  const missing = required.filter((key) => !(key in fields) || fields[key] == null || fields[key] === '')
  if (missing.length) {
    console.warn(
      `⚠️  CMS page is missing ${missing.length}/${required.length} fields (${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}) — keeping existing index.html`
    )
    return
  }

  let html = template
  for (const [key, value] of Object.entries(fields)) {
    html = html.split(`{{${key}}}`).join(value ?? '')
  }
  fs.writeFileSync(path.join(ROOT, 'index.html'), html)
  console.log(`💾  index.html rendered from CMS (${required.length} tokens)`)
}

async function main() {
  if (!CMS_API_URL || !CMS_API_KEY) {
    console.warn('⚠️  CMS_API_URL or CMS_API_KEY not set — keeping existing index.html')
    return
  }

  try {
    const url = `${CMS_API_URL}/pages?project=${PROJECT_SLUG}&slug=${PAGE_SLUG}`
    const res = await fetch(url, { headers: { 'x-api-key': CMS_API_KEY } })
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)

    const page = await res.json()
    const contentSection = (page.sections_json || []).find((s) => s.type === 'flat-fields')
    if (!contentSection) throw new Error('No flat-fields section found on this page')

    render(contentSection.data)
  } catch (err) {
    console.warn('⚠️  CMS fetch failed:', err.message, '— keeping existing index.html (never failing the build)')
  }
}

main()
