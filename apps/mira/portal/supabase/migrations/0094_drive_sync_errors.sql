-- 0094: Fallos de ingesta de Drive visibles (13-oct-2026). Aplicada a mano vía
-- Management API (nunca `supabase db push` en MIRA).
--
-- Hasta ahora un fichero de Drive que no se podía leer solo dejaba un
-- console.warn en el servidor y la carpeta salía «completed» con el fichero
-- fuera; y una carpeta en error no guardaba el motivo. La auditoría AS-IS de
-- Alessandro (16-sep) pedía «estado explícito, motivo visible, reintento y
-- responsable». `last_error` guarda el motivo del último fallo de carpeta;
-- `file_errors`, los ficheros que no se pudieron leer en la última pasada
-- ([{file_id, name, path, reason, at}]). Los escribe lib/drive-sync.ts y los
-- enseña components/DriveFoldersPanel.tsx, con el botón de reintentar.
alter table public.drive_folders
  add column if not exists last_error text,
  add column if not exists file_errors jsonb not null default '[]'::jsonb;

comment on column public.drive_folders.last_error is
  'Motivo del último fallo de sincronización de la carpeta; null si la última pasada fue bien';
comment on column public.drive_folders.file_errors is
  'Ficheros que no se pudieron leer en la última pasada: [{file_id, name, path, reason, at}]';
