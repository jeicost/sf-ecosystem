import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function generateLink(email) {
  try {
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://portal-six-kappa-22.vercel.app/reset-password'
      }
    })

    if (error) throw error

    console.log(`✅ Recovery link for ${email}:`)
    console.log(data.properties.action_link)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

generateLink('natalia.aldea@albasanzexpress.es')
