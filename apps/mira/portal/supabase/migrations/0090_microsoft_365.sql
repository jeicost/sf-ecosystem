-- 0090: Conector Microsoft 365 (8-oct-2026). Aplicada a mano vía Management API.
--
-- Carlos (7-oct): «nos interesa irnos integrando con el entorno de Microsoft
-- 365 al igual que con Google». Primer uso real: las carpetas del equipo
-- comercial de grupo Aldea (histórico de clientes y condiciones) para la
-- herramienta de propuestas, y el buzón local@albasanzexpress.es, que es de
-- Microsoft 365 y no admite IMAP por contraseña (MX → outlook.com).
--
-- Diseño:
--   · Una marca puede tener VARIAS cuentas de Microsoft conectadas (la del
--     comercial para sus carpetas, la del buzón de operaciones para el correo).
--     Tokens cifrados en reposo con lib/crypto.ts, como los de Drive e IMAP.
--   · Las carpetas van en tabla propia (no en drive_folders): Graph tiene
--     consultas delta y hace falta guardar el enlace; mezclar proveedores en una
--     tabla habría obligado a tocar el cron, los paneles y el sync de Google.
--   · Los ficheros conocidos de cada carpeta se registran UNO A UNO
--     (microsoft_items): una carpeta comercial puede tener miles y no se ingieren
--     en una sola pasada. La cola permite ingerir por tandas, enseñar el avance
--     («1.240 de 3.800») y, en la fase siguiente, anotar de qué fichero salió
--     cada ficha de condiciones.
--   · Los documentos ingeridos caen en agent_documents (document_type
--     'microsoft_sync') y entran al índice unificado knowledge_items.
--   · El correo por Graph reutiliza email_inboxes con source = 'microsoft'.

CREATE TABLE IF NOT EXISTS microsoft_connections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id          uuid,                       -- usuario de MIRA que conectó la cuenta
  account_email    text NOT NULL,              -- UPN de la cuenta Microsoft (preferred_username)
  account_name     text,
  tenant_id        text,                       -- tid del id_token: el inquilino de Microsoft 365 del cliente
  access_token     text NOT NULL,              -- cifrado
  refresh_token    text,                       -- cifrado (Microsoft lo ROTA en cada refresco)
  token_expires_at timestamptz,
  granted_scopes   text[],
  purposes         text[] NOT NULL DEFAULT '{}',  -- 'files' | 'mail' (para qué se pidió el consentimiento)
  is_authorized    boolean NOT NULL DEFAULT true,
  last_error       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, account_email)
);
CREATE INDEX IF NOT EXISTS idx_microsoft_connections_client ON microsoft_connections(client_id);
ALTER TABLE microsoft_connections ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo el service role (rutas del servidor) lee y escribe.
-- Los tokens no deben poder leerse nunca desde el navegador.

CREATE TABLE IF NOT EXISTS microsoft_folders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  connection_id     uuid NOT NULL REFERENCES microsoft_connections(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  drive_id          text NOT NULL,             -- unidad de OneDrive o biblioteca de SharePoint
  item_id           text NOT NULL,             -- carpeta raíz conectada ('root' para la unidad entera)
  folder_name       text,
  folder_path       text,                      -- ruta dentro de la unidad, para calcular rutas relativas
  web_url           text,
  purpose           text NOT NULL DEFAULT 'commercial'
                    CHECK (purpose IN ('commercial','references','brand','training','other')),
  auto_sync_enabled boolean NOT NULL DEFAULT true,
  sync_status       text NOT NULL DEFAULT 'pending',   -- pending | syncing | partial | completed | error
  last_synced_at    timestamptz,
  last_error        text,
  delta_link        text,                      -- enlace delta de Graph tras la última enumeración
  files_total       integer NOT NULL DEFAULT 0,  -- ficheros conocidos (todos los formatos)
  files_synced      integer NOT NULL DEFAULT 0,  -- ingeridos en agent_documents
  inventory         jsonb,                     -- informe de inventario (por tipo, por año, subcarpetas)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, drive_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_microsoft_folders_client ON microsoft_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_microsoft_folders_sync ON microsoft_folders(auto_sync_enabled, sync_status, last_synced_at);
ALTER TABLE microsoft_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "microsoft_folders: users read their clients" ON microsoft_folders
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

CREATE TABLE IF NOT EXISTS microsoft_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_row_id  uuid NOT NULL REFERENCES microsoft_folders(id) ON DELETE CASCADE,
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  drive_id       text NOT NULL,
  item_id        text NOT NULL,
  name           text NOT NULL,
  path           text NOT NULL,                -- relativa a la carpeta conectada ("Clientes/ACME/Oferta 2025.docx")
  mime_type      text,
  size           bigint,
  modified_at    timestamptz,
  content_hash   text,                         -- quickXorHash de Graph, o cTag: cambia solo si cambia el contenido
  web_url        text,
  readable       boolean NOT NULL DEFAULT false,  -- formato que sabemos leer
  status         text NOT NULL DEFAULT 'pending',  -- pending | done | skipped | error | deleted
  error          text,
  document_id    uuid,                         -- agent_documents.id cuando se ingirió
  ingested_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (folder_row_id, item_id)
);
CREATE INDEX IF NOT EXISTS idx_microsoft_items_queue ON microsoft_items(folder_row_id, status, readable, modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_microsoft_items_client ON microsoft_items(client_id);
ALTER TABLE microsoft_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "microsoft_items: users read their clients" ON microsoft_items
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- Buzón leído por Microsoft Graph (OAuth), tercera fuente junto a Resend e IMAP.
ALTER TABLE email_inboxes
  ADD COLUMN IF NOT EXISTS ms_connection_id uuid REFERENCES microsoft_connections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ms_delta_link    text;

ALTER TABLE email_inboxes DROP CONSTRAINT IF EXISTS email_inboxes_source_check;
ALTER TABLE email_inboxes ADD CONSTRAINT email_inboxes_source_check
  CHECK (source IN ('resend', 'imap', 'microsoft'));

ALTER TABLE email_inboxes DROP CONSTRAINT IF EXISTS email_inboxes_microsoft_complete;
ALTER TABLE email_inboxes ADD CONSTRAINT email_inboxes_microsoft_complete
  CHECK (source <> 'microsoft' OR ms_connection_id IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_email_inboxes_microsoft
  ON email_inboxes(source, active) WHERE source = 'microsoft';

-- Índice unificado: los documentos de Microsoft se distinguen de los de Drive.
CREATE OR REPLACE VIEW knowledge_items AS
  SELECT
    id, client_id, project_id,
    CASE
      WHEN document_type = 'drive_sync' THEN 'drive'
      WHEN document_type = 'microsoft_sync' THEN 'microsoft'
      ELSE 'upload_chat'
    END AS source,
    agent_role,
    title,
    COALESCE(NULLIF(analysis_summary, ''), description) AS summary,
    extracted_text AS content,
    file_url AS url,
    created_at
  FROM agent_documents
  UNION ALL
  SELECT
    id, client_id, project_id,
    'upload' AS source,
    NULL AS agent_role,
    title,
    description AS summary,
    extracted_text AS content,
    storage_url AS url,
    created_at
  FROM client_documentation
  WHERE is_archived IS NOT TRUE
  UNION ALL
  SELECT
    id, client_id, project_id,
    'reference' AS source,
    NULL AS agent_role,
    title,
    why_worked AS summary,
    what_to_repeat AS content,
    url,
    created_at
  FROM brand_references
  UNION ALL
  SELECT
    id, client_id, project_id,
    'brand_doc' AS source,
    NULL AS agent_role,
    title,
    description AS summary,
    extracted_text AS content,
    NULLIF(file_url, '') AS url,
    uploaded_at AS created_at
  FROM brand_documents
  WHERE is_archived IS NOT TRUE;
