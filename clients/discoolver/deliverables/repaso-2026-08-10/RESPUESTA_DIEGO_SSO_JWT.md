# Respuesta a Diego — SSO por JWT entre el CMS y nuestras herramientas

**12 de agosto de 2026.** Diego propone: *"generar un JWT, y las otras aplicaciones
con ese JWT, que llevan toda la información que necesitan, les permita acceder
directamente"*. Es exactamente el camino correcto. Aquí va cerrado para que lo
pueda implementar sin más idas y venidas.

---

## Mensaje para Diego (listo para copiar)

Diego, perfecto por partida doble.

**1. El usuario `curator` ya está probado y funcionando.** Conecta contra
`bbdd-mysql-cluster-do-user-4186381-0...:25060`, base `discoolver`, y los
permisos son justo los que necesitábamos:

```
GRANT SELECT, INSERT, UPDATE ON `discoolver`.* TO `curator`@`%`
```

Sin DELETE ni DROP: si nuestro proceso se vuelve loco, lo peor que puede hacer
es escribir de más, nunca borrarte nada. Gracias por ajustarlo así. Ya hemos
dejado de usar `doadmin` por nuestro lado.

**2. Lo del JWT: sí, y es como hay que hacerlo.** Es lo mismo que teníamos
pensado, y tu versión es mejor que la nuestra —nosotros íbamos a guardar unas
credenciales de editor y hacer login por detrás, que es más frágil y obliga a
tener una contraseña dando vueltas.

Para que no haya que iterar, esto es lo que necesitamos por nuestro lado:

### Cómo firmas el token

Lo ideal es **RS256 con un endpoint JWKS** (`/.well-known/jwks.json` en el CMS):
tú te quedas la clave privada, nosotros validamos con la pública y nadie tiene
que pasarse un secreto por WhatsApp. Si eso te complica, **HS256 con un secreto
compartido** también nos vale — lo intercambiamos por un canal decente y
listo.

### Qué necesitamos dentro

```json
{
  "iss": "https://cms.discoolver.com",
  "aud": "curator",
  "sub": "<id del usuario en el CMS>",
  "email": "editor@discoolver.com",
  "name": "Nombre Apellido",
  "role": "editor",
  "iat": 1755000000,
  "exp": 1755000090,
  "jti": "<identificador único de este token>"
}
```

- **`role`** es lo que gobierna qué puede hacer dentro: nos vale con
  `editor` y `admin`, dinos tú qué roles manejas.
- **`exp` cortito**, 60–120 segundos. El token es para entrar, no para la
  sesión: en cuanto entra, mandamos nosotros.
- **`jti`** para poder rechazarlo si llega dos veces. Así, aunque el token se
  cuele en un log, no sirve para volver a entrar.
- Si un editor solo debe tocar ciertas ciudades, añade **`cities: [1, 7]`** con
  los IDs y lo respetamos.

### Cómo nos lo pasas

El CMS abre:

```
https://<nuestra-app>/sso?token=<jwt>
```

Nosotros validamos, montamos nuestra propia cookie de sesión y hacemos un 302
inmediato a la raíz de la app. **El token desaparece de la barra de direcciones
en el mismo instante**, que es la razón de que dure 90 segundos.

### Si va dentro de un iframe (una sección más del CMS)

Es lo que queremos —que el editor no salga del CMS— pero hay dos detalles que
sin ellos no funciona, y conviene saberlos antes de perder una tarde:

1. Nosotros tenemos que servir
   `Content-Security-Policy: frame-ancestors https://cms.discoolver.com`
   y **no** mandar `X-Frame-Options: DENY`. Dinos el dominio exacto desde el
   que vas a embeber y lo dejamos puesto.
2. Nuestra cookie de sesión tiene que ir con `SameSite=None; Secure`, o el
   navegador la tira por ser de un tercero dentro del iframe.

### Lo que necesitamos de ti para cerrarlo

1. La **URL del JWKS** (o el secreto, si vas por HS256).
2. Los valores exactos de **`iss`** y **`aud`** que vas a firmar.
3. Los **roles** que manejas en el CMS.
4. El **dominio del CMS** desde el que se va a embeber.
5. Si prefieres iframe o pestaña nueva. Nosotros recomendamos iframe: la
   gracia es que curar fichas y maquetar guías sean dos secciones más del CMS,
   no dos aplicaciones aparte a las que hay que ir.

Con eso lo dejamos montado por nuestro lado y hacemos una prueba conjunta.

---

## Notas internas (no van en el mensaje)

- **Lo que hay que cambiar en el curador**: hoy `app/api/v1/desk.py` expone
  `/v1/editor/session`, que hace un POST server-side a `/api/v2/auth/token` del
  dg-editor con usuario y contraseña guardados en el entorno. Con el JWT eso
  sobra: se sustituye por un `/sso` que valide firma, `aud`, `exp` y `jti`, y
  monte la sesión propia. Menos superficie y una contraseña menos en el `.env`.
- **`frame-ancestors`**: ojo, el `next.config.ts` de la web pública manda
  `X-Frame-Options: SAMEORIGIN`. Eso es de la landing, no del curador, pero si
  algún día se embebe algo de la web habrá que revisarlo.
- **La contraseña llegó por WhatsApp.** Funciona, pero conviene rotarla cuando
  todo esté montado y pasarla por un gestor. Está guardada en el `.env` del
  curador, que sí está en `.gitignore` (comprobado).
- **Sigue faltando** de la lista anterior: el endpoint `/api/me` deja de hacer
  falta si el JWT trae `email`, `name` y `role` — que es lo que hemos pedido.
