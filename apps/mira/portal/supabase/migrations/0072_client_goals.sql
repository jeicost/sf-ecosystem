-- 0072: Objetivos del sistema — «3 posts + 2 newsletters con sus playbooks
-- esta semana, corriendo con la sola supervisión del cliente».
--
-- Diseño cerrado con el CEO el 17-ago-2026 (docs/OBJETIVOS_DEL_SISTEMA_DISENO.md).
-- Lo esencial para leer estas dos tablas:
--
--  · Un objetivo (client_goals) es la frase del cliente hecha spec + un
--    periodo. Se descompone en tareas (goal_tasks), cada una una generación
--    concreta con su día previsto.
--  · Las tareas forman un ÁRBOL, no una lista: `depends_on` apunta a la pieza
--    madre (el playbook de la newsletter 2 depende de la newsletter 2). El
--    ejecutor solo lanza una hija cuando la madre está APROBADA, y le pasa el
--    resultado de la madre como material de partida. Aprobar la madre dispara
--    la hija sola: eso es «con la sola supervisión del cliente».
--  · El resultado de una tarea NO se copia aquí: `result_ref` apunta a la fila
--    que ya existe (approval_queue.id para piezas, generation_queue.id para
--    documentos). No duplicamos contenido, apuntamos a él.
--  · Rechazar es feedback: `reject_note` guarda la línea del cliente, se
--    regenera UNA vez (attempt 2) y si vuelve a rechazarse se para y avisa. La
--    nota va además a project_memory para la semana siguiente.

CREATE TABLE IF NOT EXISTS client_goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL,
  title         text NOT NULL,                     -- «Semana 34»
  -- La frase tal cual la escribió quien lo creó. Se guarda porque el
  -- planificador puede mejorar con el tiempo y conviene poder re-planificar.
  brief         text NOT NULL,
  -- La spec estructurada que devolvió el planificador y confirmó el humano:
  -- { items:[{kind, count, pillar?, platform?, for?}], notes? }
  spec          jsonb NOT NULL DEFAULT '{}'::jsonb,
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  -- draft: planificado, sin confirmar · active: confirmado, ejecutándose ·
  -- done: periodo cerrado · paused: parado a mano
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','done','paused')),
  -- Quién lo creó (cliente o agencia); ambos pueden, decisión CEO.
  created_by    uuid,
  confirmed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_goals_periodo CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_client_goals_client ON client_goals(client_id, status, period_start DESC);

CREATE TABLE IF NOT EXISTS goal_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id       uuid NOT NULL REFERENCES client_goals(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL,                     -- desnormalizado: RLS y consultas por cliente
  -- Qué es (post, newsletter, playbook, carousel, video_brief…). Vocabulario
  -- del planificador; no se restringe con CHECK para no bloquear tipos nuevos.
  kind          text NOT NULL,
  -- Cómo se genera: id de quick action (crear_post, crear_newsletter…) o
  -- docType del Centro de Documentos (doc-playbook…). Es lo que el ejecutor
  -- despacha; una tarea sin action_id no se puede ejecutar.
  action_id     text NOT NULL,
  -- Parámetros de la generación: pilar, plataforma, tema, tono, y para las
  -- hijas, qué parte de la madre usar como input.
  params        jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Orden humano dentro del objetivo (post 1, post 2…). Solo para pintar.
  position      int NOT NULL DEFAULT 0,
  -- Cuándo generar. Decisión CEO: el día anterior a las 06:00 hora del cliente.
  scheduled_for timestamptz NOT NULL,
  -- La madre. NULL = raíz. Una hija no se genera hasta que la madre está approved.
  depends_on    uuid REFERENCES goal_tasks(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','waiting','generating','queued','approved','rejected','failed','skipped')),
  -- A qué fila apunta el resultado. Ver cabecera.
  result_kind   text CHECK (result_kind IN ('approval_queue','generation_queue')),
  result_ref    uuid,
  attempts      int NOT NULL DEFAULT 0,
  max_attempts  int NOT NULL DEFAULT 2,             -- 1 generación + 1 regeneración con nota
  last_error    text,
  reject_note   text,                               -- lo que dijo el cliente al rechazar
  generated_at  timestamptz,
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- El ejecutor pregunta cada hora: «¿qué está pending y vencido?». Este índice
-- es esa pregunta.
CREATE INDEX IF NOT EXISTS idx_goal_tasks_due ON goal_tasks(status, scheduled_for) WHERE status IN ('pending','waiting');
CREATE INDEX IF NOT EXISTS idx_goal_tasks_goal ON goal_tasks(goal_id, position);
-- Cuando se aprueba una madre hay que encontrar a sus hijas.
CREATE INDEX IF NOT EXISTS idx_goal_tasks_parent ON goal_tasks(depends_on) WHERE depends_on IS NOT NULL;
-- Cuando el cliente aprueba/rechaza en la cola, hay que encontrar la tarea.
CREATE INDEX IF NOT EXISTS idx_goal_tasks_result ON goal_tasks(result_kind, result_ref) WHERE result_ref IS NOT NULL;

-- ── RLS — mismo patrón que 0071 (email_ops) ─────────────────────────────────
-- Las rutas van con service_role tras resolveRequestClient; esto es cinturón
-- por si algún día se lee desde el navegador con la publishable key.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['client_goals','goal_tasks']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "%s: read own client" ON %I', t, t);
    EXECUTE format($p$
      CREATE POLICY "%s: read own client" ON %I FOR SELECT USING (
        client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
        OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
      )$p$, t, t);
    EXECUTE format('REVOKE ALL ON %I FROM anon', t);
  END LOOP;
END $$;

-- updated_at automático, como el resto de tablas con ese campo.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_client_goals_updated ON client_goals;
CREATE TRIGGER trg_client_goals_updated BEFORE UPDATE ON client_goals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_goal_tasks_updated ON goal_tasks;
CREATE TRIGGER trg_goal_tasks_updated BEFORE UPDATE ON goal_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
