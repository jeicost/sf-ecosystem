-- Secciones con diseño propio de la empresa (Carlos, 6-oct-2026).
--
-- Las memorias reales de GTD llevan páginas maquetadas por su diseñador
-- (certificaciones, flota, organigrama, red de agencias) que un generador de
-- texto no puede reproducir. Aquí se guardan como imágenes de página, con sus
-- palabras clave, y el redactor las marca donde tocan ([[DISEÑO:id]]); el Word
-- las inserta a sangre completa (page) o como figura dentro del texto (figure).
-- Las de always_include entran siempre, como anexo, aunque nadie las marque.
--
-- El membrete oficial (la «hoja» .docx de la marca) NO va aquí: es una ruta
-- más dentro de tender_settings.template (letterhead_path, body_font).

create table if not exists public.tender_brand_sections (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 200),
  keywords        text not null default '',          -- separadas por comas; ayudan al redactor a decidir dónde va
  placement       text not null default 'page' check (placement in ('page', 'figure')),
  always_include  boolean not null default false,
  pages           jsonb not null default '[]'::jsonb, -- [{path, w, h, type}] imágenes en brand-assets (tenders/<client>/…)
  source_filename text,
  active          boolean not null default true,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists tender_brand_sections_client_idx on public.tender_brand_sections (client_id, active);
alter table public.tender_brand_sections enable row level security;  -- sin políticas: solo service role

comment on table public.tender_brand_sections is
  'Páginas con diseño propio de la marca (certificaciones, flota…) que el Word de Licitaciones inserta donde el redactor las marca.';
