-- Cotizador de envíos especiales — lado MIRA del contrato v1 (25-sep-2026).
--
-- Reparto de responsabilidades (guía de conexión, commit c86786a del Cotizador):
-- MIRA orquesta y ALMACENA; el Cotizador decide y calcula. Aquí NO hay tarifas,
-- zonas, fuel, suplementos, selección de proveedor ni ranking, y no debe
-- haberlos nunca: una actualización de tarifas se hace una sola vez, allí.
--
-- Dos tablas y una regla:
--   quote_shipments  el envío estructurado (lo que MIRA tiene que saber ANTES
--                    de poder preguntar). Un envío = un destino: un manifiesto
--                    con N destinos son N filas y N cotizaciones independientes.
--   quote_results    la respuesta del motor tal cual vino. Se guarda, no se
--                    reconstruye ni se recalcula.

CREATE TABLE IF NOT EXISTS quote_shipments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- De qué encargo salió. Nullable: también se puede cotizar a mano.
  ticket_id    uuid REFERENCES email_tickets(id) ON DELETE SET NULL,
  shipment_ref text NOT NULL,

  -- País y CP ESTRUCTURADOS: el contrato prohíbe dejarlos dentro de una
  -- dirección libre. ratingArea lo devuelve el Cotizador; MIRA lo guarda
  -- exacto y no calcula equivalencias ni alias propios.
  origin_country            text,
  origin_postal_code        text,
  origin_rating_area        text,
  destination_country       text,
  destination_postal_code   text,
  destination_rating_area   text,

  -- NULL = nadie lo ha declarado. Nunca se deduce por peso o medidas.
  palletized   boolean,
  service      text NOT NULL DEFAULT 'AUTO' CHECK (service IN ('AUTO','ECONOMY','PREMIUM')),

  -- packages[]: cada entrada es una unidad o `quantity` unidades IDÉNTICAS, con
  -- medidas y peso POR UNIDAD. No existe atajo de peso total repartido.
  packages     jsonb NOT NULL DEFAULT '[]'::jsonb,
  extras       jsonb,
  declared_value_eur numeric,

  status       text NOT NULL DEFAULT 'pendiente_datos'
               CHECK (status IN ('pendiente_datos','listo','cotizado','no_cotizable')),
  -- Qué falta exactamente, calculado por lib/cotizador/readiness.ts.
  missing      jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes        text,

  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- La referencia la ve el operador y viaja al Cotizador: única por marca.
CREATE UNIQUE INDEX IF NOT EXISTS quote_shipments_ref_uq ON quote_shipments (client_id, shipment_ref);
CREATE INDEX IF NOT EXISTS quote_shipments_client_idx ON quote_shipments (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_shipments_ticket_idx ON quote_shipments (ticket_id);

CREATE TABLE IF NOT EXISTS quote_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  shipment_id    uuid NOT NULL REFERENCES quote_shipments(id) ON DELETE CASCADE,

  -- Trazabilidad que el contrato obliga a persistir SIEMPRE.
  schema_version text,
  quote_id       text,
  trace_id       text,
  data_version   text,

  -- 'OK' o el código de error estructurado del motor (MAPPING_UNAVAILABLE,
  -- MISSING_REQUIRED_DATA, NO_RATE…). Un precio solo es utilizable con OK.
  status         text NOT NULL,
  error_code     text,
  currency       text,
  recommended    jsonb,
  alternatives   jsonb,
  warnings       jsonb,
  errors         jsonb,

  -- Lo que MIRA envió y lo que recibió, para poder auditar una cotización
  -- meses después sin depender de que el motor siga dando lo mismo.
  request_snapshot jsonb NOT NULL,
  raw_response     jsonb,
  http_status      integer,

  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_results_shipment_idx ON quote_results (shipment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_results_client_idx ON quote_results (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS quote_results_trace_idx ON quote_results (trace_id);

ALTER TABLE quote_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_results   ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service-role. Las rutas autorizan con requireTool('quotes').
