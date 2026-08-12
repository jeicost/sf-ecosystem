import { createClient } from '@supabase/supabase-js'
async function main(){
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 200 })
  const { data: grants } = await db.from('mira_project_access').select('user_id,project_id')
  const { data: clients } = await db.from('clients').select('id,name')
  const cname = new Map((clients??[]).map(c=>[c.id,c.name]))
  for (const u of data.users) {
    const g = (grants??[]).filter(x=>x.user_id===u.id).map(x=>cname.get(x.project_id) ?? x.project_id)
    console.log(u.id, '|', u.email, '| plan=', (u.user_metadata as any)?.plan, '| grants:', g.join(', ') || '(none)')
  }
}
main()
