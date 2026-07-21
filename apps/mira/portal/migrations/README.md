# ⚠️ Carpeta legacy — NO añadir migraciones aquí

La carpeta canónica de migraciones de MIRA es **`../supabase/migrations/`** (0009→…, numeración continua). Estos tres ficheros (0001-0003) son anteriores a esa convención y se conservan solo como histórico; sus tablas ya existen en prod (`nnevhtfxuawexliwlbmh`).

Toda migración nueva va a `apps/mira/portal/supabase/migrations/` con el siguiente número libre, y se aplica a mano por el SQL editor del dashboard de Supabase (no hay runner automático). Ojo: hay números duplicados históricos (0022, 0023, 0024 ×2) — comprobar el último número real antes de nombrar.
