# Discoolver Web — convenciones para Claude Code

Web pública de discoolver: **tienda editorial de guías de viaje** (home) + **landing de captación
de creators** (`/influencers`). Ver `clients/discoolver/CLAUDE.md` (raíz del cliente) y
`docs/PROJECT_REGISTRY.md` antes de cualquier deploy.

## Qué es esta web hoy (reposicionamiento 2026-08-05, EN PRODUCCIÓN)

discoolver cura cada año las mejores recomendaciones de creadores en redes y las edita en guías
por destino: **digital 14€ de lanzamiento (19€ después) · papel 29-35€ con el digital incluido**,
más IA para recorrer la ciudad. Estrategia completa y roadmap:
`~/Developer/discoolver-dg-editor/ESTRATEGIA_EDITORIAL_2026.md`.

- **Home** = catálogo de guías (`Guides.tsx` con `Book3D`/`TiltBook`: libros 3D en CSS con lomo y
  sombra) + curación + objeto + IA + puente a creators. CTA principal "Ver las guías", no waitlist.
- **`/influencers`** = landing de captación con DOS tracks: TOP ("Tu guía. Tu marca. Tus ingresos.",
  50% de cada venta desde sus canales + 50% de la afiliación neta) y MICRO ("Envíanos tu vídeo").
  Es el destino de los anuncios y del pitch directo a influencers.

**Prohibido reintroducir** (se eliminó a propósito y está verificado en producción): "No es una
guía. No es un blog.", las "500 plazas por ciudad", los "120.000 usuarios"/"8.742 en lista", los
testimonios y handles inventados (@marta.viajes…), las colaboraciones pagadas de €500-1.500 y el
campo **contraseña** en el formulario de creators (la cuenta se crea al aprobar la candidatura).
Cualquier prueba social debe ser verificable.

## Regla de oro: los tokens recuperados no se tocan sin verificar

`app/globals.css` contiene tokens y clases **recuperados 1:1** del CSS de producción original
(paleta, clamp() de tipografía, spacing, radii). Un ajuste "de mejora" sin verificar contra el
original ya causó una regresión real (los `clamp()` de `.display-xl/lg/md`, `.faq__q`,
`.cta__title` y `.wordmark` se achicaron y rompieron el wrap del H1 del hero en mobile). El
rediseño de 2026-08 respetó esto: el estilo nuevo vive en una **capa aditiva al final del
fichero** ("Guide shop 2026"), sin modificar los bloques recuperados.

## Contenido editable por CMS (build-time bake)

Mismo patrón que `clients/adrian-grooves`: el contenido se descarga de SF-CMS en build-time
(`scripts/fetch-cms-content.mjs`, corre antes de `next build`) y se hornea en `content/pages.json`
(gitignored). Un cambio en el CMS se refleja **en el próximo deploy**, no al instante. Sin envs o
con el CMS caído/con la página en draft, la web renderiza el copy hardcodeado de
`lib/content/{home,influencers}.ts`. El script nunca hace `exit(1)`.

Modelo de datos: **flat-fields**, una sola sección por página (`id: "content"`), igual que
`clients/discoolver/creators-landing`. NO uses el modelo multi-sección de `@sf/cms-client` — este
cliente ya usa flat-fields en producción, no inventes un modelo distinto.

Cada componente de sección recibe `content` (objeto plano ya mergeado) como prop — el layout/JSX
se queda hardcodeado, solo el texto viene del CMS.

`mergeContent` solo recorre las claves del fallback, así que un campo viejo del CMS que ya no
existe en `lib/content/*.ts` se ignora. **Ojo con lo contrario: si una clave coincide con una del
set antiguo, el CMS la pisa** — y en local no se nota, porque sin `.env.local` la web solo renderiza
los fallbacks. El reposicionamiento de 2026-08 encontró **40 colisiones reales** (34 en `home`:
`hero_sub`, `hero_eyebrow`, el FAQ entero, los CTAs y el footer; 6 en `influencers`): habrían
publicado el copy viejo en producción. Se resolvió reemplazando el `sections_json` de las tres
páginas (`home` 103 campos, `influencers` 87, `creators-landing` 82) por las claves actuales.

**Regla:** al reescribir el copy de una página, re-sembrar su página en sf-cms con el set de campos
nuevo ANTES de desplegar. Proyecto Supabase `dmzecrlkclocqaywkjtc`, tabla `pages`; proyecto
discoolver `674dda33-f0dd-4d2f-8433-92aa86941caf` (home `2b4b0062-…`, influencers `85c1e18d-…`,
creators-landing `c09293e7-…`).

## Assets pesados

`public/assets/` tiene ~550MB (varios PNG de 20-35MB sin comprimir + vídeos mp4/mov). Antes de un
deploy real: comprimir con `sips` (ver `~/.claude/skills/loop-diseno/learnings.md`, sección
"Compresión de imágenes para web") y decidir si los vídeos se sirven desde Vercel o un CDN externo
— 550MB en el repo/deploy no es sostenible.

## Waitlist (formsubmit.co)

`app/api/waitlist/route.ts` reenvía server-side a `formsubmit.co/ajax/<destino>` — el patrón
estándar de forms en webs de clientes SF (igual que NC Global LeadMagnet). Le postean 4 forms,
cada uno con `source` propio que fija el `_subject` del email: `HeroForm` (`hero`),
el aviso por destino de la home (`Waitlist.tsx`) y los dos de `/influencers` (`InfluencerForms`):
`creator-guide` (track "quiero mi guía") y `creator-video` (track "envío mi vídeo"). Los campos admitidos van en
whitelist (`EXTRA_FIELDS`): añadir uno nuevo al form obliga a añadirlo también ahí o se pierde.

- **Destino**: env `WAITLIST_FORWARD_EMAIL`; fallback `carlos@discoolver.com`, la dirección que
  `clients/discoolver/creators-landing` usa en producción vía formsubmit (o sea, ya activada).
- **Gotcha formsubmit**: si cambias el destino a otra dirección (p. ej. `hola@discoolver.com`),
  el primer envío dispara el email de activación y TODO fallará (502) hasta que ese buzón
  confirme. Hacer un envío de prueba real tras cambiarlo.
- El endpoint nunca finge éxito: si formsubmit no confirma, responde 502 y los tres forms
  muestran error visible. No reintroducir el stub `{ok:true}`.

## Deploy

Proyecto Vercel propio (install aislado, NO workspace dep — mismo patrón que adrian-grooves).
**Git-connected al monorepo desde 2026-07-30: cualquier push a `main` dispara un build de
producción real** (aquí y en los otros proyectos conectados — salsaburgers, startupsfactory,
ncglobalassets, adrian-grooves). Comprobar los cuatro tras un push.
`node scripts/verify-project-links.mjs clients/discoolver/web` → PASS antes de cualquier
`vercel --prod` manual.

**EN PRODUCCIÓN desde 2026-08-05** (commits `4cf6f32` home + `5b5309e` creators, deploy READY y
verificado en vivo). Las tres páginas de sf-cms están `published` con los campos nuevos.
Pendiente aún: comprimir los assets pesados de `public/assets/` (~550MB, ver sección anterior) y
definir `WAITLIST_FORWARD_EMAIL` en Vercel si el destino no es `carlos@discoolver.com`.

## No tocar

`clients/discoolver/creators-landing` es un proyecto hermano independiente, ya en producción,
gestionado por sf-cms — es la referencia de patrón, no algo a modificar desde aquí.
