# Mensaje para Diego — cierre del 12 de agosto de 2026

Consolida todo lo que queda pendiente de su lado. **Listo para copiar y pegar.**

---

Diego, te resumo dónde estamos y lo que necesito de ti para cerrar. Son cuatro
cosas y ninguna te lleva mucho, pero la primera nos tiene parados.

## Lo que ya está hecho por nuestra parte

El circuito completo funciona: traemos sitios de Instagram, TikTok y Google
Maps, los deduplicamos, los verificamos contra Maps, un editor los aprueba uno a
uno y al aprobar se escribe la ficha en español y en inglés.

El último paso también está montado: **encolar en `ic_recommended_business_ia`**
con `stateId = 1` y `show_in_recommended = 0`, la semántica que nos confirmaste.
Ahora mismo ese botón **no escribe**: devuelve el `SELECT` y el `INSERT` exactos
para poder revisarlos antes. Lo hemos probado de punta a punta con una cafetería
de Madrid y sale la sentencia completa, con copy, coordenadas, web y foto.

Con el usuario `curator` que nos diste (gracias, los permisos están perfectos:
`SELECT`, `INSERT` y `UPDATE`, sin `DELETE` ni `DROP`) hemos verificado que las
14 columnas de nuestro `INSERT` existen, que `destinationRawId` usa el mismo
slug que nosotros —`madrid` está en `ic_city` con ese `RAW_ID`, igual que
`barcelona`, `ronda` y `bangkok`— y que `locale = 'es'` coincide con tus filas.

## 1. El `categoryRawId` — esto es lo único que nos frena

Hay **dos convenciones conviviendo** en tu base y no sabemos cuál espera tu
ingesta:

- Tu **catálogo** `ic_recommended_business_category.RAW_ID` usa guion bajo
  delante: `_restaurantes`, `_arte_y_cultura`, `_nightlife`, `_alojamientos`…
- Pero las **305 filas que ya tienes** en `ic_recommended_business_ia` van sin
  él: `restaurantes`, `arte_y_cultura`, `nightlife`… (y 189 con el campo a NULL).

Nosotros escribimos con guion bajo, que es lo que casa con tu catálogo:
comprobamos nuestras ocho categorías y las ocho existen ahí. Pero si el proceso
que pasa de la cola a `ic_recommended_business` compara contra otra cosa,
estaríamos metiendo fichas que no enganchan con ninguna categoría.

**¿Contra qué compara?** Con eso lo ajustamos en un minuto y ya podemos escribir.

## 2. Abrirnos la escritura para probar

El interruptor está listo por nuestro lado, pero no queremos activarlo sin que
lo sepas. Lo que escribiríamos son fichas en `ic_recommended_business_ia` con
`stateId = 1`: propuestas que tu equipo valida igual. Nada tocaría la tabla
final ni nada visible para un usuario.

Si prefieres, **empezamos con una sola ficha** y la miras antes de que sigamos.
Y si tienes un entorno de pruebas al que apuntar, mejor todavía: dinos y vamos
ahí primero.

## 3. El acceso único (lo del JWT que propusiste)

Tu idea es la correcta y mejor que la nuestra —nosotros íbamos a guardar unas
credenciales de editor y hacer login por detrás—. Para dejarlo cerrado
necesitamos cuatro datos:

1. La URL del **JWKS** (o el secreto compartido, si vas por HS256).
2. Los valores exactos de **`iss`** y **`aud`** que vas a firmar.
3. Qué **roles** manejas en el CMS.
4. El **dominio** desde el que vas a embeber, para dejar puesto el
   `frame-ancestors`.

En el token nos basta con `sub`, `email`, `name`, `role`, `iat`, `exp` (corto,
60-90 s) y un `jti` para poder rechazarlo si llega dos veces. Si un editor solo
debe tocar ciertas ciudades, mándanos también `cities: [1, 7]` y lo respetamos.

El CMS abre `https://<nuestra-app>/sso?token=<jwt>`, nosotros validamos, montamos
nuestra cookie y hacemos un 302 inmediato: el token desaparece de la barra de
direcciones al instante, que es por lo que dura 90 segundos.

Si va en iframe —que es lo que queremos, para que el editor no salga del CMS—,
dos detalles que sin ellos no funciona: nosotros servimos
`Content-Security-Policy: frame-ancestors <tu dominio>` y nuestra cookie va con
`SameSite=None; Secure`, o el navegador la tira por ser de tercero.

## 4. Las fotos — esto se va a romper si no lo resolvemos

Mandamos `urlMainPicture` con la URL que devuelve Google Maps, y **esas URLs
caducan**. Si vuestro proceso no se las descarga al recibirlas, toda ficha que
os enviemos acabará sin imagen al cabo de un tiempo.

¿Vuestra ingesta se la baja, o preferís que os la sirvamos ya alojada por
nuestra parte?

Y vemos que la tabla tiene también `urlTabPicture` y `urlsGalleryPicture`. Si
nos dices cómo las rellenáis, os mandamos las tres desde el principio y el
editor solo tiene que elegir, en vez de buscarlas a mano.

## Una cosa menor

El **`rawId`**: generamos el slug del nombre (`sinfonia-specialty-coffee`). Si
tenéis alguna regla propia, decidnos y la seguimos.

---

Con el punto 1 resuelto y la escritura abierta, esto queda entregado por nuestra
parte. Cuando quieras hacemos una llamada corta y lo probamos juntos en directo:
en media hora vemos una ficha entrar en vuestra cola y podemos cerrar el resto
en la misma sesión.
