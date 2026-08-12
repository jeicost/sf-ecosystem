import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { fetchBrandBrain } from '../lib/brand-brain'
import { computeBrainGaps, BRAIN_TRACKED_FIELD_COUNT } from '../lib/brain-gaps'
const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'
async function main(){
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: bp } = await db.from('brand_profiles').select('brand_data,updated_at').eq('client_id', CID).maybeSingle()
  const before = JSON.parse(readFileSync(__dirname + '/backup-brand-profile.json','utf8'))
  const bdA = (bp as any).brand_data, bdB = before.brand_data
  console.log('brand_data TOP KEYS antes:', Object.keys(bdB).join(', '))
  console.log('brand_data TOP KEYS ahora :', Object.keys(bdA).join(', '))
  for (const k of Object.keys(bdA)) {
    const a = JSON.stringify(bdA[k]), b = JSON.stringify(bdB[k])
    if (a !== b) {
      console.log(`\n### CAMBIÓ ${k}`)
      console.log('  ANTES:', (b ?? '(no existía)').slice(0, 900))
      console.log('  AHORA:', a.slice(0, 1200))
    }
  }
  const { data: pillars } = await db.from('content_pillars').select('id,pillar_name,description,themes,examples,created_at').eq('client_id', CID).order('created_at')
  console.log('\n### CONTENT_PILLARS:', pillars?.length)
  console.log(JSON.stringify(pillars, null, 2))
  const brain = await fetchBrandBrain(CID)
  const gaps = computeBrainGaps(brain)
  console.log(`\n### GAPS AHORA: ${gaps.length}/${BRAIN_TRACKED_FIELD_COUNT} vacíos (antes 10)`) 
  for (const g of gaps) console.log(' -', g.label, '→', g.mapsTo)
}
main()
