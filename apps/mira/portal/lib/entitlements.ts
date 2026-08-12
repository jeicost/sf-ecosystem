// Entitlements por cliente. v0 como allowlist explícita en código (sin cambios de
// schema): decide qué herramientas verticales ve cada cliente. La herramienta de
// Licitaciones solo tiene sentido para quien licita en público — no la enseñamos a
// clientes B2C/privados que no la usarían.
//
// La agencia (super_admin) ve todo siempre, para demostrar/gestionar. Cuando esto
// crezca, migrar a un flag por cliente en BD; de momento, explícito y revisable.

export const TENDER_CLIENTS = new Set<string>([
  '3949b629-feec-4497-9d73-91214027cca1', // GTD Mensajeros (concursos públicos: RTVE, biosanitario, mensajería)
  '1a093072-97fb-46e4-aea7-65c3eb9e1e29', // GLS Ciudad Lineal (mutuas, semipúblico)
  '91abb051-cae5-462d-b1fa-8e50a299e3b3', // Discoolver 360 (destinos públicos: ayuntamientos y patronatos sí licitan)
])

/** CPV por defecto del radar según el sector del cliente. Sin entrada → los de logística. */
export const CLIENT_CPV: Record<string, string[]> = {
  // Discoolver 360: turismo, promoción de destinos, software y portales.
  '91abb051-cae5-462d-b1fa-8e50a299e3b3': ['635', '7997', '7934', '7241', '48', '72', '92622'],
}

/** ¿Este cliente tiene acceso a la herramienta de Licitaciones? */
export function hasTenderTool(clientId?: string | null, isAgency = false): boolean {
  return isAgency || (!!clientId && TENDER_CLIENTS.has(clientId))
}
