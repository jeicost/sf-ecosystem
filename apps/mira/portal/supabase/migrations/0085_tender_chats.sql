-- Licitaciones en modo conversación (Carlos, 5-oct): «que la licitación sea un
-- chatbot donde se le empieza a decir lo que queremos y nos va ayudando».
-- Visto en las conversaciones reales de Usoa con ChatGPT: trabaja sección a
-- sección, adjunta pliegos y memorias viejas, corrige y vuelve días después.
-- Cada conversación se guarda y se retoma; los ficheros adjuntos se guardan ya
-- convertidos a texto (el binario no se conserva).

create table if not exists public.tender_chats (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  tender_id   uuid references public.tenders(id) on delete set null,
  title       text not null default 'New conversation',
  messages    jsonb not null default '[]'::jsonb,   -- [{role, content, at, tools?}] tal como se enseñan
  attachments jsonb not null default '[]'::jsonb,   -- [{id, filename, mime, chars, text}] texto extraído
  created_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tender_chats_client_idx on public.tender_chats (client_id, updated_at desc);
alter table public.tender_chats enable row level security;  -- sin políticas: solo service role

comment on table public.tender_chats is
  'Conversaciones del asistente de licitaciones: mensajes, adjuntos (texto) y expediente asociado.';
