# Quick Actions — Current State (MIRA Production)

> Actualizado 2026-07-21 leyendo el código. Sustituye la versión anterior (18 acciones / 6 departamentos), que estaba obsoleta.

## Overview

Quick Actions es el sistema síncrono de generación de contenido de MIRA: **5 componentes por departamento** en `components/quick-actions/` y **23 botones** en total. Cada botón dispara una única llamada a Claude (`claude-opus-4-8`) vía `POST /api/quick-actions`; el resultado se persiste en `quick_actions_results` y la UI hace polling con `GET /api/quick-actions?action_id=...`.

## Componentes y botones (23)

Cada departamento tiene su componente, montado en su página del dashboard:

| Componente | Página | Botones |
|---|---|---|
| `MarketingQuickActions.tsx` | `app/(dashboard)/roster/page.tsx` | 8 |
| `StrategyQuickActions.tsx` | `app/(dashboard)/strategy/page.tsx` | 5 |
| `ComercialQuickActions.tsx` | `app/(dashboard)/comercial/page.tsx` | 4 |
| `FinanzasQuickActions.tsx` | `app/(dashboard)/finanzas/page.tsx` | 3 |
| `AdminQuickActions.tsx` | `app/(dashboard)/operations/page.tsx` | 3 |

### Marketing (8)
- `crear_post`
- `crear_newsletter`
- `crear_video_brief`
- `crear_carousel`
- `crear_campaña_ads`
- `crear_post_visual` *(visual)*
- `crear_carrusel_visual` *(visual)*
- `editar_imagen_visual` *(visual)*

### Strategy (5)
- `generar_reporte`
- `analizar_competencia`
- `brainstorm_ideas`
- `tendencias_analisis`
- `plan_innovacion`

### Comercial (4)
- `crear_campaña`
- `generar_icp`
- `crear_propuesta`
- `calificar_reply`

### Finanzas (3)
- `proyeccion_financiera`
- `analisis_cash_flow`
- `optimizacion_costos`

### Admin / Operations (3)
- `responder_ticket`
- `crear_faq`
- `crear_tutorial`

Los títulos vienen de i18n (`t('actions.<dept>.<id>', locale)`). Los 5 componentes comparten `components/QuickActionButton.tsx` (formulario + submit) y `components/QuickActionResult.tsx` (polling + render).

> Nota: existen prompts sin botón (`proyectar_revenue`, `auditar_innovacion` en `lib/generation/quick-action-prompts.ts:311,403`) y un componente muerto `components/DepartmentQuickActions.tsx`. Ver `docs/DEBT.md` (raíz del monorepo), sección (g).

## Flujo de request (síncrono)

```
QuickActionButton.tsx (click + formulario)
  ↓
POST /api/quick-actions { action_type, input_data, department, clientId?, project_id? }
  ↓
app/api/quick-actions/route.ts
  ├─ resolveRequestClient(body.clientId) — multi-empresa: valida grant; sin clientId, primer grant
  │    (bypass dev solo con NEXT_PUBLIC_DEV_MODE_BYPASS=true y status 401)
  ├─ INSERT quick_actions_results { status:'processing', output_data:{} }
  ├─ getQuickActionPrompt(action_type, { clientId, inputData })
  ├─ createMessageForClient(clientId, 'quick-actions', { model:'claude-opus-4-8', max_tokens:4000 })
  ├─ Extracción de JSON (code block ```json → fallback brace-matching)
  ├─ [acciones visuales] generateAndStoreImage(prompt, clientId, actionId) → gpt-image-1
  ├─ UPDATE quick_actions_results { status:'success', output_data, processing_time_ms }
  └─ Fire-and-forget INSERT en project_memory
  ↓
Respuesta síncrona { success, action_id, output_data, processing_time_ms }
  +
GET /api/quick-actions?action_id={id}  (polling desde QuickActionResult.tsx)
```

El POST es **bloqueante**: hace todo el trabajo (Claude + imagen) dentro de la request y devuelve el resultado; el GET de polling sirve para re-hidratar estado y como fallback de UI.

## Tabla `quick_actions_results`

Campos usados por la ruta (`app/api/quick-actions/route.ts`):

- `id` (uuid, PK) · `client_id` · `user_id` · `department` · `action_type`
- `status`: `'processing' | 'success' | 'failed'`
- `input_data` (jsonb) · `output_data` (jsonb) — **no** `result_data`
- `error_message` · `processing_time_ms`

Estados de fallo escritos por la ruta: `Unknown action type`, `Output truncated at max_tokens`, `Empty result after JSON parse`.

El GET valida ownership: `getSessionUser()` + `userCanAccessClient(user, data.client_id)` antes de devolver la fila.

## Acciones visuales (Marketing)

`VISUAL_ACTIONS = ['crear_post_visual', 'crear_carrusel_visual', 'editar_imagen_visual']` (`route.ts:8`).

1. Claude devuelve el spec JSON (copy + `image_generation_prompt` / `refinement_prompt` / `slides[0].image_generation_prompt` / `visual_direction`).
2. `lib/generation/openai-image.ts` genera la imagen con **`gpt-image-1`** y la guarda en el bucket `generated-assets` bajo `clients/{clientId}/...`.
3. `output_data` recibe `image_url` (signed URL efímera) e **`image_path`** (estable). El frontend guarda `image_path` y lo sirve vía **`GET /api/assets?path=...`**, que valida que el path pertenece al cliente y redirige 302 a una signed URL fresca.
4. Si la imagen falla, la acción sigue siendo `success` con `image_error: true` (el copy/spec es válido).

## Auto-log a `project_memory`

Tras cada éxito, insert fire-and-forget (no bloquea la respuesta):

- `client_id`, `project_id` (**del proyecto activo**: el botón envía `getStoredProjectId()`, `QuickActionButton.tsx:51`; `null` si no hay)
- `title: "Quick Action: {action_type}"`, `category: 'action'`
- `summary` (output serializado, 200 chars), `full_content` (output completo)
- `tags: [action_type, department]`, `source_department`

## Modelo y coste

- Texto: `claude-opus-4-8` (pricing en `lib/anthropic-client.ts` `MODEL_PRICING`), `max_tokens: 4000`.
- Imagen: `gpt-image-1` vía OpenAI (`lib/generation/openai-image.ts`).
- Ojo: el pricing de `gpt-image-1` está duplicado e inconsistente entre `lib/anthropic-client.ts` y `app/api/usage/summary/route.ts` — ver `docs/DEBT.md` sección (h).
