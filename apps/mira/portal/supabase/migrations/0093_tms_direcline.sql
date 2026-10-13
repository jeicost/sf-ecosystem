-- 0093: Volcado de partes de Email Ops al programa operativo (13-oct-2026).
-- Aplicada a mano vía Management API.
--
-- Primer programa: Direcline / DL-Nexus (Ideasys), web service SOAP
-- «WsUtilidades» (ValidarUsuario → GUID; GuardarExpedicion /
-- GrabarExpedicionSolicitud con el XML en el parámetro Valor). Documentación:
-- «Documentacion WebServiceUtilidades.pdf» v1.2 (22-01-2026).
--
-- Una conexión por marca; la contraseña va cifrada (lib/crypto.ts). Los
-- códigos propios del programa (tipo de servicio, contenido del bulto, código
-- de cliente, mensajero, vía) viven en `config` y los rellena la persona en
-- Settings: MIRA no se los inventa. El parte guarda la referencia devuelta
-- por el programa (orden de servicio, expedición, vía) para poder consultar
-- su estado después.

CREATE TABLE IF NOT EXISTS tms_connections (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  provider       text NOT NULL DEFAULT 'direcline',   -- direcline | (otros programas después)
  base_url       text NOT NULL,                       -- …/WsUtilidades/ControladorUtilidades.asmx
  username       text NOT NULL,
  password       text NOT NULL,                       -- cifrada
  culture        text NOT NULL DEFAULT 'es-ES',
  namespace      text,                                -- targetNamespace del WSDL (se lee al probar)
  config         jsonb NOT NULL DEFAULT '{}'::jsonb,  -- códigos y mapeos del programa (ver lib/tms/direcline.ts)
  active         boolean NOT NULL DEFAULT true,
  last_test_at   timestamptz,
  last_test_ok   boolean,
  last_error     text,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider)
);
ALTER TABLE tms_connections ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo el service role (rutas del servidor). La contraseña no
-- debe poder leerse nunca desde el navegador.

-- Lo que devolvió el programa al grabar el parte, y el último estado consultado.
ALTER TABLE email_tickets
  ADD COLUMN IF NOT EXISTS tms_ref    jsonb,   -- {provider, orden_servicio, orden_pedido, expedicion, referencia_entrega, via, sent_at, sent_by, xml_hash}
  ADD COLUMN IF NOT EXISTS tms_status text;    -- último estado conocido en el programa (Introducido, En reparto, Entregado…)

-- Registro de cada envío al programa (idempotencia y auditoría): un parte no
-- se graba dos veces por error.
CREATE TABLE IF NOT EXISTS tms_dispatches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ticket_id     uuid NOT NULL REFERENCES email_tickets(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES tms_connections(id) ON DELETE SET NULL,
  method        text NOT NULL,                       -- GuardarExpedicion | GrabarExpedicionSolicitud
  request_xml   text,                                -- lo enviado (sin el GUID)
  response_xml  text,                                -- lo devuelto
  ok            boolean NOT NULL DEFAULT false,
  error_code    text,
  error_message text,
  sent_by       uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tms_dispatches_ticket ON tms_dispatches(ticket_id, created_at DESC);
ALTER TABLE tms_dispatches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tms_dispatches: users read their clients" ON tms_dispatches
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
