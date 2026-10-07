-- Secciones que toda memoria lleva (Carlos, 7-oct-2026): «Plan de contingencia
-- incluir siempre y ellos verán si lo mantienen o no. Haz las memorias técnicas
-- lo más completas posibles por defecto y el editor final pueda eliminar las
-- secciones que no considere necesarias».
--
-- Lista de títulos por marca (el esqueleto habitual de la casa). El modelo la
-- recibe como esqueleto mínimo; TypeScript comprueba después qué falta y lo
-- redacta aparte con el modelo barato. «Plan de contingencia» va siempre, para
-- todas las marcas, aunque la lista esté vacía.

alter table public.tender_settings
  add column if not exists required_sections jsonb not null default '[]'::jsonb;

comment on column public.tender_settings.required_sections is
  'Títulos de sección que toda memoria incluye (esqueleto de la casa). Plan de contingencia va siempre.';
