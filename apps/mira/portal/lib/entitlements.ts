// Entitlements por cliente. v0 como allowlist explícita en código (sin cambios de
// schema): decide qué herramientas verticales ve cada cliente. La herramienta de
// Licitaciones solo tiene sentido para quien licita en público — no la enseñamos a
// clientes B2C/privados que no la usarían.
//
// La agencia (super_admin) ve todo siempre, para demostrar/gestionar. Cuando esto
// crezca, migrar a un flag por cliente en BD; de momento, explícito y revisable.

// Decisión go-live (01-sep, Carlos): Licitaciones y Email Ops quedan SOLO para
// el grupo Aldea — al resto se le ocultan hasta que tengan uso real. Grupo
// Aldea = las marcas de la familia Aldea (ver reference_gtd_albasanz_grupo_aldea):
// GTD Mensajeros + Albasanz Express + GLS Ciudad Lineal (NIF B79467866) y
// TAMBIÉN Dadybox (Noel y Natalia Aldea eran admins de Dadybox antes que de
// nada). La verdad viva es client_tools (ya actualizada); estas Sets son la
// semilla/fallback y deben reflejar lo mismo.
export const TENDER_CLIENTS = new Set<string>([
  '3949b629-feec-4497-9d73-91214027cca1', // GTD Mensajeros (concursos públicos: RTVE, biosanitario, mensajería)
  '1a093072-97fb-46e4-aea7-65c3eb9e1e29', // GLS Ciudad Lineal (mutuas, semipúblico)
])

/**
 * CPV por cliente para el radar. Sin entrada → DEFAULT_CPV_PREFIXES.
 *
 * Afinados el 12-ago-2026 tras la primera búsqueda real: el prefijo '601'
 * (transporte por carretera) era tan ancho que trajo "alquiler de maquinaria
 * con maquinista" (CPV 60182000), y en cambio FALTABA el transporte sanitario,
 * que es una línea de negocio real de GTD (su corpus incluye el pliego de
 * transporte biosanitario 54-2026). El radar se perdía justo lo suyo.
 */
export const CLIENT_CPV: Record<string, string[]> = {
  // GTD Mensajeros: postal y mensajería, paquetería, transporte sanitario,
  // logística documental. Prefijos precisos, no familias enteras.
  '3949b629-feec-4497-9d73-91214027cca1': [
    '641',      // servicios postales y de correos
    '6412',     // mensajería
    '6016',     // transporte de correo por carretera
    '60161',    // transporte de paquetes
    '79571',    // servicios de envío postal
    '851431',   // transporte sanitario / ambulancias
    '85143',    // servicios de ambulancia
    '6013',     // transporte de pasajeros con fin especial (sanitario)
    '631',      // manipulación y almacenamiento de carga
    '798',      // servicios de archivo y gestión documental
  ],
  // GLS Ciudad Lineal: mismo sector, sin la parte sanitaria.
  '1a093072-97fb-46e4-aea7-65c3eb9e1e29': ['641', '6412', '6016', '60161', '79571', '631', '798'],
  // Discoolver 360: turismo, promoción de destinos, software y portales.
  '91abb051-cae5-462d-b1fa-8e50a299e3b3': ['635', '7997', '7934', '7241', '48', '72', '92622'],
}

/** ¿Este cliente tiene acceso a la herramienta de Licitaciones? */
export function hasTenderTool(clientId?: string | null, isAgency = false): boolean {
  return isAgency || (!!clientId && TENDER_CLIENTS.has(clientId))
}

/**
 * Email Ops (bandeja operativa por correo). Los cuatro clientes del Grupo Aldea:
 * reciben encargos de recogida/entrega por correo y los pasaban a mano a un
 * Excel de operaciones. Ver lib/email-ops/.
 */
export const EMAIL_OPS_CLIENTS = new Set<string>([
  '7bdfe0d0-c1d9-4282-9792-aed1075c048b', // Albasanz Express
  '3949b629-feec-4497-9d73-91214027cca1', // GTD Mensajeros
  'e664873b-034d-48cd-9a45-8631672ef375', // Dadybox (familia Aldea)
  '1a093072-97fb-46e4-aea7-65c3eb9e1e29', // GLS Ciudad Lineal
])

/** ¿Este cliente tiene acceso a Email Ops? */
export function hasEmailOpsTool(clientId?: string | null, isAgency = false): boolean {
  return isAgency || (!!clientId && EMAIL_OPS_CLIENTS.has(clientId))
}

/** Herramientas verticales gateadas por cliente (clave usada en NavItem.requires). */
export type Entitlement = 'tender' | 'email-ops'

/** Comprobación genérica, para que la navegación no tenga un if por herramienta. */
export function hasEntitlement(kind: Entitlement, clientId?: string | null, isAgency = false): boolean {
  switch (kind) {
    case 'tender': return hasTenderTool(clientId, isAgency)
    case 'email-ops': return hasEmailOpsTool(clientId, isAgency)
  }
}

/**
 * CPV por defecto cuando el cliente no tiene lista propia.
 * Vive aquí (módulo de datos puros) y no en placsp.ts para que la UI pueda
 * enseñar el criterio ANTES de buscar sin arrastrarse el parser del feed.
 */
export const DEFAULT_CPV = ['641', '6412', '6016', '60161', '79571', '631']

/** Qué significa cada familia CPV, para que el filtro se entienda sin buscarlo. */
export const CPV_LABEL: Record<string, string> = {
  '641': 'Servicios postales y de correos',
  '6412': 'Mensajería',
  '6016': 'Transporte de correo por carretera',
  '60161': 'Transporte de paquetes',
  '79571': 'Servicios de envío postal',
  '851431': 'Transporte sanitario',
  '85143': 'Servicios de ambulancia',
  '6013': 'Transporte de pasajeros con fin especial',
  '631': 'Manipulación y almacenamiento de carga',
  '798': 'Archivo y gestión documental',
  '635': 'Servicios de agencias de viajes y turismo',
  '7997': 'Servicios de promoción turística',
  '7934': 'Diseño y publicidad',
  '7241': 'Servicios de software',
  '48': 'Paquetes de software',
  '72': 'Servicios de TI',
  '92622': 'Servicios de promoción de eventos',
  '601': 'Transporte por carretera (familia amplia)',
}

/** Los CPV que usará el radar para este cliente. */
export function cpvFor(clientId?: string | null): string[] {
  return (clientId && CLIENT_CPV[clientId]) || DEFAULT_CPV
}
