# Lágrimas de Sánchez

**Estado: 24 de agosto de 2026 · concepto y producto cerrados, producción sin arrancar**

Marca de botella de cristal serigrafiada y vino de la DO Vinos de Madrid.
Dominios en propiedad: `lagrimasdesanchez.com` y `.es`

---

## El producto en una frase

Una botella borgoña de 750 ml en vidrio ámbar, serigrafiada por completo en el
propio cristal con **67 piezas tipográficas** del vocabulario político español de
la última década. Tinta cerámica blanca vitrificada a 600 °C: no es una etiqueta,
es parte del vidrio. Sin etiqueta frontal. Ni una sola cara.

**Un solo SKU de vidrio, tres presentaciones:**

| | PVP | Coste | Margen |
|---|---|---|---|
| La botella vacía, rellenable | 22 € | 4,60 € | **75 %** |
| El estuche completo (1 vino + 1 vacía) | 39 € | — | — |
| Pack de 3 vinos | 69 € | 24,86 € | 56 % |

**La tesis:** esto no es un negocio de vino, es un negocio de regalo con vino
dentro. **La botella vacía es el negocio; el vino es la prensa.**

---

## RETOMAR AQUÍ

### Documentos listos para enviar
- `proveedores/correo-serigrafia.txt` — 4 decoradores de vidrio
- `proveedores/correo-vidrio.txt` — 4 vidrieros, con las dos opciones de cierre
- `proveedores/correo-bodegas.txt` — 6 bodegas de la DO Vinos de Madrid
- `proveedores/correo-cierres.txt` — corcho, cabeza de zamak y cápsulas
- `proveedores/correo-ilustrador.txt` — el arte final de las 57 piezas
- `diseno/briefing-ilustrador.md` — briefing completo que acompaña a ese correo
- `producto/inventario.md` — las 57 piezas, generado desde `web/lib/piezas.ts`

### Lo que bloquea todo — es tuyo, no mío
1. **Registrar la marca en la OEPM.** ~125 €. Único punto donde un tercero puede
   adelantarse y quedarse con el nombre. Ver `legal/checklist-legal.md`
2. **Pedir los presupuestos.** Los tres correos están escritos en
   `proveedores/`. Contactos verificados en `proveedores/contactos-proveedores.txt`
   - Serigrafía → Ibicrom, Serijerez, Todoglass, Serigrafía Portal
   - Vidrio → Juvasa, Estal, Verallia, Vidrala
   - Bodegas → Vinícola de Arganda, Jeromín, Pablo Morate
3. **Contratar ilustrador** para las 67 piezas en SVG de una tinta. 1.500-3.000 €.
   Sin arte final no hay serigrafía

### Decisiones abiertas
- **Acabado de boca**: corcho + T-cork de zamak, o cierre mecánico tipo La Casera
  para los dos productos. El mecánico es más barato, más icónico y una sola pieza,
  pero exige otro formato de botella. Se decide con los presupuestos delante
- **Consejo Regulador de Vinos de Madrid**: ¿admite cierre mecánico? Aplazado
- **Color**: ámbar es la elección. Verde antiguo es el plan B si no hay stock
- **Los medidores**: Carlos le está dando una vuelta al lagrimómetro y a la idea
  de un segundo medidor (EL GIRÓMETRO). Todas las versiones y las mejoras
  propuestas están en `producto/medidores-abierto.md`. La lámina y el Excel
  llevan la versión 2, que es la vigente hasta que él decida

### La web — revisada a fondo 26/27-ago
EN PRODUCCIÓN: https://lagrimas-de-sanchez.vercel.app
DNS (28-ago): los cuatro hosts están añadidos y VERIFICADOS en Vercel, con
los redirects 308 ya puestos hacia el apex .com. Falta lo único que no puedo
hacer yo: crear los registros en IONOS. Todo está en `dns/`:

- `dns/INSTRUCCIONES-IONOS.md` — los registros exactos, campo a campo
- `dns/vigilar.mjs` — espera a que propague y hace el último paso solo
  (cambia NEXT_PUBLIC_SITE_URL y redespliega). `--solo-mirar` para solo informar

⛔ NO cambiar los nameservers a los de Vercel. Los dos dominios tienen correo
IONOS activo (MX + SPF) y mover la zona lo tira. Es además lo que dejó huérfano
a startupsfactory.es en mayo. Solo se tocan el A de `@` y el CNAME de `www`.

`NEXT_PUBLIC_SITE_URL` apunta a propósito al `.vercel.app` hasta que propague,
para que Stripe no devuelva a los compradores a un dominio muerto.

Dos rondas de revisión multi-agente ejecutadas (dirección de arte + copy +
código + conversión, con síntesis verificada contra el código):
- Diseño: blanco/negro/amarillo #FFD400, 4 roles tipográficos, logo con la
  gota en la primera A (semilla del logotipo para el ilustrador, en
  `web/components/Marca.tsx`), banda de prelanzamiento, /estampado como
  catálogo con pictogramas y aforismos en amarillo.
- Tienda: stock arreglado (contaba mal y nunca agotaba), webhook idempotente
  con reintento, puerta de edad accesible y segura por defecto, lista de
  espera con honeypot y límite por IP (los correos llegan a jacostech@gmail.com
  — el PRIMER envío de formsubmit pide activación en ese buzón).
- SEO: sitemap, robots, favicon, tarjeta social, JSON-LD, canónicas.
- Decisiones del dueño aplicadas: tirada de 1.000 publicada, banda de
  prelanzamiento, eyebrow «Aranjuez, Madrid · Edición numerada», estuche
  «El chiste completo» + línea de regalo.
- Inventario: 57 piezas (recortado desde 78 con la hoja de Carlos del 27-ago).

Para ABRIR la tienda: claves de Stripe (cuenta Discoolverworld SL) en Vercel
+ datos fiscales en /legal + activar el correo de formsubmit + quitar la banda
de prelanzamiento en `web/components/Nav.tsx`.

### La web — 26-ago (histórico)
`web/` · Next 16 + Tailwind 4, mismas convenciones que `clients/salsa-burgers`
y `clients/discoolver/web`. `npm run dev`.

**Ocho páginas, todas estáticas y sin desbordes en móvil:**
`/` · `/botella` · `/vino` (con puerta de edad) · `/estampado` (las 67, una a
una) · `/envios` · `/legal` · `/gracias` · 404.

Sistema visual: Bodoni Moda + Barlow Condensed + IBM Plex Mono sobre la paleta
de seis. La botella va dibujada y su estampado es **texto real en el DOM**:
indexable y legible por lector de pantalla. Catálogo en `lib/catalogo.ts`
(precios en céntimos, países permitidos por producto); las 67 piezas en
`lib/piezas.ts`. Puente al SF-CMS en `scripts/fetch-cms-content.mjs` — override
de copy que nunca bloquea el build.

**Huecos de foto reservados** en `components/FotoProducto.tsx`, con la
proporción fijada para que meter la foto no mueva la maquetación. Faltan cinco:
botella vacía en la mesa (3:4), botella con vino (3:4), las tres en su estuche
(3:4), estuche abierto con las dos (4:5) y la de portada.

**La tienda funciona.** `/api/checkout` crea la sesión de Stripe Checkout con
el importe, los países y el porte decididos en el servidor; el navegador solo
manda un SKU. `/api/stripe-webhook` es el único sitio que da un pago por bueno
y manda el pedido al buzón. Control de existencias contando pagos en Stripe
(eventual, suficiente para el primer lote). Stripe Tax detrás de `STRIPE_TAX=1`.
Variables documentadas en `.env.local.example`.

**Para abrir la tienda hacen falta tres cosas:**
1. `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en Vercel. Sin ellas la web
   dice "la tienda todavía no está abierta" y no cobra nada.
2. Los datos fiscales del titular en `/legal` — marcados en rojo, **no se
   rellenan inventados**.
3. Decidir el envío internacional (ver abajo).

**Limitación conocida del envío:** Stripe Checkout enseña todas las tarifas sin
poder filtrarlas por país. Un pedido a Alemania puede elegir el porte
peninsular. El webhook lo detecta comparando importes y marca el pedido como
REVISAR ANTES DE ENVIAR. Alternativas: abrir solo España al principio, o un
checkout propio que calcule el porte tras conocer el país.

### Hecho
- Concepto, tono y arquitectura de producto
- Las 67 piezas con nombre, tratamiento e icono → `producto/inventario-67-piezas.txt`
- Estructura de la retícula: 12 bandas justificadas, 75 % de ocupación
- Modelo de costes de los dos productos → `producto/costes.md`
- Checklist legal completo → `legal/checklist-legal.md`
- Copy completo de la web → `web/copy-y-brief-web.txt`
- Briefs de diseño de producto y de web para Claude Design → `diseno/`

---

## Las tres reglas que no se tocan

**1. Ni una cara.** Toda la sátira la cargan apodos, palabras y objetos. Sin
imagen, el art. 7.6 de la LO 1/1982 no entra. Es lo que hace la marca
registrable, exportable y vendible en retail.

**2. En el vidrio solo marca y creatividad.** Ninguna mención legal, de origen,
de grado, de lote ni de DO. Todo eso vive en la contraetiqueta adhesiva. Es lo
que permite llenar la misma botella con vino de Madrid hoy y de otra DO mañana,
o venderla vacía.

**3. La home vende la botella vacía, no el vino.** Una home que vende alcohol
necesita puerta de edad y no se puede anunciar en Meta ni en Google. El vino
vive en `/vino`. Es una decisión de arquitectura con valor económico directo.

---

## Estructura

```
producto/    inventario de las 67 piezas · ficha técnica · costes
proveedores/ contactos verificados + los tres correos listos para enviar
legal/       checklist completo: marca, imagen, IIEE, etiquetado, publicidad
web/         copy completo y brief para Claude Design
diseno/      briefs, la lámina del desarrollo plano, el banco de piezas,
             y 3 mesas de trabajo .dc.html (frontal, lateral, retícula)
```

## Referencia estructural
**El Xitxarel·lo** (Penedès): palabrario catalán serigrafiado en blanco sobre
vidrio topacio, sin etiqueta, con lockup sereno en el centro. Es la densidad y
el registro a igualar: 60-80 piezas, bandas horizontales justificadas, dos
tercios de las piezas puramente tipográficas.
