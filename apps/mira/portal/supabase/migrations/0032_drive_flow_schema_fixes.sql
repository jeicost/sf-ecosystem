-- 0032: Fixes de esquema para que el flujo Drive↔Brain funcione end-to-end
-- migration-date: 2026-07-19 (auditoría multi-agente)
--
-- 1. drive_connections.folder_id era NOT NULL (diseño legacy "una conexión = una
--    carpeta"); el flujo nuevo guarda las carpetas en drive_folders → nullable.
-- 2. project_memory.action_id era NOT NULL (0017), pero la memoria también se
--    escribe desde quick-actions y desde el "mapa de carpeta" de Drive sin acción.
-- 3. agent_documents necesita source_metadata (jsonb) para dedup por
--    google_drive_file_id en el sync de carpetas.

ALTER TABLE drive_connections ALTER COLUMN folder_id DROP NOT NULL;
ALTER TABLE drive_connections ALTER COLUMN folder_name DROP NOT NULL;

ALTER TABLE project_memory ALTER COLUMN action_id DROP NOT NULL;

ALTER TABLE agent_documents ADD COLUMN IF NOT EXISTS source_metadata jsonb;
