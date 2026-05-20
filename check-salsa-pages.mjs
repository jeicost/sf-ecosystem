import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://dmzecrlkclocqaywkjtc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw'
)

const { data: project } = await supabase
  .from('projects')
  .select('id, slug')
  .eq('slug', 'salsa')
  .single()

console.log('Project:', project)

const { data: pages } = await supabase
  .from('pages')
  .select('slug, title, status, sections_json')
  .eq('project_id', project.id)
  .order('slug', { ascending: true })

console.log('\nPages in database:')
pages.forEach(page => {
  console.log(`  - ${page.slug} (${page.status}) — ${page.sections_json?.length || 0} sections`)
})
