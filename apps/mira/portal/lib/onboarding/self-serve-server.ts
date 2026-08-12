// Parte de servidor del alta autoservicio: lo que toca la BD.
//
// Vive separado de lib/onboarding/self-serve.ts porque ese módulo lo importa el
// navegador (etiquetas, forma del borrador, saneado) y no puede arrastrar
// adminClient consigo.

import { adminClient } from '@/lib/supabase'
import { computeReadiness, type Readiness } from '@/lib/onboarding/self-serve'

export interface SelfServeState {
  readiness: Readiness
  /** 'assisted' (default de la migración 0069) | 'self_serve' */
  onboardingMode: string
  clientName: string
  websiteUrl: string
  /** True cuando el cliente ya terminó el alta guiada alguna vez. */
  finished: boolean
}

/**
 * Estado del Cerebro de un cliente. Una sola lectura para las tres rutas
 * (progreso, propuesta, aplicación) — así el número que ve el cliente al
 * terminar sale de la misma cuenta que el que veía al empezar.
 */
export async function loadSelfServeState(clientId: string): Promise<SelfServeState> {
  const db = adminClient()

  // Promise.all y no allSettled a propósito: si Supabase falla aquí no hay
  // estado que enseñar, y un progreso inventado es peor que un error.
  const [profileRes, pillarsRes, clientRes] = await Promise.all([
    db.from('brand_profiles')
      .select('name, mission, tone_of_voice, values, brand_data')
      .eq('client_id', clientId)
      .maybeSingle(),
    db.from('content_pillars')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId),
    db.from('clients')
      .select('name, onboarding_mode')
      .eq('id', clientId)
      .maybeSingle(),
  ])

  const profile = profileRes.data
  const brandData = (profile?.brand_data as Record<string, any> | null) ?? null
  const readiness = computeReadiness({
    name: profile?.name,
    mission: profile?.mission,
    tone_of_voice: profile?.tone_of_voice,
    values: profile?.values,
    brand_data: brandData,
    pillarCount: pillarsRes.count ?? 0,
  })

  const onboardingMode = (clientRes.data?.onboarding_mode as string) || 'assisted'
  return {
    readiness,
    onboardingMode,
    clientName: (clientRes.data?.name as string) || profile?.name || '',
    websiteUrl: typeof brandData?.identity?.website_url === 'string' ? brandData.identity.website_url : '',
    finished: onboardingMode === 'self_serve',
  }
}

/**
 * Garantiza que existe la fila de brand_profiles antes de aplicar cambios.
 *
 * applyBrainChange lanza "This client has no brand_profiles row yet" si falta
 * (lib/brain-tools/index.ts:59), y en autoservicio no hay ningún super_admin
 * que haya pasado antes por el alta de agencia a crearla.
 */
export async function ensureBrandProfile(clientId: string, name: string): Promise<void> {
  const db = adminClient()
  const { data: existing } = await db
    .from('brand_profiles')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle()
  if (existing) return

  const { error } = await db.from('brand_profiles').insert({ client_id: clientId, name: name || 'My brand' })
  // Carrera con otra pestaña del mismo cliente: la fila ya está, que es lo que
  // queríamos. Cualquier otro error sí debe subir.
  if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
    throw new Error(`Could not create the brand profile: ${error.message}`)
  }
}
