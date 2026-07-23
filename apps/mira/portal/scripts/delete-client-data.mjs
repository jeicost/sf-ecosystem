#!/usr/bin/env node

// ===================================================================
// CLIENT DATA DELETION SCRIPT (admin-triggered, not self-service)
//
// RUNBOOK — when/how to use this:
//   1. A client requests data deletion (typically via email, GDPR-style).
//   2. Admin runs this script with NO --confirm flag (dry-run is the
//      default, safe behavior — see below). It looks up the client and
//      prints exact row counts per table for everything that would be
//      deleted. Zero writes happen in this mode.
//   3. Admin reviews the dry-run output and confirms with the client
//      what will be deleted (in particular: the crm_contacts note, since
//      that table is shared with sf-crm and is NOT deleted by this
//      script — see below).
//   4. Admin re-runs with --confirm to actually perform the deletion.
//   5. Optionally add --delete-auth-user to also remove the client's
//      Supabase auth.users record(s), but only for users who don't still
//      have mira_project_access to some OTHER client.
//
// Usage:
//   node scripts/delete-client-data.mjs --slug client-slug [--dry-run]
//   node scripts/delete-client-data.mjs --client-id <uuid> --confirm [--delete-auth-user]
//
// Safety model (deliberately NOT the same as onboard-full-client.mjs's
// --dry-run flag): dry-run is the DEFAULT even if you don't pass
// --dry-run. Nothing destructive happens unless you pass --confirm
// explicitly. Passing --dry-run always forces dry-run even if --confirm
// is also present (belt and suspenders).
//
// Requires SUPABASE_SERVICE_ROLE_KEY from environment (never hardcoded)
// ===================================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Argument parsing (same convention as onboard-full-client.mjs) ──
function parseArgs(argv) {
  const flags = new Map()
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    if (key.includes('=')) {
      const [k, v] = key.split('=')
      flags.set(k, v)
      continue
    }
    const next = argv[i + 1]
    if (next !== undefined && !next.startsWith('--')) {
      flags.set(key, next)
      i++
    } else {
      flags.set(key, true)
    }
  }
  return flags
}

const flags = parseArgs(process.argv.slice(2))

const clientIdArg = flags.get('client-id')
const slugArg = flags.get('slug')
const confirmed = flags.has('confirm')
const explicitDryRun = flags.has('dry-run')
const deleteAuthUser = flags.has('delete-auth-user')

// --confirm is the only thing that unlocks writes; --dry-run always wins if both are passed.
const dryRun = explicitDryRun || !confirmed

if (!clientIdArg && !slugArg) {
  console.error('❌ Error: --client-id or --slug is required')
  console.error(`
Usage:
  node scripts/delete-client-data.mjs --slug client-slug [--dry-run]
  node scripts/delete-client-data.mjs --client-id <uuid> --confirm [--delete-auth-user]
`)
  process.exit(1)
}

// ── Tables with a direct client_id column referencing clients(id).
// Most of these already have ON DELETE CASCADE in the DB (see supabase/migrations);
// six of them (marked below) only get that FK once 0043_client_deletion_cascades.sql
// is applied. This script deletes explicitly from ALL of them regardless, so it
// works correctly whether or not 0043 has been run yet.
const KNOWN_TABLES = [
  { table: 'generation_queue', label: 'Toolkit generation jobs' },
  { table: 'deliverables', label: 'Generated deliverables' },
  { table: 'quick_actions_results', label: 'Quick Actions results' },
  { table: 'client_documentation', label: 'Client documentation (RAG)' },
  { table: 'brand_profiles', label: 'Brand profile' },
  { table: 'content_pillars', label: 'Content pillars' },
  { table: 'agent_activity', label: 'Agent activity log' },
  { table: 'project_memory', label: 'Project memory entries' },
  { table: 'brand_documents', label: 'Brand documents' },
  { table: 'agent_settings', label: 'Agent settings' },
  { table: 'agent_documents', label: 'Agent documents' },
  { table: 'mira_projects', label: 'Sub-projects' },
  { table: 'drive_folders', label: 'Google Drive folder selections' },
  { table: 'client_workspaces', label: 'sf-crm workspace bridge row' },
  { table: 'oauth_sessions', label: 'OAuth PKCE sessions (transient)' },
  { table: 'visual_jobs', label: 'Visual generation jobs' },
  { table: 'visual_assets', label: 'Visual assets' },
  { table: 'visual_feedback', label: 'Visual feedback' },
  { table: 'visual_approvals', label: 'Visual approvals' },
  { table: 'mira_usage_log', label: 'Token usage log' },
  { table: 'tool_connections', label: 'BYO tool connections (API keys)' },
  { table: 'affiliate_tracking', label: 'Affiliate tracking' },
  { table: 'tool_setup_progress', label: 'Tool setup progress' },
  // fixed by 0043_client_deletion_cascades.sql — deleted explicitly here either way
  { table: 'leads', label: 'Sales leads', pendingCascade: true },
  { table: 'approval_queue', label: 'Content approval queue', pendingCascade: true },
  { table: 'post_history', label: 'Published post history', pendingCascade: true },
  { table: 'alerts', label: 'Alerts', pendingCascade: true },
  { table: 'agent_interactions', label: 'Agent interaction log', pendingCascade: true },
  { table: 'drive_connections', label: 'Google Drive OAuth connection', pendingCascade: true },
]

// ── Tables referenced in app code with an unconfirmed schema (see
// 0031_baseline_missing_tables.sql: "requieren introspección manual"). We
// probe them read-only; only included in the deletion plan if the probe
// succeeds (table + client_id column both exist).
const SPECULATIVE_TABLES = [
  { table: 'icp_profiles', label: 'ICP profiles (unconfirmed schema)' },
  { table: 'brand_references', label: 'Brand references (unconfirmed schema)' },
  { table: 'proposal_library', label: 'Proposal library (unconfirmed schema)' },
  { table: 'lead_activities', label: 'Lead activities (unconfirmed schema)' },
  { table: 'prospect_context', label: 'Prospect context (unconfirmed schema)' },
]

async function findClient() {
  const query = supabase.from('clients').select('id, name, slug')
  const { data, error } = clientIdArg
    ? await query.eq('id', clientIdArg).maybeSingle()
    : await query.eq('slug', slugArg).maybeSingle()

  if (error) throw new Error(`Error looking up client: ${error.message}`)
  if (!data) throw new Error(`No client found for ${clientIdArg ? `id ${clientIdArg}` : `slug ${slugArg}`}`)
  return data
}

async function countRows(table, column, clientId) {
  // '*' (not 'id') because client_workspaces has no 'id' column — client_id
  // is its primary key (0034). head:true means no rows are actually fetched.
  //
  // PostgREST quirk (confirmed live): a head:true count against a table that
  // doesn't exist returns success:true, count:null, status 204 -- NOT an
  // error. Only a non-head select/delete against the same missing table
  // 404s with PGRST205. A real, existing table with zero matching rows
  // returns count:0 (a number), never null. So `count === null` is the
  // actual "table doesn't exist" signal here, not `error` -- checking only
  // `error` (as an earlier version of this function did) silently treats
  // every missing table as "found, 0 rows" and later fails hard the moment
  // deleteKnownTables() tries to actually delete from it.
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, clientId)

  if (error) return { found: false, count: 0, error: error.message }
  if (count === null) return { found: false, count: 0, error: 'table not found in schema cache' }
  return { found: true, count }
}

async function buildReport(clientId) {
  const report = { known: [], speculative: [], grants: [], crmContacts: null }

  for (const entry of KNOWN_TABLES) {
    const result = await countRows(entry.table, 'client_id', clientId)
    report.known.push({ ...entry, ...result })
  }

  for (const entry of SPECULATIVE_TABLES) {
    const result = await countRows(entry.table, 'client_id', clientId)
    report.speculative.push({ ...entry, ...result })
  }

  const { data: grants, error: grantsError } = await supabase
    .from('mira_project_access')
    .select('id, user_id, role')
    .eq('project_id', clientId)
  if (grantsError) throw new Error(`Error reading mira_project_access: ${grantsError.message}`)
  report.grants = grants ?? []

  // crm_contacts: bridged via client_workspaces.workspace_id (text), shared with
  // sf-crm — never deleted by this script, informational only.
  const { data: bridge } = await supabase
    .from('client_workspaces')
    .select('workspace')
    .eq('client_id', clientId)
    .maybeSingle()

  if (bridge?.workspace) {
    const { count } = await supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', bridge.workspace)
    report.crmContacts = { workspace: bridge.workspace, count: count ?? 0 }
  }

  return report
}

function printReport(client, report) {
  console.log(`\n📋 Deletion plan for client: ${client.name} (slug: ${client.slug}, id: ${client.id})`)

  console.log('\n   Known tables (client_id -> clients.id):')
  let total = 0
  for (const row of report.known) {
    const flag = row.pendingCascade ? ' [pending FK — 0043 not applied yet]' : ''
    if (!row.found) {
      console.log(`   - ${row.table.padEnd(24)} skipped (${row.error})`)
      continue
    }
    console.log(`   - ${row.table.padEnd(24)} ${String(row.count).padStart(4)} row(s)  ${row.label}${flag}`)
    total += row.count
  }

  const speculativeFound = report.speculative.filter((r) => r.found)
  if (speculativeFound.length > 0) {
    console.log('\n   Speculative tables (schema unconfirmed, found to exist):')
    for (const row of speculativeFound) {
      console.log(`   - ${row.table.padEnd(24)} ${String(row.count).padStart(4)} row(s)  ${row.label}`)
      total += row.count
    }
  }

  console.log(`\n   mira_project_access grants for this client: ${report.grants.length}`)
  for (const g of report.grants) {
    console.log(`   - user_id ${g.user_id} (role: ${g.role})`)
  }

  console.log(`\n   Total MIRA-owned rows to delete: ${total}`)

  console.log('\n   ⚠️  NOT deleted by this script (see comments):')
  console.log('   - usage_log: excluded entirely — that table belongs to sf-sales-engine')
  console.log('     (0033 was a silent no-op; the real live table has an incompatible schema).')
  if (report.crmContacts) {
    console.log(
      `   - crm_contacts: ${report.crmContacts.count} row(s) under workspace_id "${report.crmContacts.workspace}" ` +
        `— shared with sf-crm, coordinate separately if the client also wants those purged.`
    )
  } else {
    console.log('   - crm_contacts: no client_workspaces bridge row found for this client — nothing to check.')
  }

  return total
}

async function deleteKnownTables(client, report) {
  const results = []
  for (const row of [...report.known, ...report.speculative.filter((r) => r.found)]) {
    if (!row.found) continue
    const { error, count } = await supabase.from(row.table).delete({ count: 'exact' }).eq('client_id', client.id)
    if (error) throw new Error(`Error deleting from ${row.table}: ${error.message}`)
    results.push({ table: row.table, deleted: count ?? 0 })
  }
  return results
}

async function deleteGrantsAndClient(client) {
  const { error: grantsError, count: grantsDeleted } = await supabase
    .from('mira_project_access')
    .delete({ count: 'exact' })
    .eq('project_id', client.id)
  if (grantsError) throw new Error(`Error deleting mira_project_access: ${grantsError.message}`)

  const { error: clientError } = await supabase.from('clients').delete().eq('id', client.id)
  if (clientError) throw new Error(`Error deleting clients row: ${clientError.message}`)

  return { grantsDeleted: grantsDeleted ?? 0 }
}

async function deleteOrphanedAuthUsers(userIds) {
  const results = []
  for (const userId of userIds) {
    const { data: remaining, error } = await supabase
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', userId)

    if (error) {
      results.push({ userId, status: 'error', detail: error.message })
      continue
    }

    if (remaining && remaining.length > 0) {
      results.push({
        userId,
        status: 'kept',
        detail: `still has access to ${remaining.length} other client(s): ${remaining.map((r) => r.project_id).join(', ')}`,
      })
      continue
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteError) {
      results.push({ userId, status: 'error', detail: deleteError.message })
    } else {
      results.push({ userId, status: 'deleted', detail: 'no other client grants remained' })
    }
  }
  return results
}

async function main() {
  console.log(`\n🗑️  Client data deletion${dryRun ? ' — DRY RUN (no writes will be made)' : ''}`)

  const client = await findClient()
  const report = await buildReport(client.id)
  const totalRows = printReport(client, report)

  if (dryRun) {
    console.log('\n✅ Dry run complete. No rows were deleted.')
    console.log('   Re-run with --confirm to actually delete this client and its data.')
    return
  }

  console.log(`\n🚨 Deleting ${totalRows} row(s) across ${report.known.length + report.speculative.length} table(s) plus the clients row itself...`)

  const grantUserIds = report.grants.map((g) => g.user_id)

  const tableResults = await deleteKnownTables(client, report)
  const { grantsDeleted } = await deleteGrantsAndClient(client)

  console.log('\n✨ Deletion checklist')
  for (const r of tableResults) {
    console.log(`   ${r.table.padEnd(24)} ✅ deleted ${r.deleted} row(s)`)
  }
  console.log(`   mira_project_access${' '.repeat(6)} ✅ deleted ${grantsDeleted} grant(s)`)
  console.log(`   clients row${' '.repeat(14)} ✅ deleted (${client.id})`)

  if (deleteAuthUser) {
    if (grantUserIds.length === 0) {
      console.log('\n👤 --delete-auth-user: no users had grants for this client, nothing to check.')
    } else {
      console.log('\n👤 --delete-auth-user: checking for orphaned auth users...')
      const authResults = await deleteOrphanedAuthUsers(grantUserIds)
      for (const r of authResults) {
        const icon = r.status === 'deleted' ? '✅' : r.status === 'kept' ? '⚠️ ' : '❌'
        console.log(`   ${icon} ${r.userId} — ${r.status} (${r.detail})`)
      }
    }
  } else if (grantUserIds.length > 0) {
    console.log(`\n👤 ${grantUserIds.length} user(s) lost access to this client. Pass --delete-auth-user to also remove their auth.users record if they have no other client access.`)
  }

  console.log('')
}

main().catch((err) => {
  console.error('❌ Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
