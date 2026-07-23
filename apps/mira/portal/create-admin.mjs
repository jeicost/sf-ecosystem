import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set. Using Vercel env...')
  // Intentar obtener de .env.local si existe
  const fs = await import('fs')
  const env = fs.readFileSync('.env.local', 'utf8')
  const match = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)
  if (!match) {
    console.error('❌ Cannot find service key. Try: vercel env pull')
    process.exit(1)
  }
  process.env.SUPABASE_SERVICE_ROLE_KEY = match[1]
}

const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function createAdmin() {
  try {
    const { data: { user }, error } = await supabase.auth.admin.createUser({
      email: 'jacostech@gmail.com',
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
      user_metadata: {
        plan: 'super_admin',
      },
    })

    if (error && error.message.includes('already exists')) {
      console.log('⚠️  User already exists. Sending recovery link instead...')
      const { data, error: recoveryError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: 'jacostech@gmail.com',
        options: { redirectTo: 'https://mira-portal-nu.vercel.app/reset-password' }
      })
      if (recoveryError) throw recoveryError
      console.log('✅ Recovery link:')
      console.log(data.properties.action_link)
      return
    }

    if (error) throw error
    console.log('✅ Admin user created:', user.id)
    
    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: 'jacostech@gmail.com',
      options: { redirectTo: 'https://mira-portal-nu.vercel.app/reset-password' }
    })
    if (linkError) throw linkError
    console.log('\n✅ Recovery link:')
    console.log(data.properties.action_link)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

createAdmin()
