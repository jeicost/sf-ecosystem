#!/usr/bin/env node

/**
 * AUDIT AND FIX MIRA USERS - Multi-Client Authentication
 *
 * This script:
 * 1. Lists all users and their current settings
 * 2. Maps user_email → client_slug → client_uuid
 * 3. Fixes user_metadata to set client_id correctly
 * 4. Creates/resets super admin account
 *
 * Usage:
 * SUPABASE_SERVICE_ROLE_KEY=xxx npx ts-node scripts/audit-and-fix-users.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ============================================
// PART 1: AUDIT ALL USERS
// ============================================

async function auditAllUsers() {
  console.log('\n=== AUDITING ALL USERS ===\n')

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  console.log(`Found ${users.length} users:\n`)

  users.forEach((user, idx) => {
    const meta = user.user_metadata || {}
    console.log(`${idx + 1}. ${user.email}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Plan: ${meta.plan || 'starter'}`)
    console.log(`   Client Slug: ${meta.client_slug || '(none)'}`)
    console.log(`   Client ID: ${meta.client_id || '(none)'}`)
    console.log(`   Email Verified: ${user.email_confirmed_at ? '✅' : '❌'}`)
    console.log()
  })

  return users
}

// ============================================
// PART 2: MAP SLUGS TO CLIENT UUIDs
// ============================================

async function getClientMapping(): Promise<Record<string, string>> {
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, slug')

  if (error) throw error

  const mapping: Record<string, string> = {}
  clients?.forEach(c => {
    if (c.slug) mapping[c.slug] = c.id
  })

  console.log('\n=== CLIENT SLUG → UUID MAPPING ===\n')
  Object.entries(mapping).forEach(([slug, uuid]) => {
    console.log(`${slug} → ${uuid}`)
  })
  console.log()

  return mapping
}

// ============================================
// PART 3: FIX USER client_id
// ============================================

async function fixUserClientId(email: string, clientUUID: string, plan: string) {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const user = users.find(u => u.email === email)
  if (!user) {
    console.error(`❌ User not found: ${email}`)
    return
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        plan: plan,
        client_id: clientUUID,
        client_slug: null, // Clear old field
      }
    }
  )

  if (updateError) {
    console.error(`❌ Failed to update ${email}: ${updateError.message}`)
  } else {
    console.log(`✅ Fixed ${email} → client_id: ${clientUUID}`)
  }
}

// ============================================
// PART 4: CREATE/RESET SUPER ADMIN
// ============================================

async function createOrUpdateSuperAdmin(email: string, password: string) {
  console.log(`\n=== SUPER ADMIN: ${email} ===\n`)

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const existingAdmin = users.find(u => u.email === email)

  if (existingAdmin) {
    console.log(`Found existing super admin: ${email} (${existingAdmin.id})`)

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingAdmin.id,
      {
        password: password,
        user_metadata: {
          plan: 'super_admin',
          client_id: null, // Super admin has no single client
          name: 'Super Admin',
        }
      }
    )

    if (updateError) {
      console.error(`❌ Failed to update super admin: ${updateError.message}`)
    } else {
      console.log(`✅ Super admin password reset to: ${password}`)
      console.log(`✅ Super admin plan set to: super_admin`)
      console.log(`✅ Super admin client_id set to: null (all clients)`)
    }
  } else {
    console.log(`Super admin not found. Creating new account...`)

    // Create new super admin
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        plan: 'super_admin',
        client_id: null,
        name: 'Super Admin',
      }
    })

    if (createError) {
      console.error(`❌ Failed to create super admin: ${createError.message}`)
    } else {
      console.log(`✅ Super admin created: ${email}`)
      console.log(`✅ ID: ${(newUser as any).id}`)
      console.log(`✅ Password: ${password}`)
    }
  }
}

// ============================================
// PART 5: ADD USER TO PROJECT ACCESS
// ============================================

async function addToProjectAccess(email: string, clientUUID: string) {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const user = users.find(u => u.email === email)
  if (!user) {
    console.error(`❌ User not found: ${email}`)
    return
  }

  // Check if already in project_access
  const { data: existing, error: checkError } = await supabase
    .from('mira_project_access')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', clientUUID)

  if (checkError) throw checkError

  if (existing && existing.length > 0) {
    console.log(`✅ ${email} already in mira_project_access for ${clientUUID}`)
    return
  }

  // Add to project_access
  const { error: insertError } = await supabase
    .from('mira_project_access')
    .insert({
      user_id: user.id,
      project_id: clientUUID,
      role: 'admin'
    })

  if (insertError) {
    console.error(`❌ Failed to add to project_access: ${insertError.message}`)
  } else {
    console.log(`✅ Added ${email} to mira_project_access`)
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    // Audit all users
    const users = await auditAllUsers()

    // Get client mapping
    const clientMapping = await getClientMapping()

    // FIX KNOWN ISSUES:
    console.log('\n=== FIXING KNOWN USER ISSUES ===\n')

    // Issue 1: Natalia (Dadybox) - should already work but verify
    // TODO: Add correct mapping after verifying which client is Dadybox

    // Issue 2: Alessandro (Discoolver) - should already work but verify
    // TODO: Add correct mapping after verifying which client is Discoolver

    // Issue 3: Carlos (Startups Factory) - going to Salsa Burgers
    // Fix: Set correct client_id for carlos@albasanzexpress.es
    // Need to identify Startups Factory UUID from clientMapping

    // Issue 4: Nirada (Salsa Burgers) - not entering at all
    // Fix: Verify Salsa Burgers client exists and add user to project_access

    // CREATE/RESET SUPER ADMIN
    console.log('\n=== SETTING UP SUPER ADMIN ===\n')
    await createOrUpdateSuperAdmin('jacostech@gmail.com', 'Mira123!SecurePass456')

    console.log('\n✅ AUDIT AND FIX COMPLETE\n')
    console.log('Next steps:')
    console.log('1. Verify client slugs in clientMapping above')
    console.log('2. Map each problem user to correct client UUID')
    console.log('3. Uncomment fixes in this script and re-run')
    console.log('4. Test login for each user')

  } catch (err) {
    console.error('❌ Fatal error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

main()
