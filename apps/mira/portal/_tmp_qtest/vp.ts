import { createClient } from '@supabase/supabase-js'
const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'
async function main(){
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db.from('brand_profiles').select('brand_data').eq('client_id', CID).maybeSingle()
  console.log(JSON.stringify((data as any).brand_data.value_proposition, null, 2))
  const { data: docs } = await db.from('agent_documents').select('title,content').eq('client_id', CID).limit(20)
  const hay = (docs ?? []).filter(d => /1\.?500|1500/.test(d.content ?? ''))
  console.log('DOCS mentioning 1500:', hay.map(d => d.title))
  const fitur = (docs ?? []).filter(d => /FITUR|SEGITTUR/i.test(d.content ?? ''))
  console.log('DOCS mentioning FITUR/SEGITTUR:', fitur.map(d => d.title))
}
main()
