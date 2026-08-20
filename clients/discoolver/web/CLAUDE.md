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
- **`/influencers`** = landing de captación con DOS tracks: TOP ("Tu guía. Tu marca. Tus ingresos.")
  y MICRO ("Envíanos tu vídeo"). Es el destino de los anuncios y del pitch directo a influencers.

**Ninguna cifra del reparto con el creador va en la web** (decisión del CEO, 2026-08-06). Ni
porcentajes, ni fracciones ("la mitad"), ni importes de lo que cobra. El reparto varía por formato
y por canal —el print no aguanta el mismo porcentaje que el digital— así que publicarlo sería
comprometerse a un número que luego hay que defender caso por caso. El copy dice qué se cobra
(cada venta desde sus canales + cada reserva desde sus páginas) y durante cuánto (mientras la guía
viva), y remite a la llamada y al escrito previo a la firma. Los **precios públicos** del producto
(digital desde 14€, papel desde 29€) sí se publican: eso es precio de venta, no reparto.

La cifra vivía en **cinco sitios** y hay que tocarlos todos o vuelve por la puerta de atrás:
`web/lib/content/influencers.ts`, la página `influencers` del CMS, la página `creators-landing`
del CMS, `creators-landing/index.html` (render commiteado: regenerar con `scripts/build-static.mjs`,
no editar a mano) y `~/Developer/discoolver-dg-editor/ui/influencers.html` (copia gemela sin CMS
detrás, edición manual, otro repo).

**Prohibido reintroducir** (se eliminó a propósito y está verificado en producción): "No es una
guía. No es un blog.", las "500 plazas por ciudad", los "120.000 usuarios"/"8.742 en lista", los
testimonios y handles inventados (@marta.viajes…), las colaboraciones pagadas de €500-1.500, las
fotos de stock haciendo de cara de quien firma un testimonio, y el campo **contraseña** en el
formulario de creators (la cuenta se crea al aprobar la candidatura).
Cualquier prueba social debe ser verificable.

## Reglas de copy — se comprueban solas

`node scripts/revisar-copy.mjs` revisa `lib/content/**` y **devuelve 1 si algo incumple**. Pásalo
antes de sembrar el CMS. Revisa solo los valores entre comillas, nunca los comentarios: el
comentario que explica por qué una palabra está prohibida tiene que poder nombrarla.

**Prohibidas en copy visible (ES)** — con su motivo, porque una prohibición sin motivo se salta en
cuanto cambia quien escribe:

| Palabra | Por qué |
|---|---|
| curado · curada · curación · curaduría · curamos · curator | calco de *curated*; no dice qué hace el editor. Se cuenta con verbos: revisamos, elegimos, publicamos |
| vibra | calco de *vibe* |
| elegido a mano | ya lo dice el hero, con verbos |
| universos · armas secretas | vocabulario de marca vacío, y una metáfora bélica fuera del universo del club |
| edición limitada · tirada limitada · ejemplares numerados | **falso**: la producción de las guías es bajo demanda |
| monetizable · escalable | vocabulario de pitch a inversores, no la voz de la web |

**Ninguna cifra a mano.** El total de sitios, los de cada ciudad y la lista de ciudades abiertas
salen de `lib/platform-stats.ts`. En el copy se escriben como marcadores y los sustituye
`applyPlatformStats` (home) o `aplicarCifras` (resto): `{sitios}`, `{sitios_ciudad}`, `{ciudades}`.
El script bloquea `858`, `1.099`, `1.629`, `1.500` y «12 ciudades» escritos literalmente.

**Los ocho territorios** son los nombres canónicos en toda la web: Restaurantes y cafés · Vida
nocturna · Arte y cultura · Experiencias y eventos · Compras y moda · Alojamiento · Bienestar y
belleza · Naturaleza y aire libre. Nada de «Fiesta», «Gastronomía», «Nightlife», «Aire libre» ni
«Qué ver». **«Territorios» es solo la palabra de superficie en la home**: en `/search`, en la base
de datos, en las guías y en las fichas se sigue diciendo «categorías» — no se renombra el modelo de
datos ni la navegación de la plataforma.

**El inglés no es una traducción.** Son dos copys hermanos que dicen lo mismo y suenan nativos cada
uno en lo suyo. Un titular nunca se traduce literalmente.

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

**La API pública del CMS cachea 60s** (`s-maxage=60, stale-while-revalidate=300` en
`apps/sf-cms/app/api/public/pages/route.ts`). Tras sembrar, un `fetch-cms-content.mjs` inmediato
puede traerse todavía el contenido anterior — no es un fallo de la siembra, es el CDN. Comprobar
contra Supabase directamente si hay duda, o esperar el minuto.

### Las páginas de /360 (marca B2B)

Slugs **prefijados** en el mismo proyecto del CMS, porque `discoolver` sirve a varias webs y no se
pueden repetir: `360-home`, `360-destinos`, `360-alojamientos`, `360-agencias`, `360-demo`
(566 campos en total, sembradas y publicadas el 2026-08-10). Fallbacks en `lib/content/b360/*.ts`,
que siguen siendo la fuente de verdad del copy — el CMS es la capa de edición, no el origen.

Re-sembrar con:

```bash
# las credenciales están en apps/sf-cms/.env.local
SF_CMS_SUPABASE_URL=… SF_CMS_SUPABASE_SERVICE_KEY=… npx tsx scripts/seed-cms-360.ts [--dry]
```

Es idempotente (crea o actualiza por slug). Las cinco páginas usan el atajo `pageContent()` de
`lib/cms-pages.ts`, que resuelve Draft Mode + bake + merge de una vez.

## La marca de /360 es otra marca

`components/b360/Logo360.tsx` monta el lockup: isotipo + "discoolver **360**". El isotipo es el
asset **original** que pasó Carlos (2026-08-10) — degradado, sombra burdeos y swoosh — no una
reconstrucción: si alguien lo redibuja "para vectorizarlo", la marca se bifurca. Vive en
`public/assets/360/`: `logo-360-mark.webp` (27 KB, lo que carga la web), el mismo bitmap en `.png`
para deck y firmas, `logo-360-mark-white.png` (una tinta) e `icon-512.png` / `apple-icon.png`.
El maestro sin recortar está fuera del repo, en el escritorio de Carlos.

Se sirve con `<img>` y no con `next/image` a propósito: son 27 KB, el optimizador no aporta nada
y así el nav no depende de la image optimization de Vercel.

`app/360/layout.tsx` **sobrescribe los iconos** del root layout. Es a propósito: el root declara
un `icons` explícito para el B2C y un `icons` explícito heredado gana a la convención de ficheros
(`app/360/icon.png`), así que los de 360 se declaran también explícitos apuntando a
`public/assets/360/`. El OG de las cinco páginas es `/assets/360/og-360.png`, vía el parámetro
`image` de `buildMetadata`.

~~Mientras el banner "PROPUESTA EN REVISIÓN" siga en el layout, las cinco páginas llevan
`noindex: true`.~~ **Desactualizado.** Comprobado en producción el 13-ago-2026: el banner ya no
está y solo `/360/agencias` sigue en `noindex`; las otras cuatro son indexables y están en el
sitemap. Agencias se mantiene capada a propósito hasta el piloto — y desde el 13-ago su espejo
`/en/360/agencias` también, que se había quedado indexable con el `x-default` apuntando a una
página bloqueada.

## Assets pesados

`public/assets/` son **40MB** (medido el 20-ago-2026). Estuvo en ~550MB hasta que se comprimió el
19-ago con `sips` — ver `~/.claude/skills/loop-diseno/learnings.md`, sección "Compresión de imágenes
para web". Ya no es un problema aquí.

**Donde sí pesa ahora es en `clients/discoolver/app-landing`**: tres vídeos de 13-14MB
(`v-card-shopping.mp4`, `v-hero-owl.mp4`, `v-hero-donkey-bus.mp4`). Si esa landing se retoma, decidir
antes si los vídeos se sirven desde Vercel o desde un CDN externo.

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
Pendiente aún: definir `WAITLIST_FORWARD_EMAIL` en Vercel si el destino no es `carlos@discoolver.com`.

## No tocar

`clients/discoolver/creators-landing` es un proyecto hermano independiente, ya en producción,
gestionado por sf-cms — es la referencia de patrón, no algo a modificar desde aquí.
