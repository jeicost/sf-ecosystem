# Landing Build Playbook

El método completo para construir una landing "de las buenas" — el mismo nivel que Salsa Burgers, Discoolver, Startup Factory, NC Global Assets y Adrian Grooves — de forma repetible, sin depender de que una persona concreta se acuerde de todo.

**Audiencia:** cualquier sesión de Claude Code (la mía o la de otra persona) que reciba un brief de `projects.brief_status = 'ready'` en sf-cms y tenga que construir la landing de verdad. **No es** algo que sf-cms ejecute solo — sf-cms guarda el brief (ver `lib/site-brief-chat-system-prompt.ts`), este playbook es lo que sigue el desarrollador/agente que lo construye.

Complementa `docs/EDITING_LANDINGS_SAFELY.md` (ese es el protocolo de *no romper* lo que ya existe; este es el de *construir* algo nuevo con el nivel correcto).

---

## Fase 0 — Leer el brief

1. `GET /api/admin/projects/[projectId]` en sf-cms (o directo en Supabase) → `brief_json`. Si `brief_status !== 'ready'`, el brief está incompleto — vuelve al chatbot antes de construir nada, no lo completes tú a ojo.
2. Si el brief marca campos como `"TBD"` (el chatbot no debe inventar), decide si son bloqueantes (ej. sin logo ni paleta = hay que proponer una) o se pueden resolver sobre la marcha con una decisión de diseño documentada al final.
3. Si es un **rediseño** de un sitio que ya vive en producción: antes de nada, comprueba si el código fuente existe localmente y si el proyecto Vercel está conectado a Git.
   - **Si el deploy es solo por Vercel CLI sin Git conectado** (`vercel project inspect <nombre>` sin sección "Connected Git Repository"): el código fuente puede estar **irrecuperable** si Vercel ya purgó los blobs (pasó con `discoolver-landing` esta sesión — `410 Gone` en los 8 deployments del historial). Antes de asumir que hay algo que editar, verifica con la API de deployments (`GET /v6/deployments/{id}/files`) si el código sigue vivo. Si no, el camino es reconstruir pixel-perfect desde el sitio en vivo (Fase 2), no "editar" nada.
   - **Recomendación permanente**: cualquier sitio nuevo que se construya en este playbook debe quedar con su código en el monorepo (versionado en git), nunca solo como un deploy CLI suelto — así este riesgo no se repite.

---

## Fase 1 — Tokens de diseño y referencia visual

- **Si hay una referencia visual** (URL de un sitio existente, screenshot, Figma): extrae tokens exactos, no los adivines.
  - CSS custom properties y paleta: descarga el CSS de producción (`curl` al bundle `.css` real) y grep de `:root{...}` — ahí están los hex exactos, radios, spacing, no los estimes a ojo.
  - Tipografía: `@font-face` en el mismo CSS te da la familia real y los pesos cargados.
  - Assets: si el sitio sigue en vivo, sus imágenes/vídeos son descargables directo aunque el código fuente no lo sea (`/assets/*` sigue sirviendo aunque el deploy sea irrecuperable).
- **Si es diseño desde cero** (sin referencia): define el sistema de tokens ANTES de escribir componentes — paleta (4-6 hex con nombre), tipografía (display + body + mono si aplica), spacing, radios. No arranques a maquetar sin esto, cuesta más deshacer después.
- **Evita los defaults de "diseño genérico de IA"**: crema cálido + serif + terracota; negro casi puro + un solo acento verde-ácido; gradiente morado-a-azul sobre blanco; Inter o Space Grotesk como fuente "segura" por defecto; todo centrado; `rounded-lg` en todo. Si no hay una razón de marca para uno de estos looks, no es la elección por defecto.

---

## Fase 2 — Construcción con loop de auto-crítica (pixel-perfect o diseño propio)

Usa la skill **`loop-diseno`** (`~/.claude/skills/loop-diseno/SKILL.md`) — no reinventes el proceso. Resumen del método (léelo completo antes de construir, tiene 15+ patrones ya validados en `learnings.md` que ahorran iteraciones):

1. **Extracción de tokens** documentada antes de escribir código (Fase 1 de arriba).
2. **Auditoría comparativa**: tabla referencia vs. actual, con impacto alto/medio/bajo por diferencia.
3. **Plan de implementación** por bloques: foundations → tipografía → layout macro → componentes (el más prominente primero) → estados interactivos → responsive → microdetalles.
4. **Loop de screenshots + scoring** (Playwright, `getBoundingClientRect()` para posiciones exactas, nunca Y estimada) contra un rubric de 10 ítems (layout, tipografía, color, espaciado, componentes, estados interactivos, responsive, microdetalles, jerarquía visual, densidad). **Umbral real: 9/10, no 7** — dos iteraciones consecutivas ≥9 para terminar.
5. **Actualizar `learnings.md`** al terminar — es lo que hace que el método mejore con cada landing construida. No te lo saltes.

Errores más caros de repetir (de `learnings.md`, aplican a casi cualquier stack):
- Font-weight no explícito en elementos fuera de `.display-*` → hereda 400 sin querer.
- `clamp()` con mínimo demasiado alto → overflow en mobile (regla: `min × caracteres < viewport - padding`).
- Secciones "light" sobre un sistema dark necesitan ~15 overrides explícitos (bg de checks, bordes, avatares) — crearlos todos de una vez, no descubrirlos iteración a iteración.
- `overflow-x:auto` en carruseles rompe el scroll vertical en trackpad macOS — usar `overflow:hidden` + `transform:translateX`.

---

## Fase 3 — Conectar a sf-cms (para que el contenido sea editable de verdad)

**Regla de oro, no negociable:** el valor por defecto (`DEFAULTS` hardcodeado) de cada sección debe ser el copy REAL final, nunca un placeholder — así, si el CMS falla o el campo está vacío, el sitio se ve exactamente igual (nunca en blanco, nunca con "lorem ipsum" en producción).

- Patrón establecido (`lib/cms-pages.ts` en cualquier sitio ya conectado — cópialo, no inventes uno nuevo): `loadCmsSections(slug)` lee `content/pages.json` (horneado en build-time por `scripts/fetch-cms-content.mjs`), `mergeCms(DEFAULTS, cms['<section-id>']?.data)` sobreescribe **solo** las keys que existen literalmente en `DEFAULTS` — **por eso los nombres de campo tienen que coincidir exactamente** entre el componente y lo que se guarda en sf-cms. Un mismatch de nombres (`headline_line1` vs `headline_top`) es un fallo silencioso: el build no truena, pero el CMS deja de tener efecto — pasó de verdad con NC Global Assets esta sesión, verifícalo con un campo de prueba antes de dar la conexión por buena.
- `fetch-cms-content.mjs`: **nunca** `exit(1)` si faltan las env vars o el fetch falla — solo `console.warn` y sigue con lo que ya había. Una caída del CMS jamás debe tumbar un build.
- Elige el modelo de sección según la complejidad del sitio:
  - **`flat-fields`** (un objeto plano de key→texto): para sitios con diseño fijo y muchos campos de copy sueltos (patrón Discoolver). Simple, rápido, sin necesidad de que el editor visual del CMS entienda la estructura.
  - **Secciones tipadas** (`hero`, `story`, `team`, etc., una por bloque visual): mejor cuando cada sección tiene sentido como unidad editable independiente (patrón NC Global). Más trabajo de wiring, pero más natural para quien edite desde el admin.
- Verificación del loop editorial **obligatoria** antes de dar por conectado: publica temporalmente un valor de prueba en un campo, confirma que aparece tras rebuild, revierte el valor real. Sin esto, "está conectado" es una suposición, no un hecho verificado.

---

## Fase 4 — SEO (checklist obligatorio, del CLAUDE.md raíz)

- [ ] Title ≤60 caracteres, keyword + marca.
- [ ] Meta description 120–160 caracteres, con CTA implícito.
- [ ] Canonical self-referencial en TODAS las páginas.
- [ ] OG tags completos: og:title, og:description, og:image (1200×630px), og:url.
- [ ] Blog posts (si aplica): schema JSON-LD `BlogPosting` con `datePublished` + `author`.
- [ ] Dominio canónico consistente entre sitemap.xml, robots.txt, canonical, OG, redirects — apex o www, pero el MISMO en todos lados (la inconsistencia es lo que rompe el SEO, no cuál elijas).
- [ ] Sitemap referenciado en robots.txt.
- [ ] Un solo `<h1>` por página.
- [ ] Performance mobile: FCP < 2.5s, TBT < 200ms, CLS < 0.1 (medir con Lighthouse antes del deploy a producción).

---

## Fase 5 — Optimización de assets

- **Imágenes**: si vienen de un sitio recuperado o de fotografía sin comprimir, es común encontrar PNGs de 20-35MB. Comprimir con `sips -s format jpeg -s formatOptions 85` + `sips --resampleWidth <ancho real de uso>` — reducción típica 90%+ sin pérdida visible perceptible. Verificar dimensiones reales con `sips -g pixelWidth -g pixelHeight` antes: una imagen mostrada a 400px no necesita pesar como un archivo de 5120px de ancho.
- **Assets no usados**: al recuperar/heredar una carpeta `public/assets/`, grep cada nombre de archivo contra el código (`grep -rn "nombre-archivo" app components lib`) antes de asumir que todo se usa — es común arrastrar 50-100MB de assets muertos de una versión anterior.
- Actualizar todas las referencias en código al cambiar extensión (`.png`→`.jpg`), y re-verificar que ningún import quedó roto (`curl` cada ruta de `/assets/*` referenciada en el código final, confirmar 200).

---

## Fase 6 — Verificación antes de considerar "hecho"

- `npm run build` **con** env vars del CMS Y **sin** ellas (borra las envs y vuelve a buildear) — ambos deben salir verdes. Esa es la prueba real de que el patrón "nunca fallar el build" funciona.
- `npx tsc --noEmit` y el linter del proyecto, limpios.
- Verificación visual real en navegador — no solo curl de status codes. Abrir en local, comparar contra la referencia/el rubric de la Fase 2.
- Si el sitio tiene componentes compartidos entre varias páginas (nav, footer): confirmar que **no hay una versión duplicada muerta** coexistiendo sin usarse — pasó con el `Footer` de NC Global Assets esta sesión (un componente sin CSS real, nunca importado, coexistiendo con el correcto). Grep rápido de `function Footer|const Footer` (o el nombre del componente compartido) en el proyecto — debe haber exactamente una definición real usada.

---

## Fase 7 — Deploy seguro

Sigue `docs/EDITING_LANDINGS_SAFELY.md` al pie de la letra: branch → `verify-project-links.mjs` PASS → build con y sin envs → `vercel` (preview) → curl de rutas clave → **solo entonces** `vercel --prod` → curl en el dominio real → commit por paths explícitos.

Antes de desplegar por primera vez un proyecto nuevo:
- Añadir su fila a `docs/PROJECT_REGISTRY.md` Y a la tabla de `scripts/verify-project-links.mjs` (mantenerlos sincronizados, es la fuente de verdad de qué carpeta local corresponde a qué proyecto Vercel).
- Preferir un proyecto Vercel conectado a un repo Git real sobre un deploy CLI suelto — evita el riesgo de pérdida de código fuente descrito en la Fase 0.

---

## Rubric de calidad final

El mismo de `loop-diseno`, 10 ítems de 0 a 10, umbral real 9 (no 7):
layout y proporciones · tipografía · color · espaciado · componentes · estados interactivos · responsive (375/768/1440px) · microdetalles (radius, iconografía, sombras) · jerarquía visual · densidad.

Una landing no está "lista para el cliente" hasta que el mínimo de estos 10 ítems sea ≥9, dos veces seguidas.
