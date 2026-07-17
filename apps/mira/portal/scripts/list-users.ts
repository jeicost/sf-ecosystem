import { createClient } from '@supabase/supabase-js'
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Error listing users:', error)
    process.exit(1)
  }

  console.log(`Total users: ${users.length}`)
  users.forEach(u => console.log(`  - ${u.email} (${u.id})`))

  const noel = users.find(u => u.email === 'noel.aldea@albasanzexpress.es')
  if (noel) {
    console.log(`\n✅ Found Noel: ${noel.id}`)
  } else {
    console.log(`\n❌ Noel not found`)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
