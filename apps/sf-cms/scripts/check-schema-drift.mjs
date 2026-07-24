/**
 * Schema drift check (audit OPS-10) — no Docker needed.
 *
 * PostgREST exposes the live table columns in its OpenAPI doc at `/rest/v1/`.
 * We snapshot the expected columns per table into supabase/schema-snapshot.json
 * and diff the live schema against it. This catches the class of bug that
 * plagued this project (prod drifting from the tracked migrations) without the
 * Docker-based `supabase db diff`.
 *
 *   node scripts/check-schema-drift.mjs           # check, exit 1 on drift
 *   node scripts/check-schema-drift.mjs --update  # rewrite the snapshot
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (from .env.local).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SNAPSHOT = path.join(__dirname, '..', 'supabase', 'schema-snapshot.json')

function env() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
  }
  const p = path.join(__dirname, '..', '.env.local')
  const e = Object.fromEntries(
    fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
  )
  return { url: e.NEXT_PUBLIC_SUPABASE_URL, key: e.SUPABASE_SERVICE_ROLE_KEY }
}

async function liveSchema() {
  const { url, key } = env()
  const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`introspection failed: ${res.status}`)
  const doc = await res.json()
  const defs = doc.definitions ?? {}
  const out = {}
  for (const [table, def] of Object.entries(defs)) {
    out[table] = Object.keys(def.properties ?? {}).sort()
  }
  return out
}

function diff(expected, actual) {
  const problems = []
  for (const table of Object.keys(expected)) {
    if (!actual[table]) {
      problems.push(`MISSING TABLE: ${table}`)
      continue
    }
    const exp = new Set(expected[table])
    const act = new Set(actual[table])
    for (const c of exp) if (!act.has(c)) problems.push(`${table}: missing column '${c}'`)
    for (const c of act) if (!exp.has(c)) problems.push(`${table}: unexpected column '${c}' (update snapshot if intended)`)
  }
  for (const table of Object.keys(actual)) {
    if (!expected[table]) problems.push(`UNTRACKED TABLE: ${table} (update snapshot if intended)`)
  }
  return problems
}

async function main() {
  const actual = await liveSchema()
  if (process.argv.includes('--update')) {
    fs.writeFileSync(SNAPSHOT, JSON.stringify(actual, null, 2) + '\n')
    console.log(`✅  Snapshot updated: ${Object.keys(actual).length} tables`)
    return
  }
  if (!fs.existsSync(SNAPSHOT)) {
    console.error('No snapshot yet. Run with --update first.')
    process.exit(1)
  }
  const expected = JSON.parse(fs.readFileSync(SNAPSHOT, 'utf8'))
  const problems = diff(expected, actual)
  if (problems.length === 0) {
    console.log('✅  Schema matches snapshot — no drift.')
    return
  }
  console.error('❌  Schema drift detected:')
  problems.forEach((p) => console.error('   ·', p))
  process.exit(1)
}

main().catch((e) => {
  console.error('drift check error:', e.message)
  process.exit(1)
})
