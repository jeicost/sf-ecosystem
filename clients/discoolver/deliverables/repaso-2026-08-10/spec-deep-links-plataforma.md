# Spec para Diego — deep links en app.discoolver.com

**De:** equipo web discoolver · **Fecha:** 2026-08-11 · **Prioridad:** media (desbloquea marketing)

## Contexto

La landing (discoolver-app-landing.vercel.app) ya enlaza cada sección a su
contrapartida real del portal, y desde hoy pinta los números vivos de la API v3
(sitios por ciudad, refrescados cada 24 h por ISR). Lo que NO podemos hacer
todavía es enlazar **fino**: llevar al visitante a una ciudad, una categoría o
una ficha concreta. Probado en producción el 2026-08-11:

```
https://app.discoolver.com/search?city=malaga&cityid=7   → ignora el parámetro, abre MADRID
https://app.discoolver.com/map?city=malaga&cityid=7      → ídem
```

El router actual solo tiene rutas de sección: `/map`, `/plan-my-trip`,
`/calendar`, `/search`, `/wishlist`, `/dynamic-recommendations`,
`/plan/:id/print/:language?`.

## Lo que pedimos (3 cosas, por orden de valor)

1. **Ciudad por query param** — que `/search`, `/map`, `/calendar` y
   `/plan-my-trip` lean `?city=<cityRawId>` (p. ej. `?city=malaga`) al montar,
   y seleccionen esa ciudad igual que lo hace el buscador. Con esto la landing
   y las campañas pueden aterrizar en la ciudad correcta.

2. **Categoría por query param** — `/search?city=<rawId>&category=<rawId de
   /v3/categories>` (p. ej. `&category=_arte_y_cultura`) con el filtro aplicado.
   Con esto las 6 tarjetas de categorías de la landing dejan de aterrizar en
   el buscador vacío.

3. **URL pública de ficha** — una ruta tipo `/place/:id` (o `?post=<id>`) que
   abra la ficha del recomendado. La API ya tiene `POSTS: /business/{a}/detail/{b}`;
   falta la ruta en el front. Con esto los 6 sitios reales del escaparate de la
   landing (La Croquetta, Cine Doré…) enlazan a su ficha de verdad, y cualquier
   creador puede compartir un sitio.

Nada de esto cambia la API — es solo leer `location.search` al montar cada
vista y despachar el estado que ya existe.

## De propina (visto al integrar)

- `/v3/cities/search?q=&lang=es` devuelve ciudades de pruebas antiguas junto a
  las reales: **Londres, San Francisco, Sao Paulo, SHANGAI, PARIS, TOKIO**.
  Salen en el buscador público del portal. Convendría ocultarlas o borrarlas.
- El bundle expone `console.debug("[Auth] Token adjuntado…")` en cada request —
  ruido en la consola de producción.

## Qué haremos nosotros cuando esté

En cuanto los params funcionen, la landing pasa automáticamente a enlazar:
tarjetas de categoría → `/search?category=…`, líneas de ciudad del ticker →
`/search?city=…`, y los sitios del escaparate → su ficha. El código de la
landing ya está preparado para ello (lib/platform.ts centraliza las URLs).
