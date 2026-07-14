import { createClient } from '@supabase/supabase-js'

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
if (!SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
  process.exit(1)
}

const supabase = createClient(
  'https://dmzecrlkclocqaywkjtc.supabase.co',
  SERVICE_ROLE_KEY
)

const { data: projects } = await supabase
  .from('projects')
  .select('id, name, slug, domain')
  .order('created_at')

console.log('📊 CMS Projects:\n')
projects.forEach(p => {
  console.log(`  • ${p.slug.padEnd(15)} → ${p.name.padEnd(25)} (${p.domain || 'no domain'})`)
})

const { data: pages } = await supabase
  .from('pages')
  .select('project_id, slug')
  .order('project_id')

console.log('\n📄 Seeded Pages:\n')
pages.forEach(p => {
  const proj = projects.find(pr => pr.id === p.project_id)
  console.log(`  • ${proj?.slug || 'unknown'}: ${p.slug}`)
})
