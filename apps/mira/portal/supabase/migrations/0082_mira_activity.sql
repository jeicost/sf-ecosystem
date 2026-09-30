-- Actividad de uso (30-sep-2026).
--
-- Usoa entró a las 10:00 y no dejó ninguna huella: ni expedientes, ni llamadas
-- al modelo, ni subidas. ¿Solo miró, o algo falló en su navegador? Imposible
-- saberlo: MIRA no registraba páginas vistas ni errores, Sentry no tiene DSN y
-- los logs de Vercel no se pueden consultar hacia atrás. Esta tabla es lo
-- mínimo para que «hacer seguimiento de lo que hace alguien» sea posible.
--
-- Se escribe sin bloquear (fire-and-forget) y sin datos sensibles: ruta, acción
-- y un meta pequeño (tamaños, ids, código de error). Nunca contenido.

CREATE TABLE IF NOT EXISTS mira_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid,
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('page', 'action', 'error')),
  route       text NOT NULL,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mira_activity_user_idx   ON mira_activity (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS mira_activity_client_idx ON mira_activity (client_id, created_at DESC);

ALTER TABLE mira_activity ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service-role. La lee la agencia desde el servidor.
