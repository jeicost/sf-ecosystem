# Discoolver — dónde lo dejamos

**Última sesión: 12 de agosto de 2026.** Este fichero es el punto de entrada:
léelo antes de tocar nada y actualízalo al cerrar.

---

## En una frase

El dominio está cortado y sirviendo, las tres landings unificadas en un solo
proyecto, el blog rescatado y vivo, el cobro montado y probado en modo prueba.
**Lo único que impide vender el 1 de septiembre no es código: son tres tareas
de verificación pendientes en la cuenta de Stripe.**

---

## Qué hay en el aire ahora mismo

| URL | Qué es |
|---|---|
| `discoolver.com` | La plataforma (era la landing huérfana de la app) |
| `discoolver.com/guias` | La tienda de guías (estaba en la raíz hasta el 12-ago) |
| `discoolver.com/360` | La marca B2B. No se movió |
| `discoolver.com/blog` | 50 artículos rescatados del blog viejo |
| `discoolver.com/influencers` | Captación de creators |
| `discoolver.com/{aviso-legal,terminos,privacidad,cookies}` | Legales, ES+EN |
| `discoolver.com/en/*` | Espejo en inglés (el blog **no**: es solo ES) |
| `blog.discoolver.com` | 308 a `/blog/<slug>`, conservando el artículo |

Todo sale de **un solo proyecto**: `clients/discoolver/web` → Vercel
`discoolver-landing`. Git-connected: push a `main` despliega.

`discoolver-app-landing` y `discoolver-creators-landing` siguen existiendo pero
**redirigen** al dominio. Ojo: **no son git-connected**, se despliegan con
`vercel --prod` desde su carpeta.

De Diego, no nuestro: `app.` (la plataforma real), `cms.`, `ctrl.`, `api.`,
`images.`.

---

## Lo que espera a Carlos

### 1. Stripe — es lo único que bloquea el lanzamiento

La cuenta `acct_1EuMgUAPraLZBALb` **tiene los cobros pausados**. Lo confirma la
API, no solo el banner rojo: `charges_enabled: false`. Es la cuenta de la
Discoolver de 2019 y arrastra tres tareas de verificación sin completar.

Hay que entrar al panel, pinchar **«View tasks»** y completarlas. Suele ser
identidad del titular, datos fiscales y cuenta bancaria. **Tarda días, no
minutos** — es lo que puede llegar tarde al 1 de septiembre.

Ya montado y **verificado en modo prueba**:
- Clave de prueba y `STRIPE_WEBHOOK_SECRET` puestos en Vercel (production).
- Webhook `we_1U3ZgoAPraLZBALbzfrZkZaT` → `/api/stripe-webhook`, evento
  `checkout.session.completed`.
- Probado que **rechaza una firma falsa** (400) y acepta la buena (200).
- Renuncia al desistimiento montada y comprobada llamando al endpoint a mano.

**`NEXT_PUBLIC_CHECKOUT` está SIN poner a propósito.** Con claves de prueba, si
se encendieran los botones un visitante real llegaría a un checkout de mentira,
creería haber comprado y no recibiría nada.

Para pasar a real: cambiar la clave por la `sk_live_`, **recrear el webhook en
modo real** (el secreto es distinto) y poner `NEXT_PUBLIC_CHECKOUT=1`.

### 2. El ID de medición de GA4

Un `G-XXXXXXX` en `NEXT_PUBLIC_GA_ID` y se enciende todo: aparece el banner de
consentimiento y **las tres páginas legales cambian solas** al texto correcto.
El mismo interruptor gobierna la página de cookies (ES y EN) y el apartado de
cookies de la privacidad, para que no puedan contradecirse.

Hoy no hay ninguna medición en ninguna página. Se lanza a ciegas.

### 3. La compra de prueba

Con la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
Falta decidir si se hace con una URL de pago suelta o abriendo los botones en un
despliegue de vista previa.

---

## Lo que espera a Diego

El mensaje completo está en
`deliverables/repaso-2026-08-10/MENSAJE_DIEGO_2026-08-12_ESCRITURA.md`.

1. **El `categoryRawId`** — la única duda que frena abrir la escritura al CMS.
   Su catálogo usa `_restaurantes` (con guion bajo) y sus propias filas de la
   cola usan `restaurantes` (sin él). Nosotros escribimos con guion bajo porque
   casa con el catálogo, pero si su ingesta compara contra otra cosa las fichas
   entrarían sin categoría. Está anotado en `app/bridge/cms_schema.py` del
   curador.
2. **JWKS, `iss`, `aud`, roles y dominio** para el acceso único. Con eso monto
   el `/sso` del curador y se acaba el segundo login.
3. **Cuándo activar `CMS_WRITE_ENABLED`** — mejor con él delante.
4. **Las fotos caducan**: mandamos `urlMainPicture` con la URL de Google Maps y
   esas expiran. Si su ingesta no las descarga, toda ficha que enviemos acabará
   sin imagen.

Su usuario `curator` ya está probado: `SELECT, INSERT, UPDATE` sobre
`discoolver`, sin DELETE ni DROP. Contraseña en el `.env` del curador.

---

## La auditoría del editor de guías

Lanzada el 12-ago con ocho agentes en paralelo (recorrido, entradas, salidas,
robustez, datos, seguridad, coste y producto), cada hallazgo grave verificado
por un agente que intentaba refutarlo.

Transcripción: `~/.claude/projects/-Users-carlosjacoste/9206f369-.../subagents/workflows/wf_21e50361-de3/`

**Si no llegó a leerse el informe, está ahí.** Lo que se sabía al lanzarla: 93
endpoints, entradas por Excel / Instagram / CMS / curador, salidas a PDF y web,
y **cero tests propios**.

---

## Cosas que cuesta redescubrir

- **La API del CMS cachea 60 s.** Tras sembrar o cambiar algo, un build
  inmediato se trae lo anterior. Me pasó dos veces el mismo día.
- **En las páginas de 360 el CMS pisa al código.** Tocar `lib/content/b360/**`
  sin re-sembrar no cambia nada en producción.
- **La tabla `posts` real** es bilingüe y tiene un `client_slug` NOT NULL que no
  está en la migración; y el `UNIQUE(project_id, slug)` que la migración declara
  **no existe en la base**, así que `on_conflict` da 42P10.
- **Dos direcciones, las dos válidas**: Alfonso XII 62 es el domicilio social
  (va en las legales); María de Molina 39 es la oficina (va en el copy de 360).
  No unificarlas.
- **El teléfono es tailandés y se enlaza por WhatsApp**, nunca con `tel:`.
- **Un CNAME `_domainkey` con el proxy naranja de Cloudflare rompe el DKIM.**
  Estuvo roto quién sabe cuánto.
- El token de Cloudflare usado para el corte **caduca el 20 de agosto**.
