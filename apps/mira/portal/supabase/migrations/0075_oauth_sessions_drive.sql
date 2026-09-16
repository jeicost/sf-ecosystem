-- 0075: oauth_sessions sirve también al flujo de Google Drive
--
-- El callback de Drive leía el clientId de un `state` en base64 SIN FIRMAR que
-- viaja por el navegador del usuario. Cualquiera con sesión podía fabricar un
-- state con el UUID de otra marca, aceptar el consentimiento con SU cuenta de
-- Google y quedarse con la conexión de Drive de ese cliente: los entregables de
-- esa marca acabarían subiéndose a su Drive, y el sync alimentaría el Brand
-- Brain ajeno con sus carpetas. El comentario de la ruta hermana asumía que «el
-- state solo puede nacer autorizado» — cierto para nacer, falso para llegar.
--
-- El repo ya tenía el patrón correcto para el OAuth de integraciones: state
-- opaco guardado en esta tabla, y el client_id leído de la FILA, no del
-- parámetro. Estas dos columnas permiten reusarlo para Drive:
--   · user_id   — quién inició el flujo, para exigir que sea el mismo que vuelve
--   · return_to — a dónde devolver al usuario; sacarlo de la fila cierra de paso
--                 un open redirect (`//evil.com` pasaba el filtro startsWith('/'))
--
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE public.oauth_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS return_to text;

-- La FK original apuntaba a `mira_clients`, una tabla que no existe en este
-- proyecto (la 0027 se aplicó sin ella). No se añade FK a `clients`: estas filas
-- son efímeras y se borran al usarse.
