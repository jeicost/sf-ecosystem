# Generación visual en MIRA — estado REAL (reescrito 2026-07-29, P4 Fase 2)

> El documento anterior describía un sistema de jobs (`visual_jobs`, feature
> flags, mock provider) que NUNCA se conectó — ese código murió en P4. Esto es
> lo que existe y funciona hoy, y hacia dónde va.

## El pipeline actual (en producción)

1. **Entrada**: quick actions de Marketing `crear_post_visual`,
   `crear_carrusel_visual` (toggle `with_image`) y `editar_imagen_visual`
   (`lib/quick-actions/registry.ts` → `lib/quick-actions/generate.ts`);
   **P4**: también los agentes creativos (`designer`/Zoe y `spark`) desde su
   chat vía la tool `generate_image` (`app/api/agent/route.ts`), y las covers
   opcionales del Monthly (`/api/toolkit/monthly-to-queue` con
   `with_covers: true`, cap 8).
2. **Identidad de marca**: `brandBrain.visualIdentitySummary` entra como
   requisito MANDATORY en el prompt (hex + tipografía exactos).
3. **Motor**: `lib/generation/openai-image.ts` → OpenAI `gpt-image-1`
   (1024×1024), key del cliente (Integraciones → OpenAI) con fallback a la de
   plataforma.
4. **Storage**: bucket privado `generated-assets`
   (`clients/{clientId}/…`), **signed URLs de 7 días**, re-firma al leer vía
   `/api/assets`.
5. **Salida**: `quick_actions_results.output_data.image_url`,
   `approval_queue.asset_url` (covers) — `/approvals` y el resultado de la
   quick action las muestran.

## Hacia dónde va — Visual Production Foundation (W6)

El sistema GOBERNADO (validación → brand-module resolver → planner → creación
→ QA independiente → aprobación humana → post-proceso determinista) está
diseñado con el equipo del proyecto visual del CEO. Estado y contrato:

- Respuesta técnica + scaffolding: rama `feat/visual-production-foundation`
  (`docs/VISUAL_PRODUCTION_RESPONSE.md`, `lib/visual-production/*`, drafts SQL
  sin aplicar).
- ⚠️ Las tablas `visual_jobs/visual_assets/visual_feedback/visual_approvals`
  de la migración **0028 siguen en la BD** (vacías, sin código): las reclama el
  draft W6 — NO borrarlas hasta la decisión reuse-vs-namespace del equipo.
- El futuro **Estudio Visual** (UI dedicada) se construye ENCIMA de ese
  pipeline; su v1 puede montar sobre el motor actual.
