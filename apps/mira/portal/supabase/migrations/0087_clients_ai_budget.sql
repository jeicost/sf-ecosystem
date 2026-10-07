-- Tope mensual de IA por marca (Carlos, 7-oct-2026): «el tope debe ser de 30 $
-- al mes por usuario». El usuario que paga es la marca/espacio de trabajo, que
-- es la unidad de mira_usage_log. NULL = el general (MIRA_CLIENT_MONTHLY_BUDGET_USD,
-- 30 $); un número lo sustituye (GLS Ciudad Lineal 60: Email Ops lee ~50
-- correos al día); 0 = sin tope (acuerdo aparte). Lo aplica lib/ai/budget.ts
-- antes de cada llamada al modelo y lo enseña el dashboard.

alter table public.clients
  add column if not exists ai_budget_usd numeric check (ai_budget_usd >= 0);

comment on column public.clients.ai_budget_usd is
  'Tope mensual de gasto de IA con la clave de plataforma, en USD. NULL = el general (30 $). 0 = sin tope.';
