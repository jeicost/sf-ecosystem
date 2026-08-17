// Tipos compartidos entre pipeline, API y UI de Email Ops (sin imports de servidor).
import type { FieldValue } from './schema'

export type TicketKind = 'shipment_request' | 'other'
export type TicketStatus = 'open' | 'closed' | 'discarded'
export type MessageStatus = 'received' | 'processing' | 'processed' | 'failed' | 'ignored'

/** Salida validada de la IA para UN mensaje. */
export interface Extraction {
  kind: TicketKind
  summary: string
  original_sender: string | null
  urgency: number
  fields: Record<string, FieldValue>
  confidence: Record<string, number>
  evidence: Record<string, string>
  notes: string | null
}

export interface ManualOverride {
  by: string | null
  at: string
}

export interface TicketRow {
  id: string
  client_id: string
  inbox_id: string | null
  department: string | null
  thread_key: string
  kind: TicketKind
  status: TicketStatus
  priority: number
  service_date: string | null
  delivery_type: string | null
  subject: string | null
  from_address: string | null
  original_sender: string | null
  summary: string | null
  fields: Record<string, FieldValue>
  confidence: Record<string, number>
  evidence: Record<string, string>
  missing_fields: string[]
  manual_overrides: Record<string, ManualOverride>
  urgency: number | null
  message_count: number
  first_message_at: string | null
  last_message_at: string | null
  closed_at: string | null
  closed_by: string | null
  created_at: string
  updated_at: string
}

export interface StoredAttachment {
  resend_id: string
  filename: string
  content_type: string
  size: number | null
  /** Ruta en el bucket brand-assets ({clientId}/email-ops/{messageId}/{file}). */
  path: string | null
  /** Texto extraído (PDF/docx/txt) o descripción (imagen), recortado. */
  extracted: string | null
}

export interface MessageRow {
  id: string
  client_id: string
  inbox_id: string | null
  ticket_id: string | null
  resend_email_id: string
  message_id: string | null
  in_reply_to: string | null
  references_ids: string[] | null
  thread_key: string | null
  from_address: string | null
  from_name: string | null
  to_addresses: string[] | null
  cc_addresses: string[] | null
  subject: string | null
  text_body: string | null
  html_body: string | null
  attachments: StoredAttachment[]
  extraction: Extraction | null
  status: MessageStatus
  attempts: number
  last_error: string | null
  received_at: string
  processed_at: string | null
}
