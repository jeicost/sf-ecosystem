# Mensaje para Diego — 12 de agosto de 2026

Estado tras montar el paso de publicación, con lo comprobado contra su base y la
petición de escritura. **Listo para copiar y pegar.**

---

Diego, te cuento dónde estamos, porque ya hemos llegado al final del recorrido.

## Lo que ya funciona

La herramienta hace el camino entero: trae sitios de Instagram, TikTok y Google
Maps, los deduplica, los verifica contra Maps, un editor los aprueba o rechaza
uno a uno, y al aprobar se escribe la ficha en español y en inglés.

El último paso ya está montado también: **encolar en
`ic_recommended_business_ia`**, con `stateId = 1` y `show_in_recommended = 0`,
que es la semántica que nos confirmaste — propuesta sin validar, que no puede
aparecer en el viaje de nadie hasta que tu equipo la revise.

Ahora mismo ese botón **no escribe**: devuelve el `SELECT` y el `INSERT` exactos
para poder leerlos antes. Lo hemos probado de punta a punta con una cafetería de
Madrid y sale la sentencia completa, con el copy, las coordenadas, la web y la
foto.

## Lo que hemos comprobado contra tu base

Con el usuario `curator` que nos pasaste (gracias, los permisos están perfectos:
solo `SELECT`, `INSERT` y `UPDATE`, sin `DELETE` ni `DROP`) hemos verificado que
lo que generamos encaja:

- **Las 14 columnas** que usa nuestro `INSERT` existen en
  `ic_recommended_business_ia`.
- **`destinationRawId`**: usamos `madrid`, y existe en `ic_city` con ese
  `RAW_ID`. Igual con `barcelona`, `ronda` y `bangkok`.
- **`locale`**: `es`, igual que las 305 filas que ya tienes ahí.

## Una duda concreta, que es la única que nos frena

Hay **dos convenciones conviviendo** en el `categoryRawId` y no sabemos cuál
espera tu ingesta:

- Tu **catálogo** `ic_recommended_business_category.RAW_ID` usa guion bajo
  delante: `_restaurantes`, `_arte_y_cultura`, `_nightlife`, `_alojamientos`…
- Pero las **filas que ya hay** en `ic_recommended_business_ia` van sin él:
  `restaurantes`, `arte_y_cultura`, `nightlife`…

Nosotros escribimos con guion bajo, que es lo que casa con tu catálogo —
verificamos nuestras ocho categorías y las ocho existen ahí. Pero si tu proceso
que pasa de la cola a `ic_recommended_business` compara contra otra cosa,
estaríamos metiendo fichas que no enganchan con ninguna categoría.

**¿Contra qué compara?** Con que nos digas eso, lo ajustamos en un minuto.

## Lo que te pedimos

**1. Abrirnos la escritura para hacer pruebas.** Tenemos el interruptor listo,
solo hay que activarlo por nuestro lado, pero no queremos hacerlo sin que lo
sepas. Lo que escribiríamos son fichas en `ic_recommended_business_ia` con
`stateId = 1`, o sea propuestas que tu equipo tiene que validar igual. Nada
tocaría la tabla final ni nada visible para un usuario.

Si prefieres, **empezamos con una sola ficha** y la miras antes de que sigamos.
Y si tienes una base de pruebas o un entorno de staging al que apuntar, mejor
todavía: dinos y vamos ahí primero.

**2. Lo del JWT**, que ya hablamos. Para dejarlo cerrado necesitamos:
   - La URL del **JWKS** (o el secreto compartido, si vas por HS256).
   - Los valores exactos de **`iss`** y **`aud`**.
   - Qué **roles** manejas en el CMS.
   - El **dominio** desde el que vas a embeber, para dejar puesto el
     `frame-ancestors`.

**3. Dos cosas más, menores pero conviene resolverlas:**

   - **Las fotos.** Mandamos `urlMainPicture` con la URL que devuelve Google
     Maps. Esas URLs **caducan**, así que la foto se rompería con el tiempo.
     ¿Vuestro proceso se la descarga al recibirla, o preferís que os la sirvamos
     ya alojada por nuestra parte? Vemos que la tabla tiene también
     `urlTabPicture` y `urlsGalleryPicture`: si nos dices cómo las rellenáis, os
     mandamos las tres desde el principio y el editor solo elige.
   - **El `rawId`.** Generamos el slug del nombre (`sinfonia-specialty-coffee`).
     Si tenéis alguna regla propia para eso, decidnos y la seguimos.

Con la escritura abierta y la duda de la categoría resuelta, esto ya está
entregado por nuestra parte. Cuando quieras hacemos una llamada corta y lo
probamos juntos en directo.

---

## Notas internas (no van en el mensaje)

- **Lo del `categoryRawId` es una pregunta de verdad, no retórica.** Nuestras 8
  categorías existen en su catálogo con guion bajo; sus 305 filas de la cola van
  sin él. Una de las dos está mal y no podemos saber cuál sin ver su ingesta.
  El mapeo vive en `app/bridge/cms_schema.py`, `CATEGORY_RAW_IDS`.
- **Lo de las fotos que caducan es un problema real**, no una cortesía. Las URLs
  de `lh3.googleusercontent.com` con token expiran; si su ingesta no las
  descarga, todas las fichas que mandemos se quedarán sin imagen.
- `CMS_WRITE_ENABLED` sigue sin poner. El guardián ya no se queja del usuario
  (era `doadmin`, ahora `curator`), así que activarlo es cambiar una línea.
- En su cola hay **305 fichas en `stateId=1`** y 189 de ellas con
  `categoryRawId` a NULL: no somos los primeros en dejar ese campo a medias.
