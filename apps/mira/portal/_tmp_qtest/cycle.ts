// Recorre el ciclo COMPLETO por HTTP contra el dev server, con la sesión real
// del dueño de la marca (alessandro@discoolver.com, plan growth, NO agencia).
import { readFileSync, writeFileSync } from 'fs'
import { cookieForUser } from './session'
import { createClient } from '@supabase/supabase-js'

const BASE = 'http://localhost:3033'
const CID = '91abb051-cae5-462d-b1fa-8e50a299e3b3'

async function main() {
  const cookie = await cookieForUser('alessandro@discoolver.com')
  const H = { cookie, 'Content-Type': 'application/json' }
  const call = async (path: string, init?: RequestInit) => {
    const r = await fetch(BASE + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) } })
    const t = await r.text()
    let j: any = null
    try { j = JSON.parse(t) } catch { j = t }
    return { status: r.status, body: j }
  }

  console.log('--- GET self-serve/questionnaire (¿qué falta y hay algo a medias?)')
  const g1 = await call(`/api/onboarding/self-serve/questionnaire?clientId=${CID}`)
  console.log(g1.status, JSON.stringify({ gaps: g1.body.gaps?.length, questionnaire: g1.body.questionnaire }))

  console.log('\n--- POST self-serve/questionnaire (debe RETOMAR, no generar otro)')
  const p1 = await call('/api/onboarding/self-serve/questionnaire', { method: 'POST', body: JSON.stringify({ clientId: CID }) })
  console.log(p1.status, JSON.stringify(p1.body))

  const qid = p1.body?.questionnaire?.id ?? g1.body?.questionnaire?.id
  console.log('\nquestionnaire id =', qid)

  console.log('\n--- GET /api/questionnaires/[id] como cliente (status sent)')
  const g2 = await call(`/api/questionnaires/${qid}`)
  console.log(g2.status, 'questions=', g2.body.questions?.length, 'is_agency=', g2.body.is_agency)

  const questions: any[] = g2.body.questions
  const byMaps = (m: string) => questions.find((q) => q.maps_to === m)

  // Respuestas REALES, sacadas del Brand Brain y de los documentos del cliente.
  const answers = [
    { q: byMaps('brand_profile.brand_data.audiences'), value:
`Tres segmentos, en este orden de prioridad:
1) Destinos: ayuntamientos, patronatos de turismo y DMO. Decide el concejal o el gerente del patronato, firma el ayuntamiento y lo usa a diario el técnico de turismo. Cliente en producción: Ronda.
2) Alojamientos: hoteles y apartamentos turísticos. Decide y firma el director del hotel; lo usa recepción como concierge digital.
3) Agencias receptivas y organizadores de grupos. Decide el gerente; lo usa el product manager que monta itinerarios.
Nunca nos dirigimos al turista final: ese es el público de Discoolver B2C.` },
    { q: byMaps('content_pillar'), value:
`El destino manda sobre su contenido
Curación real frente al pay-to-list
Integración con lo que el destino ya tiene
Datos de comportamiento del visitante para el gestor público
Casos en producción: qué pasó en Ronda` },
    { q: byMaps('brand_profile.brand_data.banned_phrases'), value:
`Vive la magia del destino
El mejor / revolucionario / líder del sector
Cifras de reparto con creadores
Prueba social inventada
Integración PMS inmediata` },
    { q: byMaps('brand_profile.brand_data.offer.full_list_note'), value:
`SaaS modular a 1.300 €/mes + IVA. Siete módulos que se activan por separado: marketplace, TPV/POS, web informativa, gestión de visitas guiadas, herramientas de descubrimiento, QR de ciudad y acceso profesional. Los precios de los módulos son públicos (decisión del CEO). Contratación directa por suscripción; en destinos públicos que licitan se entra por concurso.` },
    { q: byMaps('brand_profile.brand_data.languages.manual'), value:
`Castellano como idioma principal de todo el material. Inglés para FITUR y para destinos con turismo internacional. Lenguas cooficiales solo cuando el ayuntamiento lo pide.` },
  ].filter((a) => a.q)

  console.log('\n--- POST answers (autosave) para', answers.length, 'preguntas')
  const save = await call(`/api/questionnaires/${qid}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answers: answers.map((a) => ({ question_id: a.q.id, value: a.value, status: 'final' })) }),
  })
  console.log(save.status, JSON.stringify(save.body))

  console.log('\n--- PATCH status=completed (lo que hace el runner al enviar)')
  const patch = await call(`/api/questionnaires/${qid}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) })
  console.log(patch.status, patch.body?.questionnaire?.status ?? JSON.stringify(patch.body))

  console.log('\n--- POST ingest (auto-ingest del runner, como CLIENTE no agencia)')
  const ing = await call(`/api/questionnaires/${qid}/ingest`, { method: 'POST' })
  console.log(ing.status, JSON.stringify(ing.body, null, 2))

  writeFileSync(__dirname + '/cycle-result.json', JSON.stringify({ qid, ingest: ing.body }, null, 2))
}
main()
