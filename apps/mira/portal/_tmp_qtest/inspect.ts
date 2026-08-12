import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main(){
const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'

const { data: client } = await db.from('clients').select('id,name,slug').eq('id', CID).maybeSingle()
console.log('CLIENT', client)

const { data: bp } = await db.from('brand_profiles').select('*').eq('client_id', CID).maybeSingle()
if (bp) {
  const flat: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(bp)) {
    if (k === 'brand_data') continue
    flat[k] = typeof v === 'string' && v.length > 120 ? v.slice(0, 120) + '…' : v
  }
  console.log('BRAND_PROFILE cols:', JSON.stringify(flat, null, 2))
  console.log('BRAND_DATA:', JSON.stringify(bp.brand_data, null, 2)?.slice(0, 4000))
} else console.log('NO brand_profile')

const { data: pillars } = await db.from('content_pillars').select('id,name,description,created_at').eq('client_id', CID)
console.log('PILLARS', pillars?.length, JSON.stringify(pillars, null, 2))

const { data: docs } = await db.from('client_documents').select('id,title,doc_type,created_at').eq('client_id', CID).limit(30)
console.log('DOCS', docs?.length, JSON.stringify(docs?.map(d => [d.title, d.doc_type]), null, 2))

const { data: qs } = await db.from('client_questionnaires').select('id,client_id,title,status,source,created_at')
console.log('ALL QUESTIONNAIRES (global):', qs?.length, JSON.stringify(qs, null, 2))

const { data: access } = await db.from('mira_project_access').select('user_id,project_id').eq('project_id', CID)
console.log('ACCESS grants for Discoolver 360:', JSON.stringify(access, null, 2))

const { data: mem } = await db.from('project_memory').select('id,title,category,created_at').eq('client_id', CID).limit(20)
console.log('MEMORY', mem?.length, JSON.stringify(mem, null, 2))

}
main()
