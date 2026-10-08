import type { ReceivedEmail } from './resend-inbound'

// Tipos de inyección del pipeline, separados para que las fuentes de correo
// (IMAP, Microsoft Graph) puedan tiparse sin importar pipeline.ts, que a su
// vez las importa a ellas para los reintentos (sin esto habría un ciclo).

export type AttachmentFetcher = (
  resendEmailId: string,
  attachmentId: string
) => Promise<{ buffer: Buffer; filename?: string; contentType?: string }>

export interface ProcessOptions {
  /** Inyección para tests/semillas/IMAP/Graph: sustituye la llamada a Resend por un correo ya leído. */
  fetchReceived?: (resendEmailId: string) => Promise<ReceivedEmail>
  /** Ídem para los adjuntos. */
  fetchAttachment?: AttachmentFetcher
}
