# Auditoría de Prompts MIRA — Julio 2026

**Alcance:** todos los prompts de generación de `apps/mira/portal`.
**Estado:** informe de solo lectura — **ningún prompt ha sido modificado**. La sección final propone un batch de cambios pendiente de aprobación.

## Inventario real

| Categoría | Fichero | Nº prompts |
|---|---|---|
| System prompts de agentes (ES+EN) | `lib/agent-prompts-i18n.ts` | 23 |
| Quick actions | `lib/generation/quick-action-prompts.ts` | **25** (el brief decía 27; en el fichero hay 25 `actionType`) |
| Toolkit | `lib/generation/toolkit-prompts.ts` | 10 |
| Documentos | `lib/generation/document-prompts.ts` | 4 |
| **Total** | | **62** |

**Criterios (score 1-5):** G = grounding en contexto real del cliente · AH = anti-alucinación · OC = contrato de output (JSON estricto/parseable) · CM = coherencia de marca (brand brain completo vs pobre) · I18N = paridad ES/EN · CT = contaminación (ejemplos de clientes concretos hardcodeados) · EF = eficiencia (longitud vs valor).

**Nota de arquitectura relevante para los scores:** los 23 agentes de chat NO inyectan contexto en el prompt del fichero, pero `app/api/agent/route.ts` (L112-125) añade en runtime `formatBrandBrainForPrompt` (versión completa: misión, tono, personalidad, frases prohibidas, pilares con pesos, tagline, identidad visual, audiencias) + memoria + documentos. En cambio, las 25 quick actions construyen su propio `brandContext` **de solo 3 campos** (Name, Mission, Tone — `quick-action-prompts.ts` L39-46), ignorando `formatBrandBrainForPrompt` (`lib/brand-brain.ts` L79-119).

---

## 1. Resumen ejecutivo — Los 10 peores prompts

| # | Prompt | Fichero:línea | Nota | Problema dominante |
|---|---|---|---|---|
| 1 | **seo-audit** | toolkit-prompts.ts:154 | **2.1** | Contaminación total de Salsa Burgers (Bangkok, burger, GRAB, Schema Restaurant, hreflang EN/TH) + score inducido "(60-80)" + audita una web que el modelo nunca ha visto |
| 2 | **crear_campaña** | quick-action-prompts.ts:112 | **2.6** | Sin `${fullContext}` ni brand context: campaña 100% genérica que ignora todo lo que MIRA sabe del cliente |
| 3 | **generar_icp** | quick-action-prompts.ts:121 | **2.6** | Sin `${fullContext}`: el ICP se inventa desde cero sin docs, memoria ni marca |
| 4 | **marketing-audit** | toolkit-prompts.ts:419 | **2.7** | Estructura "EXACT STRUCTURE" con cards de restaurante tailandés (GRAB + LINE MAN, ORDER NOW) impuesta a cualquier cliente + score inducido "(50-80)" |
| 5 | **auditar_innovacion** | quick-action-prompts.ts:403 | **2.9** | `innovation_score: 0` sin escala definida + pide benchmarks de competidores con nombre → inventados |
| 6 | **editar_imagen_visual** | quick-action-prompts.ts:489 | **2.9** | Pide "original_image_analysis: What the current image shows" a un modelo que **no ve la imagen** |
| 7 | **investor-deck** | toolkit-prompts.ts:623 | **3.1** | Exige CAC, LTV, MRR/ARR, burn, valoración y TAM sin guard "si no hay datos" → números de fundraising fabricados |
| 8 | **proyectar_revenue** | quick-action-prompts.ts:311 | **3.1** | Forecast mensual de revenue sin ninguna restricción de usar solo datos aportados |
| 9 | **brainstorm_ideas** | quick-action-prompts.ts:293 | **3.1** | Campo `voting_results` de una votación que nunca ocurrió; shape `{}` indefinido |
| 10 | **analisis_cashflow** | quick-action-prompts.ts:348 | **3.1** | `runway_months` y cash gaps inventables; enums mezclan ES/EN (`"alta\|media\|baja"` en prompt inglés) |

**Prompts con nota media < 3: 6** (seo-audit 2.1, crear_campaña 2.6, generar_icp 2.6, marketing-audit 2.7, auditar_innovacion 2.9, editar_imagen_visual 2.9).

Patrones sistémicos:
1. **Brand brain empobrecido en quick actions** — las 25 usan 3 campos vs los 9 de toolkit / función canónica completa. Sin pilares, sin audiencias, sin frases prohibidas → el copy puede violar la marca sin saberlo.
2. **Cero anti-alucinación numérica** — salvo `doc-results` (que instruye "deja los valores como '—'" si faltan datos), ningún prompt prohíbe inventar métricas, nombres o fechas.
3. **Contaminación Salsa Burgers** en los dos toolkits de auditoría (seo-audit, marketing-audit). No se detectó Bangkok/burger/restaurant en agentes, quick actions ni documentos (verificado por grep en los 4 ficheros).
4. **Idioma de output indefinido** — quick actions y toolkits están redactados en inglés sin fijar idioma de salida; los documentos fuerzan "Todo en ESPAÑOL" sin variante EN. Solo los agentes de chat tienen i18n real.
5. **Hints de score** ("typical range 60-80 for food brands", "+8 points in 90 days") que anclan el resultado de las auditorías antes de analizar nada.

---

## 2. Tabla completa

### 2.1 Agentes (`lib/agent-prompts-i18n.ts`, ES L4-163 / EN L167-326)

Scores comunes justificados: G=3 (contexto inyectado por la ruta, pero el prompt nunca instruye cómo usarlo), OC=3 (chat libre, sin JSON — aceptable para su uso), CM=4 (brand brain completo vía runtime), CT=5, EF=5 (concisos y densos).

| Prompt | Línea ES/EN | G | AH | OC | CM | I18N | CT | EF | Media |
|---|---|---|---|---|---|---|---|---|---|
| orchestrator (Marco) | 4/167 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| strategos | 11/174 | 3 | 4 | 3 | 4 | 5 | 5 | 5 | 4.1 |
| atlas | 18/181 | 3 | 4 | 3 | 4 | 5 | 5 | 5 | 4.1 |
| content-strategist (Luna) | 25/188 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| copywriter (Alex) | 32/195 | 3 | 3 | 3 | 4 | 4 | 5 | 5 | 3.9 |
| designer (Zoe) | 39/202 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| video-editor (Kai) | 46/209 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| social-media-manager (Noa) | 53/216 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| community-manager (Sam) | 60/223 | 3 | 3 | 3 | 4 | 4 | 5 | 5 | 3.9 |
| ads-manager (Riva) | 67/230 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| lead-scout (Rex) | 74/237 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| icp-scorer (Vera) | 81/244 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| icebreaker-writer (Finn) | 88/251 | 3 | 2 | 3 | 4 | 5 | 5 | 5 | 3.9 |
| reply-qualifier (Quinn) | 95/258 | 3 | 4 | 3 | 4 | 5 | 5 | 5 | 4.1 |
| proposal-writer (Nova) | 102/265 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| blueprint | 109/272 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| pulse | 116/279 | 3 | 4 | 3 | 4 | 5 | 5 | 5 | 4.1 |
| spark | 123/286 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| quant | 130/293 | 3 | 4 | 3 | 4 | 3 | 5 | 5 | 3.9 |
| fiscal | 137/300 | 3 | 4 | 3 | 4 | 5 | 5 | 5 | 4.1 |
| midas | 144/307 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| onboard | 151/314 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |
| harbor | 158/321 | 3 | 3 | 3 | 4 | 5 | 5 | 5 | 4.0 |

### 2.2 Quick actions (`lib/generation/quick-action-prompts.ts`)

Scores comunes justificados: G=4 (docs + memoria + brand vía `fullContext`, salvo excepciones), CM=2 (**brand context de solo 3 campos**, L39-46), I18N=3 (prompt EN, idioma de output sin fijar), CT=5, EF=4.

| Prompt | Línea | G | AH | OC | CM | I18N | CT | EF | Media |
|---|---|---|---|---|---|---|---|---|---|
| responder_ticket | 60 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_faq | 76 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_tutorial | 93 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| **crear_campaña** | 112 | **1** | 2 | 4 | **1** | 2 | 5 | 3 | **2.6** |
| **generar_icp** | 121 | **1** | 2 | 4 | **1** | 2 | 5 | 3 | **2.6** |
| crear_propuesta | 130 | 4 | 2 | 4 | 2 | 3 | 5 | 4 | 3.4 |
| calificar_reply | 148 | 4 | 2 | 4 | 2 | 3 | 5 | 4 | 3.4 |
| crear_post | 166 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_newsletter | 183 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_video_brief | 201 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_carousel | 219 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_campaña_ads | 237 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 3.3 |
| generar_reporte | 258 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 3.3 |
| analizar_competencia | 276 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 3.3 |
| brainstorm_ideas | 293 | 4 | 2 | **2** | 2 | 3 | 5 | 4 | 3.1 |
| proyectar_revenue | 311 | 4 | **1** | 3 | 2 | 3 | 5 | 4 | 3.1 |
| proyeccion_financiera | 329 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 3.3 |
| analisis_cashflow | 348 | 4 | 2 | 3 | 2 | **2** | 5 | 4 | 3.1 |
| optimizar_costos | 367 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 3.3 |
| analizar_tendencias | 386 | 4 | 3 | 3 | 2 | 2 | 5 | 4 | 3.3 |
| **auditar_innovacion** | 403 | 4 | **1** | **2** | 2 | 2 | 5 | 4 | **2.9** |
| roadmap_innovacion | 422 | 4 | 2 | 3 | 2 | 3 | 5 | 4 | 3.3 |
| crear_post_visual | 445 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| crear_carrusel_visual | 464 | 4 | 3 | 3 | 2 | 3 | 5 | 4 | 3.4 |
| **editar_imagen_visual** | 489 | **2** | **1** | 3 | 2 | 3 | 5 | 4 | **2.9** |

### 2.3 Toolkit (`lib/generation/toolkit-prompts.ts`)

Contexto: brand context expandido de 9 campos (L89-101) → CM=4-5. Dependencias entre toolkits vía `project_memory` (truncadas a 500 chars, L111 — limita el grounding real).

| Prompt | Línea | G | AH | OC | CM | I18N | CT | EF | Media |
|---|---|---|---|---|---|---|---|---|---|
| brand-briefing | 123 | 4 | 2 | 4 | 4 | 3 | 5 | 4 | 3.7 |
| **seo-audit** | 154 | **2** | **1** | 3 | 4 | **2** | **1** | **2** | **2.1** |
| **marketing-audit** | 419 | 4 | **2** | 3 | 4 | **2** | **2** | **2** | **2.7** |
| content-pack | 547 | 4 | 3 | 3 | 4 | 3 | 5 | 3 | 3.6 |
| action-plan | 586 | 4 | 3 | 3 | 4 | 3 | 5 | 3 | 3.6 |
| **investor-deck** | 623 | 3 | **1** | 3 | 4 | 3 | 5 | 3 | **3.1** |
| competitive-analysis | 665 | 3 | 2 | 4 | 4 | 3 | 5 | 4 | 3.6 |
| brandbook-content-system | 717 | 4 | 4 | 4 | 5 | 3 | 5 | 3 | 4.0 |
| marketing-campaign-generator | 761 | 4 | 2 | 4 | 4 | 3 | 4 | 4 | 3.6 |
| community-growth-blueprint | 793 | 4 | 2 | 4 | 4 | 3 | 4 | 4 | 3.6 |

### 2.4 Documentos (`lib/generation/document-prompts.ts`)

Contexto: brand context de 5 campos (L41-50: nombre, misión, pilares, tono, audiencias — faltan personalidad, frases prohibidas, tagline, identidad visual) → CM=3. Output forzado a ESPAÑOL sin variante EN → I18N=3.

| Prompt | Línea | G | AH | OC | CM | I18N | CT | EF | Media |
|---|---|---|---|---|---|---|---|---|---|
| doc-playbook | 59 | 4 | 3 | 4 | 3 | 3 | 5 | 4 | 3.7 |
| doc-deck | 80 | 4 | 2 | 4 | 3 | 3 | 5 | 4 | 3.6 |
| doc-results | 116 | 4 | **5** | 4 | 3 | 3 | 5 | 5 | **4.1** |
| doc-onepager | 135 | 4 | 3 | 4 | 3 | 3 | 5 | 5 | 3.9 |

---

## 3. Hallazgos detallados (todo score ≤ 2, con evidencia)

### H1 — seo-audit: contaminación masiva de Salsa Burgers (CT=1) — `toolkit-prompts.ts:154-417`

El toolkit genérico de SEO tiene hardcodeado el caso concreto del cliente Salsa Burgers (restaurante de burgers en Bangkok, `clients/salsa-burgers/`):

Keywords de ejemplo (L332-367) que el modelo tiende a reproducir literalmente:
> `"keyword": "burger delivery bangkok"` · `"keyword": "wagyu burger bangkok"` · `"keyword": "best burger bangkok"` · `"keyword": "grab food burger bangkok"` · `"keyword": "artisan burger sauce bangkok"` · `"keyword": "salsa burgers"`

Estructura obligatoria específica de restaurante tailandés:
> L170: `Schema Markup (6 schemas: Restaurant, AggregateRating, OpeningHours, ...)` — impone Schema **Restaurant** a cualquier vertical.
> L169/L239: `Hreflang EN/TH` — asume sitio inglés/tailandés para todos los clientes.
> L379: `"4 posts published with relevant topics: delivery, Grab, sauces, Wagyu"`

**Riesgo:** una auditoría SEO generada para cualquier otro cliente puede salir con keywords de burgers en Bangkok, schema de restaurante y hreflang tailandés. Es el hallazgo más grave del inventario.

### H2 — seo-audit: métricas y fechas fabricadas por plantilla (AH=1) — `toolkit-prompts.ts:165, 181-190, 384-386`

> L165: `Score: 0-100 scale (typical range 60-80 for food brands) with trend (+X points in 90 days)`
> L181: `"overall_score": number (60-80)`
> L187: `{"label": "Style Chars (Ideal <60)", "value": "69", ...}` · `{"label": "Imágenes con Alt Text", "value": "20/20", ...}`
> L384-386: `"last_post": "Marzo 2025", "days_ago": 65`

El prompt ancla el score en 60-80 antes de analizar nada, dicta un trend positivo ("+X points in 90 days" — ¿respecto a qué medición anterior?) y da valores concretos (69 chars, 20/20 imágenes, último post "Marzo 2025") que el modelo copia. Además **el modelo no tiene acceso a la web auditada** (G=2): no hay crawl ni fetch — todo el "estado actual" de title tags, sitemap, page speed y Core Web Vitals es inventado.

### H3 — seo-audit y marketing-audit: Spanglish estructural (I18N=2) e hipertrofia (EF=2)

> seo-audit L169: `SEO Técnico (10+ checks: HTTPS/SSL, ...)` mezclado con secciones "On-Page SEO" en inglés; L408: `"priority": "CRÍTICO|ALTO|MEDIO"` en un prompt redactado en inglés.
> marketing-audit L459-533: títulos de cards en español (`"USP Muy Claro"`, `"Sin Captación de Email"`) dentro de instrucciones inglesas.

seo-audit ocupa ~264 líneas (L154-417) de las cuales ~200 son pseudo-JSON con prosa incrustada: caro en tokens, frágil de parsear y el origen de la contaminación. marketing-audit ~127 líneas con el mismo patrón.

### H4 — marketing-audit: contaminación Salsa Burgers (CT=2) y score inducido (AH=2) — `toolkit-prompts.ts:419-545`

> L434: `Conversion Funnel (4 cards: ORDER NOW visibility, GRAB/LINE MAN integration, WhatsApp Business, Email Capture gaps)`
> L495-498: `{"title": "ORDER NOW Siempre Visible", ...}` · `{"title": "GRAB + LINE MAN Integrados", "status": "strong", ...}`
> L430: `Overall score: 0-100 (typical range 50-80) with trend (+X points in 90 days)` · L446: `"overall_score": number (50-80)`

GRAB y LINE MAN son plataformas de delivery de Tailandia. El prompt exige "EXACT STRUCTURE", así que un SaaS B2B recibiría una auditoría evaluando su integración con delivery tailandés. El status `"strong"` pre-rellenado ancla además el resultado.

### H5 — crear_campaña sin contexto de cliente (G=1, CM=1) — `quick-action-prompts.ts:112-118`

> ```
> return `Task: Create a marketing campaign strategy based on provided input.
>
> Input: ${JSON.stringify(inputData, null, 2)}
>
> Output ONLY valid JSON ...`
> ```

Es el único par de prompts (junto a generar_icp) que **no interpola `${fullContext}`**: ni documentos del cliente, ni brand brain, ni memoria. La campaña se genera solo con lo que el usuario teclea en el formulario. Confirmado: hallazgo conocido, verificado en L112-118.

### H6 — generar_icp sin contexto de cliente (G=1, CM=1) — `quick-action-prompts.ts:121-127`

Mismo patrón que H5, verificado en L121-127: el Ideal Customer Profile — el artefacto que más depende de conocer el negocio real — se genera sin brand brain, sin docs y sin memoria. Además pide `"revenue": "Revenue range"` y `"budget": "Budget"` sin datos → inventados (AH=2).

### H7 — brandContext de quick actions: 3 campos vs brand brain completo (CM=2 en las 25) — `quick-action-prompts.ts:39-46`

> ```
> BRAND CONTEXT:
> - Name: ${brandBrain.brandName}
> - Mission: ${brandBrain.mission}
> - Tone: ${formatTone(brandBrain.toneOfVoice)}
> ```

Verificado contra `formatBrandBrainForPrompt` (`lib/brand-brain.ts:79-119`), que incluye además personalidad, **frases prohibidas**, pilares con pesos, tagline, identidad visual y audiencias, y contra el brand context de toolkit (9 campos, `toolkit-prompts.ts:89-101`). Consecuencia práctica: un `crear_post` puede usar frases explícitamente prohibidas por el cliente porque nunca las ve.

### H8 — investor-deck: unit economics sin datos (AH=1) — `toolkit-prompts.ts:652-661`

> `"unit_economics": {"cac": "", "ltv": "", "payback_period": "", "gross_margin": ""}` · `"traction_and_validation": {"customers_count": "", "revenue_mrr_arr": "", ...}` · `"financials": {"funding_history": "", "monthly_burn": "", "24mo_revenue_projection": ""}` · `"the_ask": {"amount": "", "valuation": "", "post_money": ...}`

El prompt dice "Cite all claims back to source" (L631) pero la dependencia `traction_data` es opcional y se trunca a 500 chars (L111); no hay ninguna instrucción de qué hacer si faltan datos. El modelo rellenará CAC, LTV, MRR, burn y valoración con números plausibles. **Un deck con métricas inventadas puede acabar delante de un inversor real** — riesgo reputacional/legal máximo de todo el inventario.

### H9 — proyectar_revenue: forecast sin restricciones (AH=1) — `quick-action-prompts.ts:311-326`

> `"monthly_forecast": [{"month": "", "revenue": "", "growth": ""}]`

Ninguna instrucción tipo "usa solo cifras del input; si faltan, decláralo en assumptions". Contrasta con `doc-results` (L117), que sí lo resuelve: *"si faltan datos, deja los valores como '—' y céntrate en la estructura narrativa"* — ese guard debería ser el estándar.

### H10 — auditar_innovacion: score sin escala y benchmarks inventados (AH=1, OC=2) — `quick-action-prompts.ts:412-418`

> `"innovation_score": 0,` — sin rango definido (¿0-10? ¿0-100?); cada ejecución puede usar una escala distinta, rompiendo la comparabilidad entre auditorías.
> `"benchmarks": [{"competitor_or_leader": "", "what_they_do": "", "lesson": ""}]` — pide nombres de competidores y prácticas concretas sin ninguna fuente → fabricados con apariencia factual.

`roadmap_innovacion` (L431) hereda el mismo `"innovation_score": 0` sin escala.

### H11 — brainstorm_ideas: resultados de votación ficticios (OC=2) — `quick-action-prompts.ts:306`

> `"voting_results": {},`

Pide resultados de una votación que nunca ocurrió, con shape `{}` indefinido (no parseable de forma consistente). El modelo inventa votos de un equipo inexistente.

### H12 — editar_imagen_visual: analiza una imagen que no ve (G=2, AH=1) — `quick-action-prompts.ts:496-507`

> `"original_image_analysis": "What the current image shows",`

La ruta (`app/api/quick-actions/route.ts:86-95`) envía solo texto — el modelo no recibe la imagen original. El "análisis de la imagen actual" y los `specific_changes.current_state` son alucinación pura, y el `refinement_prompt` resultante puede contradecir la imagen real.

### H13 — calificar_reply: anchor de score en el ejemplo (AH=2) — `quick-action-prompts.ts:157`

> `"qualification_score": 7,`

El único valor pre-rellenado del schema es el score → sesgo de anclaje hacia 7. Mismo patrón que los hints "(60-80)" de las auditorías. Además la escala no está definida (¿1-10?).

### H14 — marketing-campaign-generator y community-growth-blueprint: KPIs hardcodeados (AH=2, CT=4) — `toolkit-prompts.ts:777-789, 834-840`

> `"LinkedIn": {"percentage": 35, ...}, "Email": {"percentage": 25, ...}` — mix de canales B2B fijo para cualquier marca (¿una heladería local con 35% LinkedIn?).
> `"kpis": {"reach_target": 50000, ..., "cac_target": 60}` · `"engagement_rate": 0.50, "retention_rate": 0.80, "referral_rate": 0.30`

Valores de ejemplo con números concretos que el modelo replica como si fueran targets calculados (un engagement rate del 50% es, además, irreal).

### H15 — Defectos i18n puntuales en agentes

- **quant ES** (`agent-prompts-i18n.ts:130`): *"ejecuta análisis y der**ива** insights"* — caracteres cirílicos incrustados en "deriva". Llega tal cual al system prompt de producción.
- **copywriter** (L37 vs L200): EN dice *"Align with brand voice **(provided in context)**"*; ES omite la referencia al contexto — el agente ES no sabe que el brand brain viene inyectado debajo.
- **community-manager** (L60 vs L223): ES "Community Manager" / EN "Community **Builder**" — divergencia menor de identidad.
- **icebreaker-writer** (L93/256, AH=2): *"Siempre cita research"* sin research provisto ni herramienta de búsqueda → invita a citar "research" inventado en outreach real a prospectos.

### H16 — Contrato de output débil en la mayoría de quick actions (OC=3 generalizado)

14 de 25 dicen solo `Generate ... JSON:` sin "ONLY valid JSON / no markdown" (p. ej. responder_ticket L67, crear_post L173, generar_reporte L265). La ruta lo compensa con 3 estrategias de extracción por regex (`route.ts:108-119`), lo que confirma que el contrato es poco fiable. Ningún prompt define tipos (los schemas son strings vacíos `""`), escalas ni enums cerrados consistentes.

---

## 4. Batch de cambios propuestos (pendiente de aprobación — nada aplicado)

### Quick wins (< 1h total, riesgo bajo)

| # | Cambio | Fichero | Riesgo |
|---|---|---|---|
| Q1 | Añadir `${fullContext}` a **crear_campaña** y **generar_icp** (mismo patrón que crear_propuesta) | quick-action-prompts.ts:112,121 | **Bajo** — patrón ya probado en las otras 23 acciones; el output puede alargarse ligeramente |
| Q2 | Corregir cirílico "derива" → "deriva" en quant ES | agent-prompts-i18n.ts:130 | **Nulo** |
| Q3 | Añadir "(provided in context)" al copywriter ES y unificar Sam "Community Manager/Builder" | agent-prompts-i18n.ts:37,60 | **Nulo** |
| Q4 | Eliminar anchors numéricos: `"qualification_score": 7` → definir escala "1-10" sin valor; quitar "(60-80)" y "(50-80)" y "+8 points" de seo-audit/marketing-audit | quick-action-prompts.ts:157; toolkit-prompts.ts:165,181,430,446 | **Bajo** — los scores dejarán de agruparse artificialmente en 60-80; posible mayor varianza entre ejecuciones (deseable) |
| Q5 | Definir escala explícita para `innovation_score` (0-100) en auditar_innovacion y roadmap_innovacion; eliminar `voting_results` de brainstorm_ideas | quick-action-prompts.ts:412,431,306 | **Bajo** — comprobar que la UI no renderiza `voting_results` antes de quitarlo |

### Cambios medios (1-4h, riesgo medio)

| # | Cambio | Fichero | Riesgo |
|---|---|---|---|
| M1 | Sustituir el brandContext de 3 campos de quick actions por `formatBrandBrainForPrompt` (reutilizar la función canónica de `lib/brand-brain.ts`) | quick-action-prompts.ts:39-46 | **Medio** — +~300-500 tokens por llamada en 25 acciones; outputs cambiarán de tono (a mejor); revisar coste |
| M2 | Guard anti-alucinación estándar en los 12 prompts numéricos (proyectar_revenue, proyeccion_financiera, analisis_cashflow, optimizar_costos, investor-deck, doc-deck, doc-onepager, etc.): "Usa SOLO cifras presentes en el input o el contexto. Si un dato no existe, escribe '—' / decláralo en assumptions. NUNCA inventes métricas, nombres de competidores ni fechas." (copiar el patrón de doc-results L117) | quick-action-prompts.ts, toolkit-prompts.ts, document-prompts.ts | **Medio** — outputs más honestos pero con más huecos "—"; puede percibirse como "menos completo" por el cliente. Recomendado A/B con 2-3 clientes |
| M3 | Fijar idioma de output en quick actions y toolkits (`Respond in the same language as the user input / locale del cliente`) y unificar enums a un solo idioma | ambos ficheros | **Medio** — clientes que hoy reciben output EN por accidente pasarán a ES; verificar parsers de UI que esperen enums concretos (`"alta\|media\|baja"`) |
| M4 | editar_imagen_visual: eliminar `original_image_analysis` o exigir que la descripción de la imagen venga en el input (y decirlo: "You cannot see the image; rely only on the provided description") | quick-action-prompts.ts:489-507 | **Bajo-medio** — revisar que el Visual Production Agent no consuma ese campo |
| M5 | marketing-campaign-generator / community-growth-blueprint: sustituir números hardcodeados (35/25/20/20, 50000, cac 60, 0.50/0.80/0.30) por placeholders con instrucción de derivarlos del contexto | toolkit-prompts.ts:777-789,834-840 | **Bajo** — outputs menos uniformes entre clientes (deseable) |

### Cambios grandes (> 4h, riesgo alto — requieren decisión de producto)

| # | Cambio | Fichero | Riesgo |
|---|---|---|---|
| G1 | **Reescritura de seo-audit**: extraer toda la plantilla Salsa Burgers (keywords Bangkok, Schema Restaurant, Hreflang EN/TH, fechas "Marzo 2025") y sustituirla por estructura genérica parametrizada por industria/idiomas del brand brain; decidir si la auditoría debe recibir datos reales del sitio (crawl/fetch previo) o declararse explícitamente como "checklist a verificar" en vez de "estado actual" | toolkit-prompts.ts:154-417 | **Alto** — el renderer de la UI (stat cards, secciones tipadas) depende del shape actual; hay que mapear el consumidor antes. Los informes existentes de Salsa Burgers seguirán siendo válidos; los de otros clientes cambiarán radicalmente (hoy están contaminados, así que es el objetivo) |
| G2 | **Reescritura de marketing-audit**: quitar cards fijas GRAB/LINE MAN/ORDER NOW y generar las 4 cards por sección dinámicamente según el funnel real del cliente | toolkit-prompts.ts:419-545 | **Alto** — mismo acoplamiento con la UI de cards/colores; coordinar con G1 |
| G3 | **investor-deck en dos fases**: fase 1 valida qué datos reales existen (traction_data, financials) y lista los que faltan; fase 2 genera el deck marcando cada métrica como `sourced` o `placeholder — completar por el fundador`. Aumentar el límite de 500 chars de las dependencias (L111) al menos para este toolkit | toolkit-prompts.ts:623-663,111 | **Alto** — cambia el shape del output y el flujo de UX (el usuario debe revisar placeholders); es el cambio con más impacto en confianza del producto |
| G4 | i18n real para quick actions, toolkits y documentos (variante EN de los 39 prompts, siguiendo el patrón de agent-prompts-i18n) | 3 ficheros | **Alto** — 39 prompts × 2 idiomas de mantenimiento; solo si hay clientes EN activos. Alternativa barata: M3 |
| G5 | Migrar el contrato de output a **tool use / JSON schema forzado** (Anthropic structured outputs) en las rutas de generación, eliminando la extracción por regex de `route.ts` | rutas api + 3 ficheros de prompts | **Alto** — cambio de infraestructura; elimina de raíz los fallos de parseo y los schemas de strings vacíos |

**Orden recomendado:** Q1-Q5 inmediato → M1+M2 (mismo PR, son el 80% del valor) → G1+G2 (desbloquean vender auditorías a clientes no-restaurante) → G3 antes de que ningún cliente use investor-deck con inversores reales.
