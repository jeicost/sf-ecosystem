-- 017: depósito propio de leads de las webs de clientes.
--
-- POR QUÉ EXISTE. Hasta ahora los formularios de las landings reenviaban a
-- formsubmit.co y no guardaban nada: si el tercero fallaba, el lead se perdía
-- para siempre. El 13-ago-2026 pasó exactamente eso en discoolver.com — los
-- siete formularios llevaban horas devolviendo 502 porque el par
-- (carlos@discoolver.com, discoolver.com) nunca se activó en formsubmit, y
-- nadie se enteró. Cero leads, en la única vía comercial abierta antes del
-- lanzamiento.
--
-- A partir de aquí el orden se invierte: **la base de datos es el destino y el
-- email es el aviso**. La web guarda primero y avisa después; si el aviso
-- falla, el lead ya está a salvo y el formulario puede dar las gracias con la
-- conciencia tranquila.
--
-- POR QUÉ ANON Y NO SERVICE ROLE. La landing solo necesita INSERTAR. Darle la
-- service key sería darle una llave que salta el RLS de TODAS las tablas del
-- CMS —incluidas las páginas de otros clientes— para escribir en una sola.
-- Con anon + esta política puede añadir leads y nada más: no puede leerlos,
-- ni editarlos, ni borrarlos, ni tocar ninguna otra tabla. El precio es que
-- alguien con la anon key (que es pública por diseño) podría meter filas
-- basura; se asume a propósito, porque unas cuantas filas de spam se filtran
-- en un minuto y un lead perdido no se recupera nunca.

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Qué web lo capturó. No es FK a projects a propósito: esta tabla debe
  -- sobrevivir a que un proyecto se borre del CMS, porque son datos de
  -- negocio del cliente, no contenido.
  site TEXT NOT NULL,
  -- Qué formulario concreto (hero, guias, influencer, 360-demo…). Es lo que
  -- permite saber qué convierte sin depender de la analítica.
  source TEXT NOT NULL,
  email TEXT NOT NULL,
  locale TEXT,
  -- El resto de campos del formulario, tal cual. Cada landing tiene los suyos
  -- y no merece la pena una columna por cada uno.
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Si el aviso por email llegó a salir. false = hay que mirarlo a mano.
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT leads_email_valido CHECK (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT leads_email_corto CHECK (char_length(email) <= 320),
  CONSTRAINT leads_source_corto CHECK (char_length(source) <= 64),
  CONSTRAINT leads_site_corto CHECK (char_length(site) <= 64),
  -- Tope de tamaño del payload: sin esto, el endpoint es un sitio donde subir
  -- lo que sea.
  CONSTRAINT leads_payload_corto CHECK (pg_column_size(payload) <= 8192)
);

CREATE INDEX IF NOT EXISTS idx_leads_site_fecha ON leads(site, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
-- Para detectar duplicados sin impedirlos: la misma persona puede apuntarse a
-- dos ciudades, y bloquearlo perdería la segunda intención.
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(lower(email));

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Insertar: cualquiera. Es un formulario público, esa es la gracia.
DROP POLICY IF EXISTS "Leads: alta pública" ON leads;
CREATE POLICY "Leads: alta pública" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Leer, editar y borrar: solo admin. Sin política de SELECT para anon, quien
-- inserta NO puede recuperar lo insertado — de ahí que el cliente tenga que
-- pedir `Prefer: return=minimal`.
DROP POLICY IF EXISTS "Leads: lectura admin" ON leads;
CREATE POLICY "Leads: lectura admin" ON leads
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Leads: gestión admin" ON leads;
CREATE POLICY "Leads: gestión admin" ON leads
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Leads: borrado admin" ON leads;
CREATE POLICY "Leads: borrado admin" ON leads
  FOR DELETE USING (is_admin());
