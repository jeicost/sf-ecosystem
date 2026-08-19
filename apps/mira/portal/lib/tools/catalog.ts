import {
  Layers, FileText, Image, Briefcase, Mail, type LucideIcon,
} from 'lucide-react'
import { BILLING_ADDONS } from '@/lib/billing/plans'

/**
 * Catálogo de módulos de MIRA — lo que la sección «Tools» enseña.
 *
 * Dos familias, y la diferencia es comercial, no técnica:
 *
 *   'standard'   → entra con la suscripción. Todo plan de pago las tiene; lo
 *                  único que cambia entre planes es el volumen (imágenes,
 *                  personas, marcas). Son las que sostienen la promesa de
 *                  "centraliza la IA de tu empresa": informes, documentos e
 *                  imágenes de marca.
 *   'operations' → módulos para la operativa de un negocio concreto. Se abren
 *                  marca a marca desde /admin/tools (tabla client_tools, 0073)
 *                  y se cotizan uno a uno, salvo Licitaciones, que ya tiene
 *                  precio publicado.
 *
 * Mismo vocabulario de estados que el marketplace de integraciones
 * (lib/integrations/marketplace-tools.ts) y que la navegación
 * (NavItemStatus en lib/sections.ts): una herramienta está disponible,
 * bloqueada o por llegar, y la tarjeta se pinta distinta en cada caso.
 */
export interface MiraTool {
  id: string
  name: string
  icon: LucideIcon
  category: 'standard' | 'operations'
  /** Clave i18n de la descripción (tools.catalog.<id>.desc). */
  descriptionKey: string
  href: string
  /** 'subscription' = viene con el plan · 'per_client' = se habilita marca a marca. */
  availability: 'subscription' | 'per_client'
  /**
   * Complemento de lib/billing/plans.ts cuando el precio YA está publicado.
   * Sin esto la tarjeta dice "precio a medida" — que es lo que queremos por
   * defecto: cada módulo se cotiza según el caso. El precio NO se escribe aquí:
   * duplicar una cifra que también vive en la landing es un problema legal, no
   * estético (ver la cabecera de lib/billing/plans.ts).
   */
  addonId?: keyof typeof BILLING_ADDONS
  /** Contador que enseña la tarjeta. Hoy solo el Estudio Visual gasta cuota. */
  meter?: 'images'
}

export const MIRA_TOOLS: MiraTool[] = [
  {
    id: 'reports',
    name: 'Reports',
    icon: Layers,
    category: 'standard',
    descriptionKey: 'tools.catalog.reports.desc',
    href: '/toolkit',
    availability: 'subscription',
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: FileText,
    category: 'standard',
    descriptionKey: 'tools.catalog.documents.desc',
    href: '/documents',
    availability: 'subscription',
  },
  {
    id: 'visual-studio',
    name: 'Visual Studio',
    icon: Image,
    category: 'standard',
    descriptionKey: 'tools.catalog.visual-studio.desc',
    href: '/studio',
    availability: 'subscription',
    meter: 'images',
  },
  {
    id: 'tenders',
    name: 'Tenders',
    icon: Briefcase,
    category: 'operations',
    descriptionKey: 'tools.catalog.tenders.desc',
    href: '/licitaciones',
    availability: 'per_client',
    addonId: 'tenders',
  },
  {
    id: 'email-ops',
    name: 'Email Ops',
    icon: Mail,
    category: 'operations',
    descriptionKey: 'tools.catalog.email-ops.desc',
    href: '/email-ops',
    availability: 'per_client',
  },
]

/** id que usa una petición de módulo a medida (no está en el catálogo). */
export const CUSTOM_TOOL_ID = 'custom'

export function toolById(id: string): MiraTool | undefined {
  return MIRA_TOOLS.find((t) => t.id === id)
}

/** Nombre legible de un id, incluido el caso 'a medida' que no está en el catálogo. */
export function toolLabel(id: string): string {
  if (id === CUSTOM_TOOL_ID) return 'Custom module'
  return toolById(id)?.name ?? id
}

/** Las que entran con cualquier plan de pago. */
export const STANDARD_TOOLS = MIRA_TOOLS.filter((t) => t.availability === 'subscription')

/** Las que se habilitan marca a marca. */
export const PER_CLIENT_TOOLS = MIRA_TOOLS.filter((t) => t.availability === 'per_client')

/**
 * Puente con la navegación: lib/sections.ts declara `requires` con las claves
 * antiguas de entitlement ('tender', 'email-ops'), anteriores a este catálogo.
 * En vez de renombrarlas por todo el código (y arriesgar un desajuste con la
 * semilla de la 0073), se traducen aquí, en un solo sitio.
 */
export const ENTITLEMENT_TO_TOOL_ID: Record<string, string> = {
  tender: 'tenders',
  'email-ops': 'email-ops',
}
