import { createServiceRoleClient } from '@sf/supabase'

// ===================================================================
// SECURE USER MANAGEMENT SCRIPT
// Requires SUPABASE_SERVICE_ROLE_KEY from environment (never hardcoded)
// ===================================================================

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

const supabase = createServiceRoleClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function createUser(email: string, plan: string, clientSlug?: string) {
  try {
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) throw fetchError

    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      console.log('⚠️  Usuario ya existe:', email)
      return
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12)

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        plan: plan || 'starter',
        client_slug: clientSlug || null,
      },
    })

    if (createError) throw createError
    if (!newUser) throw new Error('No user returned from createUser')

    console.log('✅ Usuario creado:', (newUser as any).id, email)
    console.log('Plan:', (newUser as any).user_metadata?.plan)
    if (clientSlug) {
      console.log('Cliente:', clientSlug)
    }
  } catch (err) {
    console.error('❌ Error en create:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

async function updateUser(email: string, plan: string) {
  try {
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) throw fetchError

    const user = users.find(u => u.email === email)
    if (!user) throw new Error(`Usuario no encontrado: ${email}`)

    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { plan } }
    )

    if (updateError) throw updateError
    if (!updatedUser) throw new Error('No user returned from updateUserById')

    console.log('✅ Usuario actualizado:', email)
    console.log('Nuevo plan:', (updatedUser as any).user_metadata?.plan)
  } catch (err) {
    console.error('❌ Error en update:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

async function verifyUser(email: string) {
  try {
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) throw fetchError

    const user = users.find(u => u.email === email)
    if (!user) throw new Error(`Usuario no encontrado: ${email}`)

    console.log('✓ Usuario encontrado:', user.id, user.email)
    console.log('Plan:', user.user_metadata?.plan || 'starter')
    console.log('Email confirmado:', user.email_confirmed_at ? '✅' : '❌')
  } catch (err) {
    console.error('❌ Error en verify:', err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

// Parse command line arguments
const command = process.argv[2]
const flags = new Map<string, string>()

for (let i = 3; i < process.argv.length; i += 2) {
  const flag = process.argv[i]
  const value = process.argv[i + 1]
  if (flag.startsWith('--')) {
    flags.set(flag.substring(2), value)
  }
}

const email = flags.get('email')
const plan = flags.get('plan') || 'starter'
const clientSlug = flags.get('client-slug')

if (!email) {
  console.error('❌ Error: --email es requerido')
  console.error(`
Uso:
  npx ts-node scripts/manage-user.ts create --email user@example.com [--plan starter|admin|super_admin] [--client-slug slug]
  npx ts-node scripts/manage-user.ts update --email user@example.com --plan admin
  npx ts-node scripts/manage-user.ts verify --email user@example.com
`)
  process.exit(1)
}

if (command === 'create') {
  createUser(email, plan, clientSlug)
} else if (command === 'update') {
  updateUser(email, plan)
} else if (command === 'verify') {
  verifyUser(email)
} else {
  console.error(`❌ Comando desconocido: ${command}`)
  process.exit(1)
}
