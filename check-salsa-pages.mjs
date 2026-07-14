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
