-- 0074: 'studio-visual' entra en generation_queue
--
-- El Estudio Visual guarda cada imagen como una fila completada de
-- generation_queue — así la ve la galería (/gallery lee las completadas con
-- image_path). Pero el CHECK de tool_slug (última vez tocado en la 0051) nunca
-- incluyó ese slug, así que el INSERT fallaba con 23514 y el catch {} de
-- lib/generation/image-studio.ts se lo tragaba en silencio.
--
-- Consecuencia real, medida el 11-sep-2026: 5 imágenes generadas y cobradas
-- (mira_usage_log route='studio:image', desde el 11-ago) y CERO filas
-- 'studio-visual'. Es decir: la galería del Estudio Visual ha estado vacía
-- desde que existe, para todos los clientes, sin un solo error a la vista.
--
-- Aplicar en: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql

ALTER TABLE generation_queue
  DROP CONSTRAINT IF EXISTS generation_queue_tool_slug_check;

ALTER TABLE generation_queue
  ADD CONSTRAINT generation_queue_tool_slug_check CHECK (tool_slug IN (
    'brand-briefing',
    'seo-audit',
    'content-pack',
    'marketing-audit',
    'action-plan',
    'investor-deck',
    'competitive-analysis',
    'brandbook-content-system',
    'marketing-campaign-generator',
    'community-growth-blueprint',
    'brand-book',
    'monthly-content-system',
    'doc-playbook',
    'doc-deck',
    'doc-results',
    'doc-onepager',
    'studio-visual'
  ));
