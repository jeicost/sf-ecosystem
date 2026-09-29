-- Documentos de una licitación (29-sep-2026).
--
-- Hasta ahora el módulo producía UNA cosa: la memoria técnica, guardada en
-- tenders.memoria. Pero una licitación se presenta con un paquete: la memoria,
-- la oferta económica y los anexos (declaración responsable, compromiso de
-- adscripción de medios, memoria de solvencia…). Y además se trabaja sobre
-- documentos que ya existen —la memoria del año pasado, un borrador a medias—
-- que hay que poder subir, reescribir y volver a bajar en Word.
--
-- Todos comparten la misma forma: título + secciones. Por eso comparten tabla:
-- así la reescritura, la edición y la exportación se escriben UNA vez y valen
-- para los cuatro.
--
-- tenders.memoria NO se toca: sigue siendo la memoria canónica del expediente y
-- es de donde el motor aprende (few-shot de 37 memorias presentadas). Esta
-- tabla es para todo lo demás.

CREATE TABLE IF NOT EXISTS tender_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- Un documento suele colgar de un expediente, pero se admite suelto: subir un
  -- Word para mejorarlo no debería obligar a inventarse una licitación.
  tender_id   uuid REFERENCES tenders(id) ON DELETE CASCADE,

  kind        text NOT NULL CHECK (kind IN ('memoria', 'oferta', 'anexo', 'subido')),
  title       text NOT NULL,
  -- [{ titulo, contenido, criterio?, puntos_objetivo?, nota? }]
  sections    jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- De dónde salió, cuando se subió. El texto original se guarda para poder
  -- rehacer la reescritura con otra instrucción sin pedirle el fichero otra vez.
  source_filename text,
  source_text     text,
  -- La última instrucción del operador ("más fuerte en el criterio 3").
  instruction     text,

  status      text NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'revisado', 'final')),
  created_by  uuid,
  updated_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tender_documents_client_idx ON tender_documents (client_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS tender_documents_tender_idx ON tender_documents (tender_id);

ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;
-- Sin policies: solo service-role. Las rutas autorizan con requireTool('tenders').
