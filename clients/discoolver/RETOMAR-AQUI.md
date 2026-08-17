# Discoolver — dónde lo dejamos

**Última sesión: 17 de agosto de 2026.** Este fichero es el punto de entrada:
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
- **Mensajes en el escritorio de Carlos**: Diego (cierre completo, 7 puntos) y
  Alessandro (4 preguntas de la v1.1). Pendientes de enviar.

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
