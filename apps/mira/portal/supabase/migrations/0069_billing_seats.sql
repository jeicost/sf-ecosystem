-- 0069 — Cimientos de facturación: la suscripción es de la MARCA, no del usuario.
--
-- Hasta ahora el plan vivía SOLO en auth.users.user_metadata.plan, es decir,
-- colgado del usuario. Eso rompe en cuanto una persona tiene acceso a dos
-- marcas (Discoolver y Discoolver 360 comparten a las mismas dos personas):
-- su plan sería el mismo para ambas, cuando cada marca paga su propia cuota.
-- Y no había forma de saber cuántas personas caben en una cuenta ni de agrupar
-- varias marcas bajo una sola suscripción.
--
-- Aditiva: solo columnas nuevas con valores por defecto. Nada existente cambia
-- de comportamiento hasta que el código las lea (ver lib/seats.ts).
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

-- ── Suscripción por marca ───────────────────────────────────────────────────
-- 'plan' se deja como texto libre a propósito: el catálogo de tiers vive en
-- lib/plans.ts y va a cambiar cuando se fijen los precios. Un CHECK aquí
-- obligaría a una migración por cada ajuste comercial.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'starter';

-- Asientos: cuántas personas pueden tener acceso a esta marca. El límite se
-- comprueba al conceder acceso (lib/seats.ts), no con una constraint, para
-- poder dar un mensaje útil en vez de un error de base de datos.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS max_seats integer NOT NULL DEFAULT 2;

-- Casa de Marcas: varias marcas bajo UNA suscripción. Null = marca suelta.
-- Es la pieza que permite que un emprendedor con cuatro proyectos no pague
-- cuatro veces el precio completo.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_group_id uuid;

-- ── Stripe ──────────────────────────────────────────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Estado real del cobro. 'trialing' y 'past_due' son los que permiten degradar
-- el servicio sin borrar nada; 'active' es el único que da acceso completo.
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_subscription_status_check;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'active';
ALTER TABLE clients ADD CONSTRAINT clients_subscription_status_check
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'paused'));

ALTER TABLE clients ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- ── Cómo se dio de alta esta marca ──────────────────────────────────────────
-- Distingue el alta ASISTIDA (el CEO entrena el Cerebro — es lo que justifica
-- la cuota de alta) de la AUTOSERVICIO (el cliente lo rellena guiado, sin horas
-- de nadie). Sin esta distinción no se puede vender un paquete barato: el
-- tiempo del CEO no escala a cincuenta marcas personales.
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_onboarding_mode_check;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_mode text NOT NULL DEFAULT 'assisted';
ALTER TABLE clients ADD CONSTRAINT clients_onboarding_mode_check
  CHECK (onboarding_mode IN ('assisted', 'self_serve'));

CREATE INDEX IF NOT EXISTS idx_clients_billing_group ON clients(billing_group_id) WHERE billing_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer ON clients(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN clients.plan IS 'Tier que paga ESTA marca. Catálogo en lib/plans.ts.';
COMMENT ON COLUMN clients.max_seats IS 'Personas con acceso permitidas. Se comprueba en lib/seats.ts al conceder acceso.';
COMMENT ON COLUMN clients.billing_group_id IS 'Casa de Marcas: varias marcas con una sola suscripción. Null = marca suelta.';
COMMENT ON COLUMN clients.onboarding_mode IS 'assisted = el CEO entrena el Cerebro (justifica la cuota de alta). self_serve = el cliente lo rellena guiado.';
