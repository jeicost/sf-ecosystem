-- Secciones FIJAS de la casa (Carlos, 7-oct-2026): «en la memoria técnica el
-- quiénes somos, equipo humano y qué ofreceremos son casi siempre iguales;
-- toma como base el diseño de RTVE lote 2 nacional».
--
-- Texto institucional aprobado por marca, editable en Teach MIRA, que toda
-- memoria reproduce tal cual (adaptando solo la referencia al órgano). El
-- modelo lo recibe en el prompt y TypeScript comprueba después que las
-- secciones están y no se han reescrito; si falta una, la inserta.
--   [{ id, title, content, enabled }]

alter table public.tender_settings
  add column if not exists standard_sections jsonb not null default '[]'::jsonb;

comment on column public.tender_settings.standard_sections is
  'Secciones fijas de la casa: [{id,title,content,enabled}]. Se reproducen tal cual en cada memoria.';
