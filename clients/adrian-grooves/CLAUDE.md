# Adrian Groves — landing de venta (Next.js + SF-CMS)

Página de venta long-form (14 secciones) del curso de filmmaking de Adrian Groves.
Dark mode cinematográfico, dirección "Camera HUD / Focus Peaking" (verde #7CFF6B).

## Contenido editable por CMS (build-time bake)
El contenido se descarga del SF-CMS en **build-time** (`scripts/fetch-cms-content.mjs`,
corre antes de `next build`) y se hornea en `content/pages.json`. Un cambio en el CMS se
refleja **en el próximo build** (publicar la página en el CMS lo dispara, ver «Deploy»), NO al
instante — igual que salsa/sf-web.
Sin envs o con el CMS caído, la web renderiza el copy hardcodeado (fallback). El script
nunca hace `exit(1)`.

Cada sección lee `cms['<id>']?.data` y hace merge por campo con el fallback
(`lib/cms-pages.ts`). Píxeles por página (Meta/Google Ads) vía `components/PagePixels.tsx`
desde `home.pixels`.

## Env vars (Vercel)
`SF_CMS_API_URL=https://cms.startupsfactory.es/api/public`, `SF_CMS_API_KEY=sk_...`,
`SF_CMS_PROJECT_SLUG=adrian-grooves`, `SF_CMS_PREVIEW_SECRET=...`. Acepta también los
nombres legacy `CMS_*`.
Formulario de captación (`app/api/lista`): `LEADS_SUPABASE_URL` y `LEADS_SUPABASE_ANON_KEY` — los
mismos valores que `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` de sf-cms (la anon key solo puede INSERTAR
en `leads`). En Vercel **producción** desde el 21-sep; sin ellas el formulario responde 503. Van
documentadas aquí y no en `.env.example` porque el `.gitignore` de esta carpeta ignora `.env*`.

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
Proyecto Vercel propio (install aislado, NO workspace dep), sin dominio custom todavía.
**Conectado a git** (`jeicost/sf-ecosystem`, `rootDirectory: clients/adrian-grooves`, rama `main`):
se despliega con **push a `main`** (código) o **publicando la página en el admin del SF-CMS**
(contenido — el deploy hook reconstruye `main`). `vercel --prod` desde esta carpeta NO funciona (el
CLI suma el rootDirectory a la ruta actual). ⚠️ El hook construye el código de `main`: si el
contenido del CMS depende de código que aún no está en `main`, publicar rompe la página.

## Estado: PRE-VENTA (21-sep-2026)
La página vende el curso en **pre-venta con acceso progresivo**: abre el 15-oct-2026 con 3 de los
9 módulos publicados y entrega 1 módulo/semana hasta el curso completo el 30-nov. Precio **99 €**,
pago único y el mismo para todos durante la pre-venta (no hay escalera de precios; la subida a
197 € es una decisión del plan para el 20-nov, y la web NO promete que el precio no vaya a subir). Decisiones confirmadas por
Carlos el 21-sep; plan completo en el Business Report «30/60/90 Action Plan» `f5110091` de MIRA.

**El interruptor del lanzamiento es `hero.cta_url` en el CMS, y es el ÚNICO** — `#lista` = venta
cerrada, URL absoluta = venta abierta. Cada texto que depende del estado tiene pareja
`x` / `x_prelanzamiento` en el CMS y el componente elige solo (`cmsState` en `lib/cms-pages.ts`);
los datos estructurados pasan de `PreOrder` a `InStock` por la misma vía (`ventaAbierta()` en
`lib/jsonld.ts`). Un texto nuevo que dependa del estado DEBE tener su pareja o quedará falso al
abrir. Runbook: **`docs/LANZAMIENTO.md`**. Antes de cada deploy desde el 14-oct:
`node scripts/verificar-lanzamiento.mjs` (sale con 1 si algo bloquea) antes de publicar en el CMS.

### Lo que se arregló el 21-sep (no reintroducir)
- **Precio**: la página publicaba 197 € con ancla tachada de 297 €. Era un error de la landing —
  el Brand Brain siempre dijo ~99 €. El ancla se oculta sola mientras `price_anchor` esté vacío:
  no se tacha un precio que nunca se ha cobrado.
- **Testimonios inventados**: `Testimonios.tsx` tenía tres testimonios ficticios COMO FALLBACK y
  estaban publicados. Vaciar la lista en el CMS no bastaba: `cmsArr` descarta arrays vacíos y
  habría vuelto a caer en el fallback. Ahora el componente **no tiene fallback** y devuelve `null`
  sin items. Los reales se añaden por CMS en diciembre, con nombre y permiso por escrito.
- **Comunidad y directos**: la sección los prometía y el Brand Brain los excluye explícitamente
  (`offer.deliberately_excluded`: «No se ofrece de entrada Discord, mentorías semanales ni soporte
  continuo»). Reescrita con lo que sí está en `offer.includes`.
- **Sin checkout**: todos los CTA apuntaban a `#checkout`, que es un ancla a la propia sección de
  oferta de la página. No había forma de comprar ni de dejar el correo. Ahora existe la sección
  `#lista` con formulario real → `app/api/lista/route.ts` → tabla `leads` de sf-cms.
- **El resto de la revisión adversarial del 21-sep** (90 hallazgos): og:image apuntaba a un
  fichero inexistente (ahora `app/opengraph-image.tsx`); el SEO del CMS no lo leía nadie (ahora
  `generateMetadata` lee la sección `seo`); la regla `* { border-color }` estaba fuera de
  `@layer base` y anulaba TODAS las utilidades `border-<color>` del sitio; «placeholder» visible
  en hero y autor; FAQ del JSON-LD escrita a mano y distinta de la visible (ahora `lib/faq.ts`, una
  sola fuente); sin legal ni consentimiento; píxel sin eventos (ahora `Lead` e `InitiateCheckout`,
  `lib/track.ts`) y sin aviso de cookies (ahora `PixelConsent`: sin píxel configurado no aparece
  nada); `--color-dim` por debajo de AA en los cuatro fondos (ahora #8a8d8a).
- **Componentes de cliente = reciben textos ya resueltos**, no la sección del CMS entera: todo lo
  que se les pasa se serializa en el HTML, y así viajaban también los textos del otro estado.

## Pendiente (bloquea vender el 15-oct)
Ver `docs/LANZAMIENTO.md`. En corto: producto y checkout de Hotmart con compra de prueba, dominio
propio, ID del píxel de Meta en el CMS, datos legales del titular en `site.legal`, herramienta de
email, y confirmar la garantía. ⚠️ sf-cms no tiene Resend configurado: ningún lead de ninguna web se
avisa por correo (se ven solo en la tabla `leads`).

## Pendiente (assets reales de Adrian)
Showreel del hero y foto en rodaje (hoy van fotogramas de sus videoclips con pie honesto; la foto
se cambia por CMS: `autor.photo_url`), clips antes/después, un videoclip de YSY A (la web lo
acredita y no lo enseña), logo en SVG transparente (ahora se usa el JPG invertido por CSS).
La **garantía de 14 días sigue sin confirmar** con el cliente y ahora pesa más que antes: se vende
un curso a medio entregar.
