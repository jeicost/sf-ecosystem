-- Informes externos dentro de Business Reports (25-sep-2026).
--
-- Especificación «MIRA · Power BI Reports Integration» (sept-2026): Power BI
-- sigue siendo el motor de analítica y la AUTORIDAD DE PERMISOS; MIRA pone la
-- navegación, el contexto y los estados. No se copian datos, no se rehacen
-- gráficas y no se usa jamás «Publicar en la web».
--
-- La configuración vive en base de datos y no en el código porque las URL de
-- incrustación las pega Carlos cuando Power BI se las da: pedir un despliegue
-- para cambiar una URL sería convertir una config en una release.
--
-- Multi-inquilino (esto la especificación no lo cubre, MIRA sí): cada informe
-- pertenece a UN cliente y las rutas filtran por client_id. Un informe de
-- facturación de una marca no puede aparecer en otra.

CREATE TABLE IF NOT EXISTS external_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  title       text NOT NULL,
  description text,
  provider    text NOT NULL DEFAULT 'powerbi' CHECK (provider IN ('powerbi')),
  category    text NOT NULL DEFAULT 'operations',

  -- URL segura de «Insertar informe → Sitio web o portal». NO es un secreto,
  -- pero tampoco se duplica por el código.
  embed_url    text,
  -- URL normal del informe, para el enlace «Abrir en Power BI» que siempre
  -- tiene que estar disponible aunque el iframe falle.
  external_url text,

  status      text NOT NULL DEFAULT 'not_configured'
              CHECK (status IN ('connected','action_required','not_configured','disabled')),
  access_mode text NOT NULL DEFAULT 'organization' CHECK (access_mode IN ('organization')),

  workspace_label text,
  owner           text,
  display_order   integer NOT NULL DEFAULT 0,
  -- Útiles el día que se migre al SDK (fase 2). Opcionales hoy.
  report_id            text,
  powerbi_workspace_id text,

  created_by  uuid,
  updated_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS external_reports_slug_uq ON external_reports (client_id, slug);
CREATE INDEX IF NOT EXISTS external_reports_client_idx ON external_reports (client_id, display_order, created_at);

ALTER TABLE external_reports ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service-role. Las rutas autorizan con requireTool('reports').
