# Discoolver Web — convenciones para Claude Code

Reconstrucción pixel-perfect de discoolver-landing.vercel.app tras pérdida de código fuente
(deploy vía Vercel CLI sin repo Git). Ver `clients/discoolver/CLAUDE.md` (raíz del cliente) para
el incidente completo y `docs/PROJECT_REGISTRY.md` antes de cualquier deploy.

## Regla de oro: no romper el pixel-match

`app/globals.css` contiene los tokens y clases de componente **recuperados 1:1** del CSS de
producción original (paleta, clamp() de tipografía, spacing, radii). Antes de tocar cualquier
valor numérico ahí, compáralo contra `/tmp/discoolver-assets/main.css` (o pide al usuario que lo
vuelva a descargar de `https://discoolver-landing.vercel.app/_next/static/css/`) — un ajuste
"de mejora" sin verificar contra el original ya causó una regresión real en este proyecto (los
`clamp()` de `.display-xl/lg/md`, `.faq__q`, `.cta__title` y `.wordmark` se achicaron por error en
el primer pase y rompieron el wrap del H1 del hero en mobile).

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

## Assets pesados

`public/assets/` tiene ~550MB (varios PNG de 20-35MB sin comprimir + vídeos mp4/mov). Antes de un
deploy real: comprimir con `sips` (ver `~/.claude/skills/loop-diseno/learnings.md`, sección
"Compresión de imágenes para web") y decidir si los vídeos se sirven desde Vercel o un CDN externo
— 550MB en el repo/deploy no es sostenible.

## Waitlist (formsubmit.co)

`app/api/waitlist/route.ts` reenvía server-side a `formsubmit.co/ajax/<destino>` — el patrón
estándar de forms en webs de clientes SF (igual que NC Global LeadMagnet). Le postean 3 forms,
cada uno con `source` propio que fija el `_subject` del email: `HeroForm` (`hero`),
`AppComingSoon` (`app`), `InfluencerForm` (`influencer`).

- **Destino**: env `WAITLIST_FORWARD_EMAIL`; fallback `carlos@discoolver.com`, la dirección que
  `clients/discoolver/creators-landing` usa en producción vía formsubmit (o sea, ya activada).
- **Gotcha formsubmit**: si cambias el destino a otra dirección (p. ej. `hola@discoolver.com`),
  el primer envío dispara el email de activación y TODO fallará (502) hasta que ese buzón
  confirme. Hacer un envío de prueba real tras cambiarlo.
- El endpoint nunca finge éxito: si formsubmit no confirma, responde 502 y los tres forms
  muestran error visible. No reintroducir el stub `{ok:true}`.

## Deploy

Proyecto Vercel propio (install aislado, NO workspace dep — mismo patrón que adrian-grooves).
`node scripts/verify-project-links.mjs clients/discoolver/web` → PASS antes de cualquier
`vercel --prod`. **No se ha desplegado a producción todavía** — pendiente decisión del usuario
sobre: comprimir assets, confirmar fecha de lanzamiento real para
`components/ui/Countdown.tsx` (`LAUNCH_DATE` es un placeholder), y publicar las páginas
`home`/`influencers` en sf-cms (hoy en `draft`). El waitlist ya está cableado (ver sección
anterior); opcionalmente definir `WAITLIST_FORWARD_EMAIL` en Vercel si el destino final no es
`carlos@discoolver.com`.

## No tocar

`clients/discoolver/creators-landing` es un proyecto hermano independiente, ya en producción,
gestionado por sf-cms — es la referencia de patrón, no algo a modificar desde aquí.
