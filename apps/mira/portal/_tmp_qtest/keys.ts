import { createClient } from '@supabase/supabase-js'
const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'
async function main(){
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await db.from('brand_profiles').select('brand_data').eq('client_id', CID).maybeSingle()
  const bd = (data as any)?.brand_data ?? {}
  console.log('TOP KEYS:', Object.keys(bd).join(', '))
  for (const k of Object.keys(bd)) {
    const v = bd[k]
    console.log(`--- ${k}: ${Array.isArray(v) ? 'array['+v.length+']' : typeof v}`, typeof v === 'object' && v ? Object.keys(v).join('|') : String(v).slice(0,100))
  }
}
main()
