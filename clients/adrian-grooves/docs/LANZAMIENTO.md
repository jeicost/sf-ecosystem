# Runbook del lanzamiento — del 15-oct-2026 en adelante

La web tiene **dos estados** y hoy está en el primero:

| | PRE-LANZAMIENTO (hoy) | VENTA ABIERTA (desde el 15-oct) |
|---|---|---|
| Qué hace el botón | lleva a `#lista` (captación de correos) | abre el checkout de Hotmart |
| Qué promete la página | «el curso abre el 15 de octubre» | «entras hoy» |
| Datos estructurados | `availability: PreOrder` | `availability: InStock` |

Pasar de uno a otro **no necesita tocar código**: es contenido del SF-CMS.

**Cómo se despliega esta web** (ver `docs/PROJECT_REGISTRY.md` del monorepo):
está conectada a git desde el 30-jul-2026, y se construye desde la rama `main`
de `jeicost/sf-ecosystem`. Hay dos disparadores:
- **Publicar la página en el admin del SF-CMS** → el deploy hook del proyecto
  reconstruye `main` con el contenido nuevo. Es lo que se usa para cualquier
  cambio de contenido, incluido el del día del lanzamiento.
- **Push a `main`** → para cambios de código.

`vercel --prod` desde la carpeta NO funciona: el proyecto tiene
`rootDirectory: clients/adrian-grooves` y el CLI lo suma a la ruta actual.

⚠️ El deploy hook construye el CÓDIGO que haya en `main`. Contenido nuevo del CMS
con código viejo en `main` rompe la página (secciones que el código viejo no
conoce, un fallback que resucita contenido retirado): los cambios de código
tienen que estar en `main` ANTES de publicar contenido que dependa de ellos.

---

## El interruptor

Todo cuelga de un único campo del CMS:

```
proyecto adrian-grooves → página home → sección hero → cta_url
```

- `#lista` → venta cerrada. Todos los CTA de la página (nav, hero, oferta,
  CTA final y el botón fijo de móvil) apuntan al formulario de captación, y
  `lib/jsonld.ts` declara la oferta como `PreOrder`.
- `https://pay.hotmart.com/...` (URL absoluta) → venta abierta. Los mismos CTA
  abren el checkout y los datos estructurados pasan a `InStock`.

La detección está en `ventaAbierta()` (`lib/jsonld.ts`): es una URL absoluta o
no lo es. Se hizo así a propósito, para que no haya un segundo interruptor en el
código que alguien se olvide de mover — que es justo como se acaba declarando
`InStock` un producto que todavía no se puede comprar.

---

## El 15-oct se cambia UN campo

Cada texto que depende del estado tiene **dos campos** en el CMS: `x` (venta
abierta) y `x_prelanzamiento` (hoy). El componente elige solo según
`hero.cta_url` (`cmsState` en `lib/cms-pages.ts`). Así que el día del
lanzamiento:

1. `hero.cta_url` → la URL del checkout de Hotmart (con `https://`; cualquier
   otra cosa se ignora y la página se queda en `#lista`, que es el estado
   seguro — ver `ctaSeguro`).
2. En local: `node scripts/fetch-cms-content.mjs && node scripts/verificar-lanzamiento.mjs`
   (el bake local lee el contenido guardado; sale con 1 si algo bloquea).
3. **Publicar** la página `home` en el admin del SF-CMS → dispara el rebuild.

Los textos de venta abierta ya están escritos en el CMS y se pueden revisar
hoy mismo: son los campos SIN sufijo. Tienen pareja `_prelanzamiento`: `hero`
(cta, microcopy, sticky_cta), `programa` (intro y el `status` de los módulos
00-02), `trabajo.intro`, `oferta` (headline, cta, microcopy), `lista` (eyebrow,
headline, intro, cta, success), `garantia.body`, `faq.items` y `cta-final`
(cta, microcopy, support).

⚠️ El sufijo es `_prelanzamiento` y no `_pre` a propósito: `headline_pre` ya
existe en el hero y en el CTA final con otro sentido (la parte del titular
antes del acento).

Se comprobó el 21-sep construyendo los dos estados: en cada uno, **ni un solo
texto del otro** aparece en el HTML (tampoco en los datos serializados de los
componentes de cliente).

---

## Lo que hay que hacer ANTES del 15-oct (y no es contenido)

Sin esto la fecha no se puede cumplir, por mucho que el CMS esté listo:

1. **Producto y checkout en Hotmart**, con una compra real de prueba hecha y
   reembolsada. La verificación de identidad y cuenta bancaria de Hotmart no la
   controlamos: es el trámite que puede tumbar la fecha, así que se abre ya.
   👉 Si el 13-oct no hay compra de prueba superada, **la venta no abre el 15**.
   Se mueve al 22. Vender con un checkout sin probar cuesta más que una semana.
2. **Dominio propio.** Hoy la web vive en `adrian-grooves.vercel.app`. Hay que
   comprarlo, apuntarlo, darlo de alta en Vercel y actualizar `site.url` en
   `lib/site.ts` y `NEXT_PUBLIC_SITE_URL`.
3. **Píxel de Meta.** El campo `pixels` de la página está VACÍO: hoy no hay
   ningún seguimiento. Se rellena en el CMS (`meta_pixel_id`) y hay que
   verificar que dispara de verdad, no solo que está pegado. Cuanto antes:
   la cuenta necesita historial de tráfico antes de tener que optimizar ventas.
4. **Variables del formulario en Vercel**: `LEADS_SUPABASE_URL` y
   `LEADS_SUPABASE_ANON_KEY` están en **producción** desde el 21-sep. Sin ellas
   el formulario responde 503 y dice que ha fallado (no da las gracias en falso).
5. **Aviso de cada registro.** La web solo guarda; el aviso lo manda el cron de
   sf-cms (`/api/cron/leads`) por Resend. ⚠️ **sf-cms NO tiene `RESEND_API_KEY`
   ni `LEADS_FROM_EMAIL` en producción** (comprobado el 21-sep): el avisador no
   ha mandado ni un correo desde que existe, para NINGUNA web — los dos leads de
   Discoolver de agosto siguen sin avisar. Hasta que se configure, los registros
   se ven solo en la tabla `leads` (sf-cms, `site = 'adrian-grooves'`).
6. **Herramienta de email** para escribir a la lista (aviso de apertura,
   newsletter, correo por módulo). No existe todavía y es la que hace cumplir
   las promesas de la sección «Cómo se entrega».
7. **Datos legales del titular** en `site.legal` (`lib/site.ts`): nombre o
   razón social, NIF, domicilio y correo. Sin ellos `/aviso-legal` y
   `/privacidad` salen con marcas «[pendiente]» y el script de verificación
   bloquea.
8. **Confirmar con Adrian la garantía de 14 días.** Está publicada desde julio
   y nunca la confirmó nadie (lo dice el propio README). Vendiendo un curso a
   medio entregar, es la cláusula con más consecuencias de la página. Si la
   acepta: `garantia.confirmada: true`. Si no: `garantia.visible: false` y
   quitar la mención de `oferta.microcopy` y de las dos preguntas del FAQ.

---

## Lo que hay que hacer DESPUÉS del 15-oct

- **Cada semana, al publicar un módulo**: cambiar su `status` en
  `programa.modules` de `Sem. X` a `Disponible`, mandar el correo de aviso y
  **publicar la página en el CMS** (dispara el rebuild). El contenido se hornea
  en el build: guardado sin publicar, el cambio no existe en la web.
  Las etiquetas son la prueba visible de que la promesa se está cumpliendo; si
  se quedan desactualizadas, dicen lo contrario de lo que queremos.
- **30-nov, curso completo**: todos los módulos a `Disponible`. Cuando los nueve
  lo estén, se puede quitar el campo `status` entero y las etiquetas desaparecen
  solas (el componente las oculta si no hay `status`). También toca revisar la
  sección `entrega`, que deja de tener sentido tal cual está.
- **Testimonios**: la sección `testimonios` está VACÍA a propósito y no
  renderiza nada. En diciembre, con testimonios reales de los compradores de la
  pre-venta (**con nombre y permiso por escrito**), se rellenan sus `items` y la
  sección vuelve sola. No inventar ninguno: los tres que había publicados desde
  julio eran ficticios y por eso se quitaron.
- **Precio**: la decisión de subir a 197 € está agendada para el 20-nov, con el
  CAC medido en la mano (ver el plan de acción Q4 en MIRA). Si sube, hay que
  cambiar `oferta.price`, `cta-final.price` y `site.price`, y solo entonces
  tiene sentido rellenar `oferta.price_anchor` con el precio anterior — el
  tachado aparece solo cuando ese campo deja de estar vacío. La web NO promete
  en ningún sitio que el precio no vaya a subir (lo prometía hasta el 21-sep y
  cerraba esta palanca); quien compró a 99 € no paga nada más.
