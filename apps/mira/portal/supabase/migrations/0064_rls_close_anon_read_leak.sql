-- 0064 — Cerrar la fuga de lectura anónima en brand_profiles, generation_queue
-- y content_pillars (2026-08-05).
--
-- Encontrado verificando con curl + la anon key (que es pública por
-- definición, va en NEXT_PUBLIC_SUPABASE_ANON_KEY y viaja al navegador):
-- estas 3 tablas devolvían filas de TODOS los clientes SIN NINGUNA SESIÓN.
--
--   curl "$URL/rest/v1/brand_profiles?select=client_id,mission,brand_data" -H "apikey: $ANON"
--     → el Brand Brain entero de los 6 clientes (misión, brand_data, colores...)
--   curl "$URL/rest/v1/generation_queue?select=result_data" -H "apikey: $ANON"
--     → el contenido completo de cualquier deck/informe generado
--   curl "$URL/rest/v1/content_pillars?select=*" -H "apikey: $ANON"
--     → los 25 pilares de contenido de los 5 clientes
--
-- El resto de tablas del mismo dominio (project_memory, brain_change_proposals,
-- brain_contradictions, drive_folders, drive_connections, tool_connections,
-- client_documentation, mira_projects, brand_documents, leads) ya devolvían []
-- — estas 3 se quedaron fuera de las rondas 0037/0045/0062.
--
-- Patrón idéntico al de 0037_rls_hardening.sql: SELECT para quien tenga grant
-- real en mira_project_access, más la salida de super_admin. Verificado antes
-- de aplicar que esto no deja a nadie fuera:
--   · jacostech@gmail.com          → plan super_admin (cubierto por la 2ª rama)
--   · carlos@startupsfactory.es    → plan admin, con grants reales a los 6 clientes (0059)
--   · los 5 usuarios de cliente    → grants reales a sus propios clientes
-- Solo pierden acceso las 3 cuentas ui-qa-* de pruebas, que no tienen grants.
--
-- Sin políticas de INSERT/UPDATE/DELETE a propósito: verificado que ninguna
-- ruta escribe en estas 3 tablas desde el navegador — todas las escrituras van
-- por rutas de servidor con adminClient() (service_role), que salta RLS.
-- Las 6 lecturas desde el navegador que SÍ existen sobre generation_queue
-- (documents, documents/[id], toolkit, gallery, strategy/plan,
-- admin-clients-overview) siguen funcionando: son de usuarios con sesión.

-- ⚠️ AÑADIDO TRAS APLICAR (2026-08-06): activar RLS NO bastó en 2 de las 3.
-- Verificado con la anon key después de aplicar la primera versión de esta
-- migración: generation_queue quedó cerrada, pero brand_profiles y
-- content_pillars seguían devolviendo filas sin sesión. El motivo es que ya
-- tenían una política permisiva heredada, `<tabla>_select_public`, con
-- `USING (true)` -- y cuando una tabla tiene varias políticas, Postgres las
-- combina con OR: basta con que UNA deje pasar. La política correcta de abajo
-- convivía con la permisiva y ganaba la permisiva.
--
-- Se dropean SOLO esas dos (las únicas con qual = true). Las otras 3 políticas
-- de SELECT por tabla filtran por identidad y cubren a todos los usuarios
-- reales, así que nadie legítimo pierde acceso:
--   · super_admin  → "read own client" (2ª rama) y <tabla>_select
--   · admin        → <tabla>_select (plan admin)
--   · cliente      → mira_project_access, owner_email o user_metadata.client_id
DROP POLICY IF EXISTS "brand_profiles_select_public"  ON brand_profiles;
DROP POLICY IF EXISTS "content_pillars_select_public" ON content_pillars;

-- 1) brand_profiles — la más grave: es el Brand Brain completo
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "brand_profiles: read own client" ON brand_profiles;
CREATE POLICY "brand_profiles: read own client" ON brand_profiles
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- 2) generation_queue — result_data guarda el contenido íntegro de cada
--    documento, informe y presentación generados
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "generation_queue: read own client" ON generation_queue;
CREATE POLICY "generation_queue: read own client" ON generation_queue
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- 3) content_pillars — client_id apunta a clients(id) (verificado: 5/5 de los
--    valores reales existen en clients, 0/5 en brand_profiles), así que aplica
--    el join directo, no el de 2 saltos que necesita tool_connections.
ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_pillars: read own client" ON content_pillars;
CREATE POLICY "content_pillars: read own client" ON content_pillars
  FOR SELECT USING (
    client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
  );

-- ─── Verificación posterior (ejecutar tras aplicar) ──────────────────────
-- Las 3 deben devolver 0 filas con la anon key y sin sesión:
--   curl -s "$URL/rest/v1/brand_profiles?select=id&limit=1"   -H "apikey: $ANON"   -- → []
--   curl -s "$URL/rest/v1/generation_queue?select=id&limit=1" -H "apikey: $ANON"   -- → []
--   curl -s "$URL/rest/v1/content_pillars?select=id&limit=1"  -H "apikey: $ANON"   -- → []
-- Y en la app, con sesión iniciada: /documents, /toolkit, /gallery y
-- /strategy/plan deben seguir listando exactamente lo mismo que antes.
