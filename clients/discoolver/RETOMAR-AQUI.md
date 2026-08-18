# Discoolver — dónde lo dejamos

**Última sesión: 18 de agosto de 2026 (madrugada; sigue a la del 17).** Este fichero es el punto de entrada:
léelo antes de tocar nada y actualízalo al cerrar.

---

## Sesión del 17-ago — qué cambió

- **Plan de acción por proyecto aprobado** (`~/.claude/plans/gentle-doodling-acorn.md`):
  Studio (detector+curador+guías+CMS Diego), MIRA prelanzamiento, landings.
- **Discoolver Studio, Fase 0**: red de 36 tests de caracterización, curador
  **desplegado en Railway** (`discoolver-curator-production.up.railway.app`,
  Postgres, API protegida) y **puente editor→curador construido y probado**
  (`/v2/curator/sections`, `/v2/guides/{id}/curator/fill`).
- **Taxonomía verificada contra la BD real de Diego**: 97/97 subcategorías ya
  existen; quedan `_wellness` fuera de Madrid, Ronda sin experiencias/compras,
  y las subcategorías por ciudad casi sin ligar (6/97 Madrid, 0 resto).
- **Landings**: agencias abierta a Google (ES+EN+sitemap), **GA4 encendido**
  (`G-D842FZSKQ5`, banner de consentimiento verificado, variante legal con
  medición). Nada de vídeos ni ensayo de compra todavía.
- **MIRA M1** en producción: Estudio Visual con pilar, portadas del mensual con
  toggle, documentos con Cerebro completo + contrato de voz + esquemas en
  inglés, proponedor de pilares cableado al editor del Cerebro. **Verificación
  con generación real pendiente** (la URL de deploy lleva SSO de Vercel).
- **Mensajes a Diego y Alessandro: ENVIADOS por Carlos** (17-ago tarde).
- **Segunda tanda del 17-ago**: clave `dg-editor` del curador probada contra
  producción; workflow de CI del curador (36 tests en verde en GitHub, deploy
  espera el secreto `RAILWAY_TOKEN`); **110 MB de vídeos muertos fuera del
  repo** (solo 2 de 14 se usaban; copia en `~/Desktop/discoolver-videos-retirados`)
  + posters ligeros en los dos vivos; **ensayo de compra con 4242 aprobado**
  (renuncia grabada en metadata de Stripe con hora y texto, webhook entregado);
  higiene MIRA (_tmp_ fuera, scripts a scripts/).
- **Fotos → R2 cerrado con Diego**: el curador sube la foto a `images/{rawId}/main.jpg`
  en el bucket `discoolver` (su convención exacta, verificada: 18.499 fotos así)
  y manda la URL de `images.discoolver.com`. Construido, 41 tests, desplegado.
  Falta que Carlos pase las 4 llaves `DO_SPACES_*` para encenderlo.
- **⚠️ HALLAZGO AL CERRAR: el dg-editor NUNCA ha desplegado por GitHub Actions.**
  30 de 30 ejecuciones fallidas desde el commit inicial (mayo): el secreto
  `DO_API_TOKEN` no existe (cero secretos en el repo) y la URL
  `discoolver-guides-editor.ondigitalocean.app` da NXDOMAIN. La memoria decía
  «sin URL pública» y se leyó como «desplegado». **Decisión pendiente para la
  próxima sesión: llevar el editor a Railway junto al curador** (mismo patrón,
  CI ya probado hoy) en vez de resucitar un DigitalOcean sin token ni URL. Las
  variables del puente irían entonces en Railway, no en DO.
- **MIRA M2+M3 en producción** (`085b3e7`): adjuntos+Drive (el «error de
  parse»), tipografía de marca en los 4 exportadores, Google Slides en el
  editor de decks, gating real con PlanGate. **M4 (objetivos del sistema)
  diseñado y cerrado** con las 6 decisiones del CEO — arranca cuando se
  encienda `MAX_MONTHLY_GENERATIONS` (recomendado 300).
- **Nota en el escritorio `DG-EDITOR_VARIABLES_DIGITALOCEAN.md`**: YA SOLO
  quedan las 4 llaves R2 (`DO_SPACES_*` → `R2_*` en el curador). Lo demás
  se cerró en la sesión siguiente.

## Sesión del 18-ago (madrugada) — el Studio existe en producción

- **dg-editor DESPLEGADO EN RAILWAY por primera vez en su historia**
  (`discoolver-editor-production.up.railway.app`, servicio `discoolver-editor`
  con su `Postgres-nvLu` dentro del proyecto `discoolver-curator`). Dockerfile
  nuevo (editor React + Python 3.11 + Chromium vía `playwright install
  --with-deps`), alembic al arrancar contra Postgres (`_async_url()` en
  `app/db/database.py` y en `migrations/env.py`; migración 005 troceada en
  sentencias sueltas por asyncpg), 1 worker. **CI real**: `deploy.yml` → Railway
  con `RAILWAY_TOKEN` (secreto puesto), `check ✅ deploy ✅` en el commit `4f03ad5`.
- **Usuario de producción**: `editor@discoolver.com` (contraseña distinta a la
  de dev, guardada en el 1Password/nota de Carlos, no en el repo). Se creó con
  `EDITOR_BOOTSTRAP_EMAIL/PASSWORD` en el arranque (main.py, solo si no existe,
  nunca sobrescribe); la contraseña de la variable ya está en blanco.
  `railway run` NO sirve para esto (ejecuta en local y el host `.internal` no
  resuelve) — de ahí el bootstrap por variable.
- **Prueba de punta a punta EN PRODUCCIÓN**: login OK → `GET
  /api/v2/curator/sections` desde el editor de Railway al curador de Railway →
  **8 secciones** (restaurants… nature). Editor y curador se hablan fuera del
  portátil. Vars del puente en Railway: `CURATOR_URL`, `CURATOR_API_KEY`
  (scope dg-editor), `ANTHROPIC_API_KEY`, `APIFY_TOKEN`, `SECRET_KEY/JWT_SECRET`,
  `ENVIRONMENT=production`.
- **MIRA M4 (objetivos del sistema) EN PRODUCCIÓN** (`e5c823c`, deploy Ready):
  migración `0072_client_goals` aplicada, planner/executor/hooks, cron
  `/api/cron/goals` cada hora, página `/goals` y nav «Goals» como
  `coming_soon` hasta `NEXT_PUBLIC_GOALS_ENABLED=1`. Diseño con las 6
  decisiones del CEO en `docs/OBJETIVOS_DEL_SISTEMA_DISENO.md`. **Apagado
  hasta que Carlos encienda `MAX_MONTHLY_GENERATIONS=300` +
  `ENFORCE_PLAN_LIMITS=true` y luego `GOALS_ENABLED=1`.** → **ENCENDIDO
  el 18-ago (ver abajo).**
- **MIRA: los flags ENCENDIDOS en producción (18-ago, «dale a todo esto»)**:
  `MAX_MONTHLY_GENERATIONS=300`, `ENFORCE_PLAN_LIMITS=true`, `GOALS_ENABLED=1`,
  `NEXT_PUBLIC_GOALS_ENABLED=1`, **`NEXT_PUBLIC_IDEAL_UI=1`** (decisión tomada:
  el punto 8 del CEO «llamar Tools a Library» solo existe en esa navegación).
  Antes de encenderla: Goals añadido a Team→Marketing (no salía), Finance
  visible con candado por plan (Scale lo paga), pie en inglés (`d8e378b`).
  Verificado logueado en prod con Playwright: nav de 7 espacios, `/goals` con
  Salsa OK, cron `/api/cron/goals` responde sin errores.
  **`GENERATION_CAP_EXEMPT_CLIENTS`=Salsa** (`5927835`): al encender el techo,
  Salsa llevaba 506 en agosto (todas pruebas nuestras) y quedaba a 0 hasta el
  1-sep; los clientes reales van por ≤82. Salsa exenta; Dadybox 82/300 ✅.
- **Drive de MIRA: NO había nada que reconectar.** Los 5 refresh tokens
  responden VIVOS contra Google, y el cron `drive-sync` sincroniza las **11
  carpetas** (`synced 11/11` lanzado a mano el 18-ago). El «4/5 caducados» del
  17-ago era un diagnóstico viejo. Si vuelve a caer: comprobar primero que la
  app OAuth sigue PUBLICADA (modo Testing = 7 días), no reconectar a ciegas.
- **Llaves R2: NO están en ningún sitio del disco** (el `.env` del editor se
  perdió al mover el repo; solo hay `.env.example`) ni hay token de Cloudflare.
  Carlos tiene que crearlas en el panel de Cloudflare (ver nota escritorio).

## En una frase

Auditoría de las seis superficies con seis agentes en paralelo y una fase de
refutación —**49 hallazgos confirmados, 2 descartados**— y ejecución de casi
todo el mismo día. **Lo único que impide vender el 1 de septiembre sigue sin
ser código: son tres tareas de verificación en la cuenta de Stripe.**

---

## Lo que se destapó y no sabíamos

**Los siete formularios llevaban horas devolviendo 502 y nadie se enteró.**
Formsubmit rechazaba cada envío por dos motivos apilados: el `fetch` de Node no
manda `Referer`, y el par (`carlos@discoolver.com`, `discoolver.com`) nunca se
activó — la activación es **por par destino+dominio**, así que que la dirección
estuviera activada desde creators-landing no valía.

El arreglo no fue la cabecera: **se invirtió el orden**. Ahora el lead se
escribe primero en la tabla `leads` (migración `017` de sf-cms) y el correo es
el aviso. Si el aviso falla se responde 200 igual, y `notified: false` marca
cuáles repescar. **Ningún tercero vuelve a ser el único destino de un lead.**

La landing usa la **anon key**, no la service key: con RLS de solo-INSERT puede
añadir leads y nada más. Y como anon no puede hacer UPDATE, `notified` se
escribe en el INSERT — de ahí que el aviso vaya primero, con tope de 8 s.

---

## Qué hay en el aire ahora mismo

Todo sale de **un solo proyecto**: `clients/discoolver/web` → Vercel
`discoolver-landing`. Push a `main` despliega.

| URL | Qué es |
|---|---|
| `discoolver.com` | La plataforma. Puerta con correo **opcional**, las **8 categorías** de la taxonomía y la próxima ciudad (Bangkok) |
| `discoolver.com/guias` | La tienda. Botones de compra apagados hasta que abra Stripe |
| `discoolver.com/360` | B2B, con **tres** verticales: destinos, alojamientos y **agencias** |
| `discoolver.com/blog` | 50 artículos como archivo 2016-2021, **filtrables por categoría** (7 rutas) |
| `discoolver.com/influencers` | Captación de creadores |
| `/aviso-legal` `/terminos` `/privacidad` `/cookies` | Legales, con modelo de desistimiento y encargados nombrados |
| `discoolver.com/en/*` | Espejo inglés completo. **El blog no tiene espejo** |

Redirecciones: `blog.discoolver.com` → `/blog/`, los dos proyectos Vercel
huérfanos → dominio, `/category/*` del blog viejo → `/blog`.

De Diego (CTO externo), no nuestro: `app.`, `cms.`, `ctrl.`, `api.`, `images.`.

---

## Lo que espera a Carlos

1. **Stripe** — las tres verificaciones. `charges_enabled: false`. **Tarda
   días** y es lo único del camino crítico.
2. **El enlace de activación de formsubmit** en `carlos@discoolver.com`
   (remitente `noreply@formsubmit.co`, mirar spam). Ya no es crítico: sin él los
   leads se guardan igual, pero no llega el aviso por correo.
3. **El ID de GA4** — sin `NEXT_PUBLIC_GA_ID` no hay medición, ni banner de
   consentimiento, ni la variante «con medición» de las tres legales.
4. **`/360/agencias` sigue en `noindex` a propósito.** Los tres pendientes ya
   están resueltos y redactados, pero son compromisos comerciales públicos ante
   un comprador que incluye administración. Falta que Carlos los valide —
   idealmente con **Diego Docavo**, dirección comercial. Abrirla = quitar
   `noindex` de las dos versiones y añadirlas al sitemap.
5. **Una foto de exterior** para «Naturaleza y aire libre», que hoy va con
   portada tipográfica.

## Lo que espera a Diego (CTO)

Mensaje listo para enviar en
`deliverables/repaso-2026-08-10/MENSAJE_DIEGO_2026-08-13_API_Y_SESION.md`.

1. **Un feed de recomendados curados.** El que hay devuelve los seis destacados
   de cada ciudad marcados `"Sponsored"` —Reina Sofía, Thyssen, Park Güell…— y
   publicarlos bajo la promesa de que nadie paga por entrar nos deja vendidos.
   Bloquea la sección de recomendados por ciudad de la home.
2. **Entrega de sesión** (enlace mágico o JWT) para que dejar el correo en el
   hero deje al visitante dentro identificado. Mismo JWKS/`iss`/`aud` que ya
   pedíamos para el `/sso` del curador.
3. Sigue pendiente de antes: el `categoryRawId`, cuándo activar
   `CMS_WRITE_ENABLED` y que las fotos de Google Maps caducan.

---

## Cosas que cuesta redescubrir

- **Los tokens de color van al revés de su nombre**: `--paper` es el fondo casi
  negro (`#0a0a0f`) y `--ink` el texto casi blanco. Una sección los usó «al
  derecho» y servía el titular negro sobre negro.
- **Un `fr` no baja de `min-content`.** El titular nuevo del hero aplastó la
  columna del vídeo de 548 px a 91 px. Se arregla con `minmax(0, …)`.
- **El CMS pisa al código** y `next dev` **no** lo demuestra: dev lee
  `content/pages.json` horneado. Rehornear con `node scripts/fetch-cms-content.mjs`.
- **`scripts/seed-cms-web.ts` no sembraba `app-home`** — por eso el copy viejo
  seguía ganando por más que se corrigiera el código. Ya está incluida.
- **La API del CMS cachea 60 s.** Tras sembrar, esperar antes de construir.
- **Dos direcciones, las dos válidas**: Alfonso XII 62 es el domicilio social
  (legales); María de Molina 39 es la oficina (copy de 360).
- **Costa del Sol Tourism Hub es una aceleradora**, no un despliegue. Costa del
  Sol es la comarca donde está Ronda, que sí es cliente de pago.
- El token de Cloudflare del corte de dominio **caducó el 20 de agosto**.
