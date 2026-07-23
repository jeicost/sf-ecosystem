-- 0044: drive_connections.granted_scopes — registra el scope OAuth realmente concedido
-- migration-date: 2026-07-23
--
-- DEBT.md (k): el authorize de Brand Brain pide drive.readonly + drive.file
-- (app/api/brand-brain/drive/authorize/route.ts:83-86), pero drive_connections
-- nunca guardó qué scopes concedió Google en el callback -- no había forma de
-- distinguir una conexión antigua (solo drive.readonly, anterior al cambio) de
-- una que ya tiene drive.file. Sin esa distinción, app/api/export/google-drive
-- cae en silencio al Service Account para clientes con conexiones antiguas y
-- nadie se entera de que reconectar lo arreglaría.
--
-- A partir de esta migración, el callback (app/api/brand-brain/drive/callback/
-- route.ts) escribe aquí el array de scopes que Google devolvió en el
-- token exchange. Las filas existentes quedan con granted_scopes = NULL --
-- se tratan como "scope insuficiente/desconocido" hasta que el cliente
-- reconecte, que es el default conservador correcto.

ALTER TABLE drive_connections ADD COLUMN IF NOT EXISTS granted_scopes text[];
