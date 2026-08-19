# Petición a Diego — entrada sin contraseña desde la landing

**Contexto.** La home nueva de discoolver.com pide el correo en el hero y su única
conversión es llevar al visitante dentro de `app.discoolver.com`. Hoy, cuando alguien
deja el correo, lo guardamos y le abrimos la plataforma **sin identificar**: pierde el
paso de entrada y, si quiere guardar un sitio, se topa con un login de correo +
contraseña que no esperaba.

Queremos que dejar el correo **sea** entrar. Necesitamos una de estas dos, la que te
resulte más barata:

## Opción A — enlace mágico (preferida)

1. `POST /v3/auth/magic-link` · body `{ "email": "...", "locale": "es", "redirect": "/map" }`
2. Manda un correo con un enlace de un solo uso, con caducidad (15-30 min basta).
3. Al pulsarlo, crea la sesión y entra en `redirect`. Si el correo no existía, crea la
   cuenta en ese momento.
4. Respuesta a la landing: `200 {ok:true}` sin filtrar si el correo estaba registrado
   o no (no queremos que la landing sirva para averiguar quién tiene cuenta).

## Opción B — entrega de sesión (si el correo os cuesta)

Una URL que abra directamente vuestro alta con Google, del tipo
`https://app.discoolver.com/?auth=google&redirect=/map`. Con eso la landing ofrece
"Entrar con Google", que ya es sin contraseña y ya lo tenéis montado. Hoy no se puede
enlazar: `/login` responde 200 pero pinta *NotFound*, y el alta solo aparece como
modal dentro de la aplicación.

## Qué pasa en la web mientras tanto

El copy y el formulario **ya están escritos y desplegables**, detrás de una constante
(`MAGIC_LINK` en `components/app/HeroEntrar.tsx`). Mientras esté en `false`, el botón
dice "Entrar en la plataforma" y no prometemos ningún correo. El día que exista el
endpoint, es cambiar `false` por `true` y apuntar la llamada: nada más.

## Dos cosas más, sin relación con esto

1. **`/search` enseña los creadores como `Influencer 1 … Influencer 10`** con
   `#Top 1 … #Top 10`. La home dice "los 10 mejores creadores por ciudad" y quien
   entra desde ahí ve el relleno. ¿Es que faltan por cargar los nombres reales?
2. **No hay forma de consultar un sitio por nombre ni por id.** La home enseña cinco fichas reales
   de Madrid (Mercado de San Fernando, Azotea del Círculo, Parque del Capricho, Macera Taller,
   Lavapiés Streetart) y queremos que su descripción salga de vuestra base, no escrita por
   nosotros. Probamos `/v3/recommended/{id}`, `/v3/plan/{id}/es`, `/v3/plans/search` y
   `/v3/search/recommended`: 404 o 500. ¿Podéis abrir una búsqueda por texto o una consulta por id?

3. **`/wishlist` exige cuenta** (correcto), pero `Plan My Trip` deja configurar la ruta
   y pide cuenta al guardar. Lo hemos etiquetado así en la web para que nadie se lleve
   la sorpresa.
