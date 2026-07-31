import { createServiceRoleClient } from '@sf/supabase'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8')
  env.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

const [, , email, newPassword] = process.argv
if (!email || !newPassword) {
  console.error('Usage: tsx scripts/reset-user-password.ts <email> <newPassword>')
  process.exit(1)
}

const supabase = createServiceRoleClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  const user = users.find(u => u.email === email)
  if (!user) {
    console.error(`No user found with email ${email}`)
    process.exit(1)
  }

  console.log(`Found user: ${user.email} (${user.id})`)
  console.log(`Updating password...`)

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (error) {
    console.error('Error details:', JSON.stringify(error, null, 2))
    throw error
  }

  console.log(`✅ Password updated for ${email} (id: ${user.id})`)
}

main().catch(err => {
  console.error('❌ Failed:', JSON.stringify(err, null, 2))
  process.exit(1)
})
