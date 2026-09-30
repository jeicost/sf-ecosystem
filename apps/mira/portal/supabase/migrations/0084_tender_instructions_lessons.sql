-- Usoa (30-sep): «tengo que tener la libertad de explicar a MIRA todo lo que me
-- pasa por la cabeza antes de liarse a hacer una memoria» y «no es tan sencillo
-- como subo un montón de memorias y que se guíe por ahí». Hasta ahora el
-- generador solo leía pliego + criterios + corpus + doctrina de precios: la
-- persona no tenía por dónde hablarle. Tres cosas:
--   · instrucciones por expediente (y una memoria pasada de la que partir),
--   · una guía de redacción de la empresa, suya, distinta de la doctrina de precios,
--   · lecciones: frases cortas que ella enseña y MIRA aplica siempre.

alter table public.tenders
  add column if not exists instructions text,
  add column if not exists base_tender_id uuid references public.tenders(id) on delete set null;

comment on column public.tenders.instructions is
  'Orientación libre de la persona para ESTE expediente: peculiaridades del cliente, qué subrayar, qué evitar. Entra en memoria, oferta y mejoras.';
comment on column public.tenders.base_tender_id is
  'Memoria pasada de la que partir (estructura y tono), elegida por la persona.';

alter table public.tender_settings
  add column if not exists guide text;

comment on column public.tender_settings.guide is
  'Cómo escribimos las memorias (guía de redacción de la empresa, editable). playbook = doctrina de precios.';

create table if not exists public.tender_lessons (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  text        text not null check (char_length(text) between 3 and 1000),
  source      text not null default 'manual' check (source in ('manual', 'improve', 'feedback')),
  tender_id   uuid references public.tenders(id) on delete set null,
  active      boolean not null default true,
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists tender_lessons_client_idx on public.tender_lessons (client_id, active, created_at desc);
alter table public.tender_lessons enable row level security;  -- sin políticas: solo service role, como el resto

comment on table public.tender_lessons is
  'Lecciones que la persona enseña a MIRA para las licitaciones de su marca: se inyectan en cada generación y mejora.';
