#!/usr/bin/env node

// ===================================================================
// FULL CLIENT ONBOARDING SCRIPT (consolidated, idempotent)
//
// Replaces the previous 3-step manual flow with one command:
//   1. clients row + brand_profiles row      (was: onboard-client.ts)
//   2. Supabase auth user + recovery link    (was: create-admin.mjs)
//   3. mira_project_access grant             (was: audit-and-fix-users.ts's addToProjectAccess)
//
// Every step checks for an existing row/user first, so re-running the
// same command twice is safe (no duplicate rows, no hard failure).
//
// Requires SUPABASE_SERVICE_ROLE_KEY from environment (never hardcoded)
// ===================================================================

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const RESET_PASSWORD_REDIRECT = 'https://mira-portal-nu.vercel.app/reset-password'
const VALID_ROLES = ['owner', 'admin', 'editor', 'viewer']

// ── Argument parsing (supports both "--key value" and "--key=value", plus bare boolean flags) ──
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

const name = flags.get('name')
const slug = flags.get('slug')
const email = flags.get('email')
const role = flags.get('role') || 'owner'
const plan = flags.get('plan') || 'starter'
const dryRun = flags.has('dry-run')

if (!name || !slug || !email) {
  console.error('❌ Error: --name, --slug and --email are required')
  console.error(`
Usage:
  node scripts/onboard-full-client.mjs --name "Client Name" --slug client-slug --email admin@client.com [--role owner] [--plan starter] [--dry-run]
`)
  process.exit(1)
}

if (!VALID_ROLES.includes(role)) {
  console.error(`❌ Error: --role must be one of ${VALID_ROLES.join(', ')} (got "${role}")`)
  process.exit(1)
}

// ── STEP 1: clients row + brand_profiles row (logic mirrors onboard-client.ts) ──
async function ensureClient() {
  console.log('\n📝 Step 1/3: Client record + brand profile')

  const { data: existingClient, error: fetchError } = await supabase
    .from('clients')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (fetchError) throw new Error(`Error checking existing client: ${fetchError.message}`)

  let clientId
  const clientExisted = Boolean(existingClient)
  let clientCreated = false

  if (existingClient) {
    clientId = existingClient.id
    console.log(`   ⚠️  Client slug already exists: ${slug} (${clientId})`)
  } else {
    clientId = randomUUID()
    if (dryRun) {
      console.log(`   [DRY RUN] would create client "${name}" (slug: ${slug}, id: ${clientId})`)
    } else {
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({ id: clientId, name, slug, created_at: new Date().toISOString() })
        .select()
        .single()

      if (createError) throw createError
      clientCreated = true
      console.log(`   ✅ Client created: ${newClient.id} ${name}`)
    }
  }

  const { data: existingBrand, error: brandFetchError } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle()

  if (brandFetchError) throw new Error(`Error checking existing brand profile: ${brandFetchError.message}`)

  const brandExisted = Boolean(existingBrand)
  let brandCreated = false

  if (existingBrand) {
    console.log('   ⚠️  Brand profile already exists for this client')
  } else if (dryRun) {
    console.log(`   [DRY RUN] would create brand profile for client_id ${clientId}`)
  } else {
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .insert({
        client_id: clientId,
        primary_color: '#6366F1',
        secondary_color: '#4F46E5',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (brandError) throw brandError
    brandCreated = true
    console.log(`   ✅ Brand profile created: ${brandProfile.id}`)
  }

  return { clientId, clientExisted, clientCreated, brandExisted, brandCreated }
}

// ── STEP 2: Supabase auth user (logic mirrors create-admin.mjs's graceful-degrade pattern) ──
async function ensureAuthUser(clientId) {
  console.log('\n👤 Step 2/3: Auth user')

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const existingUser = users.find((u) => u.email === email)

  if (existingUser) {
    console.log(`   ⚠️  Auth user already exists: ${email} (${existingUser.id})`)

    if (dryRun) {
      console.log('   [DRY RUN] would generate a recovery link')
      return { userId: existingUser.id, userExisted: true, userCreated: false, link: null }
    }

    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: RESET_PASSWORD_REDIRECT },
    })
    if (error) throw error
    console.log('   ✅ Recovery link generated')
    return { userId: existingUser.id, userExisted: true, userCreated: false, link: data.properties.action_link }
  }

  if (dryRun) {
    console.log(`   [DRY RUN] would create auth user ${email} (plan: ${plan}) and generate a recovery link`)
    return { userId: null, userExisted: false, userCreated: false, link: null }
  }

  const tempPassword = Math.random().toString(36).slice(-12)
  const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { plan, client_id: clientId, client_slug: null },
  })
  if (createError) throw createError
  console.log(`   ✅ Auth user created: ${newUser.id} ${email}`)

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: RESET_PASSWORD_REDIRECT },
  })
  if (linkError) throw linkError

  return { userId: newUser.id, userExisted: false, userCreated: true, link: linkData.properties.action_link }
}

// ── STEP 3: mira_project_access grant (adapted from audit-and-fix-users.ts's addToProjectAccess) ──
async function ensureProjectAccess(userId, clientId) {
  console.log('\n🔑 Step 3/3: Project access grant')

  if (!userId) {
    console.log(`   [DRY RUN] auth user not created yet — would grant role "${role}" once it exists`)
    return { grantExisted: false, grantCreated: false }
  }

  const { data: existing, error: checkError } = await supabase
    .from('mira_project_access')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', clientId)
    .maybeSingle()

  if (checkError) throw checkError

  if (existing) {
    console.log('   ⚠️  Grant already exists for this user/client')
    return { grantExisted: true, grantCreated: false }
  }

  if (dryRun) {
    console.log(`   [DRY RUN] would create grant { user_id: ${userId}, project_id: ${clientId}, role: "${role}" }`)
    return { grantExisted: false, grantCreated: false }
  }

  const { error: insertError } = await supabase
    .from('mira_project_access')
    .insert({ user_id: userId, project_id: clientId, role })

  if (insertError) throw insertError
  console.log(`   ✅ Grant created: role "${role}"`)
  return { grantExisted: false, grantCreated: true }
}

function statusLabel(existed, created) {
  if (created) return '✅ created'
  if (existed) return '⚠️  already existed'
  return dryRun ? '… (dry run — would create)' : '⚠️  already existed'
}

async function main() {
  console.log(`\n🚀 Onboarding client: ${name} (slug: ${slug})`)
  console.log(`   Email: ${email}`)
  console.log(`   Role: ${role} | Plan: ${plan}`)
  if (dryRun) console.log('   Mode: DRY RUN — no writes will be made')

  const { clientId, clientExisted, clientCreated, brandExisted, brandCreated } = await ensureClient()
  const { userId, userExisted, userCreated, link } = await ensureAuthUser(clientId)
  const { grantExisted, grantCreated } = await ensureProjectAccess(userId, clientId)

  console.log('\n✨ Onboarding checklist')
  console.log(`   clients row .............. ${statusLabel(clientExisted, clientCreated)} (id: ${clientId})`)
  console.log(`   brand_profiles row ........ ${statusLabel(brandExisted, brandCreated)}`)
  console.log(`   auth user .................. ${statusLabel(userExisted, userCreated)} (${email}${userId ? `, ${userId}` : ''})`)
  console.log(`   mira_project_access grant .. ${statusLabel(grantExisted, grantCreated)} (role: ${role})`)

  if (link) {
    console.log('\n🔗 Link to hand to the client (recovery/invite):')
    console.log(`   ${link}`)
  } else if (dryRun) {
    console.log('\n🔗 Link to hand to the client: not generated in dry run')
  }

  console.log('')
}

main().catch((err) => {
  console.error('❌ Error:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
