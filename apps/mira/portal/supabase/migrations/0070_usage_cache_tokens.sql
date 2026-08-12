-- 0070 — Registrar los tokens de caché de prompts.
--
-- El refactor del chat (12-ago) separa un prefijo estable y lo marca como
-- cacheable. Sin estas dos columnas no hay forma de saber si acierta: una
-- lectura de caché cuesta 0,1× la entrada normal y escribirla 1,25×, así que
-- si cache_read se queda a cero el refactor está costando dinero en vez de
-- ahorrarlo. Se mide, no se supone.
ALTER TABLE mira_usage_log ADD COLUMN IF NOT EXISTS cache_creation_tokens integer NOT NULL DEFAULT 0;
ALTER TABLE mira_usage_log ADD COLUMN IF NOT EXISTS cache_read_tokens integer NOT NULL DEFAULT 0;
