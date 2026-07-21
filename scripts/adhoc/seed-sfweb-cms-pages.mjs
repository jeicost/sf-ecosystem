/**
 * Seed the 12 startupsfactory pages in SF-CMS with EMPTY override sections
 * (CMS editing becomes opt-in per field; sites render identically until an
 * override is written). Insert shape mirrors POST /api/admin/pages
 * (client_slug + section_id are NOT NULL drift columns). Idempotent: skips
 * slugs that already exist.
 *
 * Env: reads apps/sf-cms/.env.local for SUPABASE_SERVICE_ROLE_KEY + URL.
 */
import fs from 'node:fs'
import crypto from 'node:crypto'

const envFile = fs.readFileSync(new URL('../../apps/sf-cms/.env.local', import.meta.url), 'utf8')
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

const CONTENT_PAGES = ['programa', 'growth-partner', 'team-as-a-service', 'corporates', 'contacto', 'venture', 'emprendedores', 'startups', 'equipo', 'casos']

async function main() {
  const projects = await fetch(`${URL_}/rest/v1/projects?slug=eq.startupsfactory&select=id,client_slug`, { headers: H }).then(r => r.json())
  if (!projects[0]) throw new Error('project startupsfactory not found')
  const { id: project_id, client_slug } = projects[0]

  const existing = await fetch(`${URL_}/rest/v1/pages?project_id=eq.${project_id}&select=slug`, { headers: H }).then(r => r.json())
  const have = new Set(existing.map(p => p.slug))
  console.log('existing slugs:', [...have].join(', ') || '(none)')

  const rows = []
  for (const slug of CONTENT_PAGES) {
    if (have.has(slug)) continue
    rows.push({
      project_id, client_slug,
      section_id: `page-${slug}-${crypto.randomBytes(4).toString('hex')}`,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      slug, status: 'published',
      sections_json: [{ id: 'content', type: 'content', data: {} }],
    })
  }
  if (!have.has('faq')) {
    rows.push({
      project_id, client_slug,
      section_id: `page-faq-${crypto.randomBytes(4).toString('hex')}`,
      title: 'FAQ', slug: 'faq', status: 'published',
      sections_json: [
        { id: 'hero', type: 'hero', data: {} },
        { id: 'faq', type: 'faq', data: {} },
        { id: 'extra-faqs', type: 'faq', data: {} },
        { id: 'cta', type: 'cta', data: {} },
      ],
    })
  }

  if (!rows.length) { console.log('nothing to seed'); return }
  const res = await fetch(`${URL_}/rest/v1/pages`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(rows) })
  const body = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(body))
  console.log(`seeded ${body.length} pages:`, body.map(p => p.slug).join(', '))
}
main()
