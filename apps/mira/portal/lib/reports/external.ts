// Informes externos (hoy: Power BI) dentro de Business Reports.
//
// MIRA no guarda ni un dato del informe: guarda DÓNDE está y en qué estado.
// Quién puede verlo lo decide Power BI, con sus permisos, su RLS y su OLS —
// MIRA no puede saltárselos ni debería intentarlo.

export type ExternalReportStatus = 'connected' | 'action_required' | 'not_configured' | 'disabled'

export interface ExternalReport {
  id: string
  client_id: string
  slug: string
  title: string
  description: string | null
  provider: 'powerbi'
  category: string
  embed_url: string | null
  external_url: string | null
  status: ExternalReportStatus
  access_mode: 'organization'
  workspace_label: string | null
  owner: string | null
  display_order: number
  report_id: string | null
  powerbi_workspace_id: string | null
  created_at: string
  updated_at: string
}

export const EXTERNAL_REPORT_COLS =
  'id,client_id,slug,title,description,provider,category,embed_url,external_url,status,access_mode,' +
  'workspace_label,owner,display_order,report_id,powerbi_workspace_id,created_at,updated_at'

/** Hosts admitidos para incrustar. Cualquier otro se rechaza al guardar. */
const POWERBI_HOSTS = ['app.powerbi.com', 'app.powerbigov.us']

export interface UrlVerdict { ok: boolean; reason?: string }

/**
 * Valida una URL de incrustación. Hay tres motivos para rechazarla y el
 * tercero es el importante:
 *
 *   · tiene que ser HTTPS;
 *   · tiene que ser de Power BI, no de cualquier sitio que alguien pegue;
 *   · NO puede ser un enlace de «Publicar en la web».
 *
 * «Publicar en la web» genera una URL PÚBLICA y ANÓNIMA — cualquiera con el
 * enlace ve el informe, sin cuenta y sin permisos. Para datos de envíos y
 * facturación eso es una filtración, no una opción de configuración, y por eso
 * la especificación lo prohíbe explícitamente. Esas URL tienen la forma
 * app.powerbi.com/view?r=… , así que se pueden reconocer y bloquear aquí en vez
 * de confiar en que nadie se equivoque.
 */
export function validateEmbedUrl(raw: string): UrlVerdict {
  let u: URL
  try { u = new URL(raw) } catch { return { ok: false, reason: 'La URL no es válida.' } }
  if (u.protocol !== 'https:') return { ok: false, reason: 'La URL de incrustación tiene que ser HTTPS.' }
  if (!POWERBI_HOSTS.includes(u.hostname.toLowerCase())) {
    return { ok: false, reason: `Solo se admiten URL de Power BI (${POWERBI_HOSTS.join(', ')}).` }
  }
  const path = u.pathname.toLowerCase()
  if (path === '/view' || path.startsWith('/view/')) {
    return { ok: false, reason: 'Esa es una URL de «Publicar en la web»: es pública y anónima. Usa Archivo → Insertar informe → Sitio web o portal.' }
  }
  return { ok: true }
}

/** La URL normal del informe, para «Abrir en Power BI». Mismo veto al público. */
export function validateExternalUrl(raw: string): UrlVerdict {
  return validateEmbedUrl(raw)
}

/**
 * Estado que corresponde a un informe según lo que tenga configurado. Nunca se
 * declara «connected» un informe sin URL: un iframe vacío es peor que un aviso.
 */
export function deriveStatus(embedUrl: string | null, requested?: ExternalReportStatus): ExternalReportStatus {
  if (requested === 'disabled') return 'disabled'
  if (!embedUrl) return 'not_configured'
  return requested === 'action_required' ? 'action_required' : 'connected'
}
