-- Email Ops: buzones leídos por IMAP (24-sep-2026).
-- Aplicada a mano vía Management API.
--
-- Hasta ahora el único camino de entrada era Resend (el cliente reenvía a una
-- dirección nuestra). Eso exige dominio propio, DNS y que alguien del cliente
-- ponga una regla de reenvío. Con IMAP, MIRA lee directamente el buzón del
-- cliente con sus credenciales: cero configuración para ellos.
--
-- La contraseña se guarda CIFRADA (lib/crypto.ts, misma clave que los tokens
-- OAuth) y nunca se devuelve por la API ni se escribe en logs.
--
-- `address` sigue siendo la dirección del buzón (ahora la real del cliente,
-- p. ej. local@albasanzexpress.es), así que el webhook de Resend seguiría
-- resolviéndola si además nos reenviaran: los dos caminos conviven.

ALTER TABLE email_inboxes
  ADD COLUMN IF NOT EXISTS source            text NOT NULL DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS imap_host         text,
  ADD COLUMN IF NOT EXISTS imap_port         int  NOT NULL DEFAULT 993,
  ADD COLUMN IF NOT EXISTS imap_user         text,
  ADD COLUMN IF NOT EXISTS imap_password     text,          -- cifrada en reposo
  ADD COLUMN IF NOT EXISTS imap_last_uid     bigint,        -- último UID procesado
  ADD COLUMN IF NOT EXISTS imap_last_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS imap_last_error   text;

ALTER TABLE email_inboxes DROP CONSTRAINT IF EXISTS email_inboxes_source_check;
ALTER TABLE email_inboxes ADD CONSTRAINT email_inboxes_source_check
  CHECK (source IN ('resend', 'imap'));

-- Un buzón IMAP sin servidor ni usuario no se puede leer: mejor que la BD lo
-- impida a que el cron falle cada 10 minutos.
ALTER TABLE email_inboxes DROP CONSTRAINT IF EXISTS email_inboxes_imap_complete;
ALTER TABLE email_inboxes ADD CONSTRAINT email_inboxes_imap_complete
  CHECK (source <> 'imap' OR (imap_host IS NOT NULL AND imap_user IS NOT NULL AND imap_password IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_email_inboxes_imap
  ON email_inboxes(source, active) WHERE source = 'imap';
