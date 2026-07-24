import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// For the common case (client + brand profile + auth user + access grant in one go),
// use scripts/onboard-full-client.mjs instead — this script stays for db-only/standalone use.

// ===================================================================
// CLIENT ONBOARDING SCRIPT
// Requires SUPABASE_SERVICE_ROLE_KEY from environment (never hardcoded)
// ===================================================================

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface OnboardFlags {
  dbOnly?: boolean
  clientId?: string
}

async function onboardClient(
  name: string,
  slug: string,
  flags: OnboardFlags = {}
) {
  try {
    // Determine client ID — use provided or generate new
    const clientId = flags.clientId || randomUUID()
    const dbOnly = flags.dbOnly || false

    console.log(`\n🚀 Onboarding client: ${name} (slug: ${slug})`)
    console.log(`   ID: ${clientId}`)
    console.log(`   DB-only mode: ${dbOnly}`)

    // ── STEP 1: Create client record in clients table ──
    console.log('\n📝 Creating client record...')
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('slug', slug)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error checking existing client: ${fetchError.message}`)
    }

    if (existingClient) {
      console.log(`⚠️  Client slug already exists: ${slug}`)
      console.log(`   Skipping clients table creation`)
    } else {
      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          id: clientId,
          name,
          slug,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (createError) throw createError
      console.log('✅ Client created:', newClient.id, name)
    }

    // ── STEP 2: Create brand profile ──
    // brand_profiles has no primary_color/secondary_color columns (those
    // live under brand_data.visual_identity.colors instead) -- this insert
    // was throwing on every real call, silently leaving clients without a
    // brand profile row. See scripts/onboard-full-client.mjs for the same fix.
    console.log('\n🎨 Creating brand profile...')
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .insert({
        client_id: clientId,
        name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (brandError && !brandError.message.includes('duplicate')) {
      throw brandError
    }

    if (brandError?.message.includes('duplicate')) {
      console.log('⚠️  Brand profile already exists for this client')
    } else {
      console.log('✅ Brand profile created:', brandProfile?.id)
    }

    // ── STEP 3: Create folders/templates (unless --db-only) ──
    if (!dbOnly) {
      console.log('\n📁 Creating folder structure...')
      // This is where folder/template creation logic would go
      // For now, just a placeholder message
      console.log('   (Folder creation logic not yet implemented)')
    }

    console.log(`\n✨ Client onboarded successfully!`)
    console.log(`   Slug: ${slug}`)
    console.log(`   ID: ${clientId}`)

  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

// Parse command line arguments
const command = process.argv[2]
const flags = new Map<string, string | boolean>()

for (let i = 3; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=')
    flags.set(key, value || true)
  }
}

const name = flags.get('name') as string
const slug = flags.get('slug') as string
const dbOnly = flags.has('db-only')
const clientId = flags.get('client-id') as string | undefined

if (!name || !slug) {
  console.error('❌ Error: --name and --slug are required')
  console.error(`
Usage:
  npx ts-node scripts/onboard-client.ts create --name "Client Name" --slug client-slug [--db-only] [--client-id <uuid>]

Examples:
  npx ts-node scripts/onboard-client.ts create --name "Discoolver" --slug discoolver
  npx ts-node scripts/onboard-client.ts create --name "Salsa Burgers" --slug salsa-burgers --db-only
  npx ts-node scripts/onboard-client.ts create --name "Dadybox" --slug dadybox --client-id 123e4567-e89b-12d3-a456-426614174000
`)
  process.exit(1)
}

if (command === 'create') {
  onboardClient(name, slug, { dbOnly, clientId })
} else {
  console.error(`❌ Unknown command: ${command}`)
  process.exit(1)
}
