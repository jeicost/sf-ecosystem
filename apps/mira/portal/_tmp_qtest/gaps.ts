import { fetchBrandBrain } from '../lib/brand-brain'
import { computeBrainGaps, BRAIN_TRACKED_FIELD_COUNT } from '../lib/brain-gaps'
import { createClient } from '@supabase/supabase-js'

const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: pillars, error: pe } = await db.from('content_pillars').select('id,pillar_name,description,themes,created_at').eq('client_id', CID)
  console.log('PILLARS', pe?.message ?? '', pillars?.length, JSON.stringify(pillars, null, 2))
  const { data: docs, error: de } = await db.from('agent_documents').select('id,title,created_at').eq('client_id', CID)
  console.log('DOCS', de?.message ?? '', docs?.length, JSON.stringify(docs?.map(d => d.title)))

  const brain = await fetchBrandBrain(CID)
  const gaps = computeBrainGaps(brain)
  console.log(`\nGAPS: ${gaps.length} missing of ${BRAIN_TRACKED_FIELD_COUNT} tracked (filled ${BRAIN_TRACKED_FIELD_COUNT - gaps.length})`)
  for (const g of gaps) console.log(` - [${g.area}] ${g.label}  → ${g.mapsTo}`)
  console.log('\nopenQuestions:', JSON.stringify(brain?.openQuestions))
}
main()
