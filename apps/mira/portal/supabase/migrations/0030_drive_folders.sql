-- 0030: Sistema Drive ↔ Brain — carpetas de Drive por cliente/proyecto
-- migration-date: 2026-07-19
-- Cada cliente puede tener N carpetas de Drive conectadas (por enlace), con propósito
-- (referencias, marca, logos, entregables, entrenamiento). El sync ingesta documentos
-- a agent_documents y escribe un "mapa de carpeta" en project_memory.

-- Fix: la tabla drive_connections de producción no tenía is_authorized (el callback OAuth la escribe)
ALTER TABLE drive_connections ADD COLUMN IF NOT EXISTS is_authorized boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS drive_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES mira_projects(id) ON DELETE SET NULL,
  folder_id text NOT NULL,
  folder_name text,
  purpose text DEFAULT 'references' CHECK (purpose IN ('references','brand','logos','deliverables','training','other')),
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending',
  files_synced integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_id, folder_id)
);

CREATE INDEX IF NOT EXISTS idx_drive_folders_client ON drive_folders(client_id);

ALTER TABLE drive_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drive_folders: users read their clients" ON drive_folders
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );
