import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://dmzecrlkclocqaywkjtc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw'
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
