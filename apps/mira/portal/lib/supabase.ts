import { createBrowserSupabaseClient, createServiceRoleClient } from '@sf/supabase'
import type { Database } from '@/types/database.generated'

// Browser client — stores session in cookies so middleware can read it.
//
// SIN tipar a propósito (20-sep-2026): @supabase/ssr 0.6.1 declara el cliente
// con la firma vieja de 3 genéricos y supabase-js 2.110 usa 5; al pasarle
// <Database> el tipo degenera en `never` y TODA consulta del navegador deja
// de compilar. Se tipará cuando se suba @supabase/ssr en el monorepo (afecta
// también a sf-crm y ai-agency: cambio de auth, merece su propia sesión).
export function createClient() {
  return createBrowserSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Server-side only — bypasses RLS, never expose to browser.
//
// Tipado con el esquema real (types/database.generated.ts, 20-sep-2026): hasta
// ahora toda consulta era `any` y una columna mal escrita solo se veía en
// producción. Si el compilador se queja de una tabla que sí existe, el
// arreglo es REGENERAR los tipos (ver cabecera del fichero), no volver a any.
export function adminClient() {
  return createServiceRoleClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
