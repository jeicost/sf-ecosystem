// Genera el cuestionario por el MISMO camino que POST /api/onboarding/self-serve/questionnaire
import { writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { generateGapQuestionnaire } from '../lib/questionnaires-gaps'

const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'
const OWNER = 'af1af6fa-ec61-416f-a517-18efc32ea363' // grant real sobre este cliente

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Backup del brand_data ANTES de tocar nada
  const { data: before } = await db.from('brand_profiles').select('*').eq('client_id', CID).maybeSingle()
  writeFileSync(__dirname + '/backup-brand-profile.json', JSON.stringify(before, null, 2))
  console.log('backup written')

  const t0 = Date.now()
  const res = await generateGapQuestionnaire({
    clientId: CID,
    createdBy: OWNER,
    status: 'sent',
    source: 'onboarding',
    audience: 'client',
  })
  console.log(`generated in ${((Date.now() - t0) / 1000).toFixed(1)}s — gaps=${res.gapsDetected} questions=${res.questionCount}`)
  console.log('QUESTIONNAIRE ID:', res.questionnaire.id)
  console.log('TITLE:', res.questionnaire.title)
  console.log('INTRO:', res.questionnaire.intro)
  console.log('STATUS/SOURCE:', res.questionnaire.status, res.questionnaire.source)

  const { data: qs } = await db
    .from('questionnaire_questions')
    .select('*')
    .eq('questionnaire_id', res.questionnaire.id)
    .order('position')
  console.log('\n===== QUESTIONS =====')
  for (const q of qs ?? []) {
    console.log(`\n[${q.position}] (${q.section}) ${q.required ? '*REQUIRED* ' : ''}${q.kind}`)
    console.log(`  Q: ${q.prompt}`)
    if (q.help) console.log(`  help: ${q.help}`)
    if (q.options) console.log(`  options: ${JSON.stringify(q.options)}`)
    console.log(`  maps_to: ${q.maps_to}`)
  }
  writeFileSync(__dirname + '/questions.json', JSON.stringify({ q: res.questionnaire, questions: qs }, null, 2))
}
main()
