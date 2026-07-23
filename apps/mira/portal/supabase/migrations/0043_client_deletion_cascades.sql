-- 0043 — Client deletion cascades (Fase 2 roadmap: "Sin proceso de borrado de
-- cuenta/GDPR real: leads/crm_contacts sin FK/cascade hacia clients; ni
-- endpoint ni runbook.")
-- Aplicar a mano en el SQL editor del dashboard (proyecto nnevhtfxuawexliwlbmh).
--
-- INVESTIGACIÓN (2026-07-23) — grep de `references clients(id)` (case-insensitive)
-- en todo este directorio: TODAS las FKs client_id -> clients(id) ya declaradas
-- en migraciones (0013, 0014, 0015, 0017, 0018, 0019, 0022, 0023, 0028, 0029,
-- 0030, 0033, 0034, 0036, 0041, 0042) ya tienen ON DELETE CASCADE. El roadmap
-- apuntaba a "leads/crm_contacts" pero eso está desactualizado en un punto y
-- confirmado exacto en el otro:
--
--   - leads SÍ sigue sin FK/cascade — confirmado por el baseline de 0031
--     (esquema introspectado de prod real): `client_id uuid` sin REFERENCES.
--   - crm_contacts NO tiene columna client_id en absoluto (ver 0031 y el punto
--     5 de 0037) — usa `workspace_id text`, puenteado a `clients` vía la tabla
--     client_workspaces (0034, esa sí con FK+CASCADE). No se le puede añadir
--     un FK a clients(id) aquí sin rediseñar el esquema; fuera de alcance de
--     esta migración. scripts/delete-client-data.mjs resuelve el workspace_id
--     vía client_workspaces y solo AVISA de las filas de crm_contacts que
--     quedarían huérfanas — no las borra, porque esa tabla es compartida con
--     sf-crm (otra app), no propiedad exclusiva de MIRA.
--
-- Revisando el resto de tablas client-scoped (no solo las 2 del roadmap) se
-- encontraron 4 más en el mismo estado que leads — client_id sin FK, también
-- confirmadas por el baseline 0031: approval_queue, post_history, alerts,
-- agent_interactions. Y una sexta fuera del baseline (nunca tuvo CREATE TABLE
-- versionado, solo ALTERs puntuales en 0030/0032, pero sí existe en prod y sí
-- tiene client_id — ver lib/drive-connection.types.ts): drive_connections.
--
-- Nota aparte (no requiere acción aquí): 0033_usage_log.sql declara
-- `usage_log` con cascade, pero ese CREATE TABLE IF NOT EXISTS fue un no-op —
-- apps/sf-sales-engine ya tenía su propia tabla `usage_log` con un esquema
-- totalmente distinto (ver 0042). La `usage_log` real en prod NO es de MIRA;
-- no se toca en esta migración ni en el script de borrado.
--
-- Cada fix va envuelto en un guard: no falla si la tabla no existe (deriva de
-- esquema), no falla si el constraint ya existe (re-ejecutable), y si hay
-- filas huérfanas con un client_id que ya no existe en clients, avisa con
-- RAISE NOTICE y sigue sin abortar el resto de la migración — limpiar esas
-- filas a mano y re-ejecutar.

DO $$
BEGIN
  IF to_regclass('public.leads') IS NOT NULL THEN
    BEGIN
      ALTER TABLE leads
        ADD CONSTRAINT leads_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'leads: filas con client_id huérfano (sin clients.id correspondiente) -- limpiar y re-ejecutar. Constraint NO añadido.';
      WHEN undefined_column THEN
        RAISE NOTICE 'leads: columna client_id no encontrada -- deriva de esquema, revisar a mano. Constraint NO añadido.';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.approval_queue') IS NOT NULL THEN
    BEGIN
      ALTER TABLE approval_queue
        ADD CONSTRAINT approval_queue_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'approval_queue: filas con client_id huérfano -- limpiar y re-ejecutar. Constraint NO añadido.';
      WHEN undefined_column THEN
        RAISE NOTICE 'approval_queue: columna client_id no encontrada -- revisar a mano. Constraint NO añadido.';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.post_history') IS NOT NULL THEN
    BEGIN
      ALTER TABLE post_history
        ADD CONSTRAINT post_history_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'post_history: filas con client_id huérfano -- limpiar y re-ejecutar. Constraint NO añadido.';
      WHEN undefined_column THEN
        RAISE NOTICE 'post_history: columna client_id no encontrada -- revisar a mano. Constraint NO añadido.';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.alerts') IS NOT NULL THEN
    BEGIN
      ALTER TABLE alerts
        ADD CONSTRAINT alerts_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'alerts: filas con client_id huérfano -- limpiar y re-ejecutar. Constraint NO añadido.';
      WHEN undefined_column THEN
        RAISE NOTICE 'alerts: columna client_id no encontrada -- revisar a mano. Constraint NO añadido.';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.agent_interactions') IS NOT NULL THEN
    BEGIN
      ALTER TABLE agent_interactions
        ADD CONSTRAINT agent_interactions_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'agent_interactions: filas con client_id huérfano -- limpiar y re-ejecutar. Constraint NO añadido.';
      WHEN undefined_column THEN
        RAISE NOTICE 'agent_interactions: columna client_id no encontrada -- revisar a mano. Constraint NO añadido.';
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.drive_connections') IS NOT NULL THEN
    BEGIN
      ALTER TABLE drive_connections
        ADD CONSTRAINT drive_connections_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'drive_connections: filas con client_id huérfano -- limpiar y re-ejecutar. Constraint NO añadido.';
      WHEN undefined_column THEN
        RAISE NOTICE 'drive_connections: columna client_id no encontrada -- revisar a mano. Constraint NO añadido.';
    END;
  END IF;
END $$;
