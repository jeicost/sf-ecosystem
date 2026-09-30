-- Plantilla del Word de licitaciones, por marca. Hasta ahora el Word salía en
-- Arial negro sin portada ni membrete y la maquetación la ponía Usoa a mano.
-- La plantilla vive aquí (no en el código) porque son datos de la empresa:
-- color de portada, línea legal del pie (NIF, dirección, teléfono, correo),
-- nombre con el que firma, lema. Lo que no esté, cae en clients.logo_url y
-- clients.primary_color.
alter table public.tender_settings
  add column if not exists template jsonb not null default '{}'::jsonb;

comment on column public.tender_settings.template is
  'Plantilla del Word: {cover_color, accent_color, company_name, tagline, footer_line, logo_path, font}';
