-- Fix: quick_actions_results_department_check nunca incluyó 'finanzas'.
-- Las 3 quick actions de Finanzas (proyeccion_financiera, analisis_cashflow,
-- optimizar_costos) llevan tiempo enviando department='finanzas' y fallan
-- siempre con un 500 (violates check constraint) — confirmado en vivo el
-- 2026-07-23. Ver docs/DEBT.md punto (q).

ALTER TABLE quick_actions_results
  DROP CONSTRAINT IF EXISTS quick_actions_results_department_check;

ALTER TABLE quick_actions_results
  ADD CONSTRAINT quick_actions_results_department_check
  CHECK (department IN ('comercial', 'marketing', 'strategy', 'community', 'admin', 'finanzas'));
