/**
 * SF-CMS application-level backup (audit OPS-06). Dumps every content table
 * to a single timestamped JSON file. Runs nightly in CI (uploaded as an
 * artifact) and by hand for an on-demand snapshot before risky changes.
 *
 * The audit flagged that the only backup story was "trust Supabase". This is
 * a portable, greppable, restore-anywhere export that doesn't depend on the
 * Supabase dashboard.
 *
 * Env (from .env.local locally, or CI secrets):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional arg: output path (default ./backups/sf-cms-<ISO>.json)
 */
import fs from 'node:fs'
import path from 'node:path'

const TABLES = [
  'projects',
  'pages',
  'page_versions',
  'posts',
  'posts_revisions',
  'media',
  'audit_log',
  'section_types',
]

function loadEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) return { url, key }
  // fall back to .env.local next to the app
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const env = Object.fromEntries(
      fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((l) => l.includes('='))
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
    )
    return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.SUPABASE_SERVICE_ROLE_KEY }
  }
  return { url: undefined, key: undefined }
}

async function fetchAll(base, key, table) {
  const rows = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const res = await fetch(
      `${base}/rest/v1/${table}?select=*&order=created_at.asc&limit=${pageSize}&offset=${offset}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`)
    const batch = await res.json()
    rows.push(...batch)
    if (batch.length < pageSize) break
  }
  return rows
}

async function main() {
  const { url, key } = loadEnv()
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  // Date.now via env-injected timestamp is fine here (plain node script).
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const out = process.argv[2] || path.join(process.cwd(), 'backups', `sf-cms-${stamp}.json`)
  fs.mkdirSync(path.dirname(out), { recursive: true })

  const dump = { exported_at: new Date().toISOString(), project: 'dmzecrlkclocqaywkjtc', tables: {} }
  for (const table of TABLES) {
    try {
      const rows = await fetchAll(url, key, table)
      dump.tables[table] = rows
      console.log(`  ${table}: ${rows.length} rows`)
    } catch (err) {
      console.warn(`  ${table}: SKIPPED (${err.message})`)
      dump.tables[table] = { error: err.message }
    }
  }

  fs.writeFileSync(out, JSON.stringify(dump, null, 2))
  const kb = Math.round(fs.statSync(out).size / 1024)
  console.log(`✅  Backup written: ${out} (${kb} KB)`)
}

main()
