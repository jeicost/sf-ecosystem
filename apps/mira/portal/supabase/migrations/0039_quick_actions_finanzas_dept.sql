-- Fix: quick_actions_results_department_check en producción solo permite
-- ('comercial', 'marketing', 'strategy', 'community') — ni 'finanzas' ni
-- 'admin' están en la lista real, pese a que el comentario de la migración
-- 0015 dice "16 quick actions across 4 departments" incluyendo admin.
-- Las 3 quick actions de Finanzas (proyeccion_financiera, analisis_cashflow,
-- optimizar_costos) Y las 3 de Admin (responder_ticket, crear_faq,
-- crear_tutorial) llevan tiempo fallando siempre con un 500 (violates check
-- constraint) — ambas confirmadas en vivo el 2026-07-23. Ver docs/DEBT.md
-- punto (q). 'community' se deja en la lista por si queda algún dato
-- histórico con ese valor; el código actual ya no lo usa (el departamento
-- se renombró a 'admin').

ALTER TABLE quick_actions_results
  DROP CONSTRAINT IF EXISTS quick_actions_results_department_check;

ALTER TABLE quick_actions_results
  ADD CONSTRAINT quick_actions_results_department_check
  CHECK (department IN ('comercial', 'marketing', 'strategy', 'community', 'admin', 'finanzas'));
