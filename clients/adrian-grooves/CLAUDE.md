# Adrian Grooves — landing de venta (Next.js + SF-CMS)

Página de venta long-form (14 secciones) del curso de filmmaking de Adrian Grooves.
Dark mode cinematográfico, dirección "Camera HUD / Focus Peaking" (verde #7CFF6B).

## Contenido editable por CMS (build-time bake)
El contenido se descarga del SF-CMS en **build-time** (`scripts/fetch-cms-content.mjs`,
corre antes de `next build`) y se hornea en `content/pages.json`. Un cambio en el CMS se
refleja **en el próximo deploy** (`vercel --prod`), NO al instante — igual que salsa/sf-web.
Sin envs o con el CMS caído, la web renderiza el copy hardcodeado (fallback). El script
nunca hace `exit(1)`.

Cada sección lee `cms['<id>']?.data` y hace merge por campo con el fallback
(`lib/cms-pages.ts`). Píxeles por página (Meta/Google Ads) vía `components/PagePixels.tsx`
desde `home.pixels`.

## Env vars (Vercel)
`SF_CMS_API_URL=https://cms.startupsfactory.es/api/public`, `SF_CMS_API_KEY=sk_...`,
`SF_CMS_PROJECT_SLUG=adrian-grooves`, `SF_CMS_PREVIEW_SECRET=...`. Acepta también los
nombres legacy `CMS_*`.

## Draft Mode / preview (EDUX-N4, piloto)
Además del bake de build-time (arriba), este sitio soporta preview en vivo de contenido
`draft` vía Next.js Draft Mode:
- `/api/draft?secret=<x>&slug=home` — verifica `secret` contra `SF_CMS_PREVIEW_SECRET`
  (mismo valor que `projects.preview_secret` en sf-cms), activa draft mode, redirige a `/`.
  Este es el link que abre el botón "Vista previa" del admin de sf-cms.
- `/api/disable-draft` — desactiva draft mode, redirige a `/`.
- Con draft mode activo, `app/page.tsx` hace un fetch en tiempo de request a
  `GET /api/public/pages?project=adrian-grooves&slug=home&preview=true` (headers
  `x-api-key` + `x-preview-secret`, `cache: 'no-store'`) en vez de leer
  `content/pages.json` — así se ve contenido `draft` sin publicar/redeployar. Si el fetch
  falla por cualquier motivo, cae al bake estático (nunca rompe/blanquea la página).
- Con draft mode activo se muestra una barra amarilla fija arriba (`components/DraftBanner.tsx`,
  deliberadamente fuera del branding del sitio) con link para salir.
- Sin draft mode (comportamiento normal de producción): cero cambios, sigue siendo 100%
  bake estático como antes.

## Deploy
Proyecto Vercel propio (install aislado, NO workspace dep). Preview por ahora, sin dominio custom.
`node scripts/verify-project-links.mjs clients/adrian-grooves` → PASS antes de deploy.

## Pendiente (assets reales de Adrian)
Showreel del hero, foto en rodaje, clips antes/después, testimonios reales (los actuales son
placeholder marcado), logo en SVG transparente (ahora se usa el JPG invertido por CSS).
Precio 197€/297€ y garantía 14 días = confirmar antes de publicar.
