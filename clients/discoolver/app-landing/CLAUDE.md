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

**Slugs propios en el CMS** (2026-08-05): esta web usa las páginas **`app-home`** y
**`app-influencers`** del proyecto `discoolver` en sf-cms — NO `home`/`influencers`, que
sirven a la web de guías dentro del mismo proyecto. El mapeo está en
`scripts/fetch-cms-content.mjs` (`PAGE_SLUGS`, con la clave local intacta para que
`lib/cms-pages.ts` siga leyendo `pages["home"]`) y en `loadCmsSectionsLive` para el draft
mode. Se puede sobreescribir con `SF_CMS_SLUG_HOME` / `SF_CMS_SLUG_INFLUENCERS`.

Las dos páginas están `published` con los 206 + 107 campos del copy original, así que ya
son editables desde el CMS sin tocar código.

## Assets

`public/assets/` pesa ~148 MB y solo se sirven un par de ficheros. Comprimir antes de
darle más recorrido a esta web.
