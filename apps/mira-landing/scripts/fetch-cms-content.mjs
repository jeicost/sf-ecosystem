/**
 * MIRA landing — bake del contenido de SF-CMS en tiempo de build.
 *
 * Corre ANTES de `next build` (ver package.json). Se trae las páginas de
 * PAGE_SLUGS del proyecto `mira` —cada una con una sola sección `flat-fields`
 * (id: "content") con todo el copy— y escribe content/pages.json, que es lo que
 * lee lib/cms-pages.ts para pisar los fallbacks de lib/content/.
 *
 * CONTRATO DE SEGURIDAD (el mismo de discoolver/web y adrian-grooves): un CMS
 * caído, lento, sin envs o con la página en draft NUNCA puede tumbar el build.
 * Una landing con el copy de la semana pasada es un incidente menor; una landing
 * que no despliega es una caída. Por eso: nunca `exit(1)`, y si falla una página
 * se conserva lo que hubiera y se sigue con las demás.
 *
 * Env (acepta el nombre canónico SF_CMS_* o el legacy CMS_*):
 *   SF_CMS_API_URL       p.ej. https://cms.startupsfactory.es/api/public
 *   SF_CMS_API_KEY       api_key del proyecto en el CMS
 *   SF_CMS_PROJECT_SLUG  por defecto 'mira'
 *
 * Sin API_URL/API_KEY el script no es un error: escribe un pages.json vacío y
 * la web renderiza el castellano/inglés hardcodeado. Es el estado normal en
 * local y el estado seguro en Vercel mientras no se configuren las variables.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CONTENT = path.join(ROOT, 'content')
const PAGES_JSON = path.join(CONTENT, 'pages.json')

const CMS_API_URL = process.env.SF_CMS_API_URL || process.env.CMS_API_URL
const CMS_API_KEY = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY
const PROJECT_SLUG = process.env.SF_CMS_PROJECT_SLUG || process.env.CMS_PROJECT_SLUG || 'mira'
const HEADERS = { 'x-api-key': CMS_API_KEY }

// Castellano en / (slug `home`), inglés en /en (slug `home-en`).
const PAGE_SLUGS = ['home', 'home-en']

/** content/pages.json tiene que existir siempre: lib/cms-pages.ts hace require() de él. */
function ensureContentFile() {
  fs.mkdirSync(CONTENT, { recursive: true })
  if (!fs.existsSync(PAGES_JSON)) fs.writeFileSync(PAGES_JSON, '{}')
}

if (!CMS_API_URL || !CMS_API_KEY) {
  console.warn('⚠️  SF_CMS_API_URL/SF_CMS_API_KEY sin definir — se usa el copy hardcodeado')
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
      const data = await fetchJson(`${CMS_API_URL}/pages?project=${PROJECT_SLUG}&slug=${slug}`)
      // La API devuelve la página suelta cuando se filtra por slug, pero se
      // acepta también la forma en lista por si cambia la query.
      const page = Array.isArray(data?.pages) ? data.pages[0] : Array.isArray(data) ? data[0] : data
      if (!page?.sections_json) {
        console.warn(`⚠️  "${slug}" sin contenido en el CMS — se mantiene el fallback`)
        continue
      }
      const sections = {}
      for (const s of page.sections_json) {
        const key = s.id ?? s.type
        if (key) sections[key] = { type: s.type, data: s.data ?? {} }
      }
      pages[slug] = { title: page.title, sections, updatedAt: page.updated_at }
      const campos = Object.keys(sections.content?.data ?? {}).length
      console.log(`✅  "${slug}" descargada (${campos} campos)`)
    } catch (err) {
      console.warn(`⚠️  Fallo al descargar "${slug}":`, err.message, '— se mantiene el fallback')
    }
  }

  // Si no se pudo traer NADA, no se pisa el pages.json anterior: en un rebuild
  // con el CMS caído es preferible republicar el bake previo a quedarse sin él.
  if (Object.keys(pages).length === 0) {
    console.warn('⚠️  El CMS no devolvió ninguna página — se conserva el pages.json anterior')
    ensureContentFile()
    return
  }

  fs.mkdirSync(CONTENT, { recursive: true })
  fs.writeFileSync(PAGES_JSON, JSON.stringify(pages, null, 2))
  console.log(`💾  content/pages.json escrito (${Object.keys(pages).length} página(s) del CMS)`)
}

main().catch((err) => {
  // Nunca exit(1): una caída del CMS no puede tumbar el build de la landing.
  console.warn('⚠️  Error inesperado en fetch-cms-content:', err.message, '— se usa el contenido cacheado')
  ensureContentFile()
})
