# Discoolver App Landing — convenciones para Claude Code

**Qué es:** la landing de la **app** de Discoolver (descubrimiento local, lista de espera
por invitación). Es la web que existía antes del 2026-08-05 en `discoolver-landing.vercel.app`.

**Qué NO es:** la web de las **guías editoriales**. Esa es `clients/discoolver/web`
(tienda de guías por destino + landing de captación de creators) y vive en
`discoolver-landing.vercel.app`. Son dos productos distintos con dos webs distintas:

| Producto | Carpeta | Proyecto Vercel |
|---|---|---|
| Guías editoriales (venta de guías + creators) | `clients/discoolver/web` | `discoolver-landing` |
| **App de descubrimiento (esta)** | `clients/discoolver/app-landing` | `discoolver-app-landing` |

**Por qué existe esta carpeta:** el 2026-08-05 se reposicionó `clients/discoolver/web` como
tienda de guías, sustituyendo el contenido de la app. La landing de la app se recuperó
íntegra del histórico (commit `4cf6f32~1`) a esta carpeta para que siga viva en su
propio dominio. **No mezclar los copys de las dos**: la de guías vende guías por destino
(digital 14€ de lanzamiento / papel 29-35€), esta vende el acceso anticipado a la app.

## Contenido editable por CMS

Mismo patrón flat-fields que el resto de landings del ecosistema: el copy se descarga de
SF-CMS en build-time (`scripts/fetch-cms-content.mjs`) y se hornea en `content/pages.json`;
sin envs o con el CMS caído renderiza los fallbacks de `lib/content/{home,influencers}.ts`.

⚠️ **La página `home` de sf-cms (proyecto `discoolver`) ya NO sirve a esta web**: se
re-sembró con los campos de la tienda de guías. Si se quiere gestionar esta landing desde
el CMS hay que crearle **su propia página** con su slug (p. ej. `app-landing`) y apuntar
`SF_CMS_PAGE_SLUG` ahí. Mientras tanto renderiza sus fallbacks, que son el copy original.

## Assets

`public/assets/` pesa ~148 MB y solo se sirven un par de ficheros. Comprimir antes de
darle más recorrido a esta web.
