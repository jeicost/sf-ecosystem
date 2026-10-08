-- 0091: Email Ops — responder desde el buzón que recibió el correo (8-oct-2026).
-- Aplicada a mano vía Management API.
--
-- Carlos: «no quiero que lo mande MIRA directamente sino que se responda desde
-- el correo que recibe la notificación, para no tener que copiar y pegar». La
-- respuesta sale por el propio buzón del cliente (SMTP con las credenciales
-- que ya guardamos para leerlo por IMAP; Graph en los de Microsoft 365), en el
-- mismo hilo y con copia en «Enviados». Siempre con una persona pulsando
-- «Enviar» tras ver el texto.
--
-- Modo prueba (Carlos: «me gustaría hacerlo con uno de prueba, no responder a
-- un cliente de verdad»): mientras reply_test_to tenga una dirección, TODA
-- respuesta de esa marca va a esa dirección, con el asunto marcado y una nota
-- de a quién habría ido. Se desactiva vaciándolo.

ALTER TABLE email_messages
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound',
  ADD COLUMN IF NOT EXISTS sent_by   uuid;
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_direction_check;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_direction_check
  CHECK (direction IN ('inbound', 'outbound'));
-- Un correo enviado no pasa por el pipeline: su estado es 'sent' y nunca
-- 'received', así que processPending (received/failed) no lo toca.
ALTER TABLE email_messages DROP CONSTRAINT IF EXISTS email_messages_status_check;
ALTER TABLE email_messages ADD CONSTRAINT email_messages_status_check
  CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored', 'sent'));

-- Servidor de salida del buzón leído por IMAP. Si está vacío se deriva del de
-- entrada (imap.x → smtp.x, 465 SSL), que es lo habitual (Arsys, IONOS, Gmail).
ALTER TABLE email_inboxes
  ADD COLUMN IF NOT EXISTS smtp_host   text,
  ADD COLUMN IF NOT EXISTS smtp_port   int,
  ADD COLUMN IF NOT EXISTS smtp_secure boolean NOT NULL DEFAULT true;

ALTER TABLE email_ops_settings
  ADD COLUMN IF NOT EXISTS reply_test_to   text,   -- modo prueba: todo va aquí
  ADD COLUMN IF NOT EXISTS reply_signature text;   -- firma de la marca al pie de las respuestas
