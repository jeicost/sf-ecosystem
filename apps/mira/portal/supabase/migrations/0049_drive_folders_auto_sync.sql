-- 0049: drive_folders.auto_sync_enabled — la migración 0030 la definía pero
-- nunca llegó a la BD real (misma deriva que error_message/extracted_text en
-- 0048). La necesita el cron diario /api/cron/drive-sync (B3).
-- Default TRUE: toda carpeta de conocimiento conectada se sincroniza sola.
ALTER TABLE drive_folders
  ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT true;
