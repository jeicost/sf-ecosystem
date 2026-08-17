#!/usr/bin/env node
// Test RLS ritualizable (C9 del plan 08-11 · F3 de la auditoría). Con la
// publishable key ANÓNIMA y SIN sesión, intenta leer las tablas sensibles.
// Lo esperado es 0 filas / error en TODAS: cualquier fila devuelta es una fuga
// (precedente real: la fuga cerrada el 06-08). Salida no-cero si algo falla —
// apto para correr en CI o a mano cada mes.
//
// Uso:  node scripts/rls-audit.mjs
// Requiere en el entorno: NEXT_PUBLIC_SUPABASE_URL y una de
// SUPABASE_PUBLISHABLE_KEY | NEXT_PUBLIC_SUPABASE_ANON_KEY (la publishable
// vigente, no la legacy — la legacy bloquea en la puerta y no prueba nada).

import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL || !KEY) {
  console.error('Falta NEXT_PUBLIC_SUPABASE_URL o la publishable/anon key en el entorno')
  process.exit(2)
}
if (KEY.startsWith('eyJ')) {
  console.warn('⚠️  La key parece la LEGACY (JWT): está deshabilitada y bloquea antes de RLS.')
  console.warn('    Este test no prueba las políticas. Usa la key sb_publishable_ vigente.')
}

// Tablas que NUNCA debe poder leer un anónimo sin sesión.
const SENSITIVE = [
  'clients', 'brand_profiles', 'generation_queue', 'content_pillars',
  'agent_documents', 'mira_project_access', 'leads', 'crm_contacts',
  'quick_actions_results', 'project_memory', 'brain_change_proposals',
  'tool_connections', 'approval_queue', 'mira_usage_log',
  // añadidas tras la fuga del 2026-08-11 (las 3 fugaban; migración 0066)
  'alerts', 'agent_activity', 'post_history', 'deliverables', 'icp_profiles',
  'prospect_context', 'onboarding_sessions', 'drive_folders', 'drive_connections',
  'brain_contradictions', 'client_documentation', 'lead_activities',
  // 0067: los expedientes de licitación llevan pliegos y memorias del cliente
  'tenders',
  // 0071: Email Ops — correos operativos del cliente, adjuntos y correcciones
  'email_inboxes', 'email_ops_settings', 'email_tickets', 'email_messages',
  'email_corrections', 'email_training_examples',
]

const anon = createClient(URL, KEY, { auth: { persistSession: false } })

const leaks = []
for (const table of SENSITIVE) {
  const { data, error } = await anon.from(table).select('*').limit(1)
  const rows = data?.length ?? 0
  if (rows > 0) {
    leaks.push(table)
    console.log(`🔴 FUGA  ${table.padEnd(24)} devolvió ${rows} fila(s) sin sesión`)
  } else if (error) {
    console.log(`🟢 ok    ${table.padEnd(24)} bloqueado (${error.code || error.message?.slice(0, 32)})`)
  } else {
    console.log(`🟢 ok    ${table.padEnd(24)} 0 filas`)
  }
}

console.log('')
if (leaks.length) {
  console.error(`❌ ${leaks.length} FUGA(S): ${leaks.join(', ')} — revisar políticas RLS YA`)
  process.exit(1)
}
console.log(`✅ ${SENSITIVE.length}/${SENSITIVE.length} tablas sensibles bloqueadas al anónimo. Sin fugas.`)
