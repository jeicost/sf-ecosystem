# Lágrimas de Sánchez

**Estado: 24 de septiembre de 2026 · botella, arte (medido e imprimible), web y
paquetes de proveedor CERRADOS · todo lo pendiente necesita la firma de Carlos**

Marca de botella de cristal serigrafiada y vino de la DO Vinos de Madrid.
Dominios en propiedad: `lagrimasdesanchez.com` y `.es`

---

## El producto en una frase

Una **magnum de 150 cl en vidrio antico** —Estal SM BG MG Essentia, boca
Sommelier Long— serigrafiada por completo en el propio cristal con **57 piezas
tipográficas** del vocabulario político español de la última década. Tinta
cerámica blanca vitrificada a 600 °C: no es una etiqueta, es parte del vidrio.
Sin etiqueta frontal. Ni una sola cara.

**Un solo SKU de vidrio, tres presentaciones:**

| | PVP hoy | Coste (magnum) | Margen |
|---|---|---|---|
| La botella vacía, rellenable | 22 € | 6,65 – 8,85 € | **51-63 %** |
| El estuche completo (1 vino + 1 vacía) | 39 € | **25,95 – 34,70 €** | ⚠️ **de 19 % a NEGATIVO** |
| Pack de 3 vinos | 69 € | 39,90 – 53,55 € | ⚠️ **6-30 %** |

⚠️ **Dos de los tres SKU pueden estar vendiéndose por debajo de coste.** El
estuche decía 32-47 % y era un error de suma: los «17-23 €» que figuraban
eran las dos botellas sin estuche ni embalaje. Sumado bien, el producto que
mejor explica la marca es el que peor está. Son estimaciones de mercado, no
presupuestos, pero la dirección es firme. Ver «Decisiones abiertas».

**La tesis:** esto no es un negocio de vino, es un negocio de regalo con vino
dentro. **La botella vacía es el negocio; el vino es la prensa.**

---

## RETOMAR AQUÍ

### Cierre de fase 24-sep — qué pasó en el sprint final
- **El arte quedó MEDIDO e imprimible**: `diseno/INFORME-IMPRIMIBILIDAD.md`
  (morfología a 2 escenarios de malla) dejó 22 piezas rotas en **8 pátinas de
  textura**, todas aprobadas a ojo. Tubería nueva en `diseno/iconos/`:
  `medir-imprimibilidad.py`, `engordar-arte.py` (elige grosor por métrica),
  `alturas_impresion.py` (única verdad de alturas). Las fuentes editables de
  piezas dibujadas viven en `diseno/iconos/piezas-fuente/`; los originales
  pre-engorde en `diseno/iconos/engordadas/`.
- **Paquetes de adjuntos por proveedor** en `proveedores/paquetes/` — cada
  correo dice qué carpeta arrastrar. La ficha de serigrafía pide EL dato que
  decide: trazo mínimo POR ESCRITO (con ≤0,5 mm el arte entra entero).
- **`diseno/hoja-contactos.pdf`** — las 67 piezas, real + ampliada, 6 páginas.
- **`legal/oepm-preparacion.md`** — expediente listo (denominativa, clases
  21+33; decidir TITULAR antes de pagar).
- **`diseno/propuestas/chiqui-decision.png`** — CHIQUI A (actual, evoca el
  logo de los Stones) contra B (beso con chispas). Decisión de una palabra.
- **Formsubmit disparado** con un registro de prueba: buscar el correo de
  confirmación en jacostech@gmail.com y hacer clic.

### Documentos listos para enviar
- `proveedores/correo-serigrafia.txt` — 4 decoradores de vidrio
- `proveedores/correo-vidrio.txt` — **a Estal**, que es de quien es la botella
- `proveedores/correo-bodegas.txt` — 6 bodegas de la DO Vinos de Madrid
- `proveedores/correo-cierres.txt` — corcho, cabeza de zamak y cápsulas
- `proveedores/correo-estuche.txt` — **NUEVO**: la segunda partida de coste
  (3.000-4.000 €) no tenía ni proveedor ni correo
- `proveedores/correo-ilustrador.txt` — el arte final de las 57 piezas
- `diseno/briefing-ilustrador.md` — briefing completo que acompaña a ese correo
- `producto/inventario.md` — las 57 piezas, generado desde `web/lib/piezas.ts`

### Lo que bloquea todo — es tuyo, no mío
1. **Registrar la marca en la OEPM.** ~125 €. Único punto donde un tercero puede
   adelantarse y quedarse con el nombre. Ver `legal/checklist-legal.md`
2. **Pedir los presupuestos.** Los tres correos están escritos en
   `proveedores/`. Contactos verificados en `proveedores/contactos-proveedores.txt`
   - Serigrafía → Ibicrom, Serijerez, Todoglass, Serigrafía Portal
   - Vidrio → **Estal** (la botella es suya; los demás ya no son alternativa)
   - Bodegas → Vinícola de Arganda, Jeromín, Pablo Morate
3. **Ilustrador — ahora OPCIONAL.** El sprint del 22-24 sep dejó el arte
   imprimible por sistema (8 pátinas documentadas en
   `diseno/LISTA-ILUSTRADOR.md`). Si la muestra física del taller sale bien,
   puede saltarse; si se contrata, es pulido fino, no rescate

### Decisiones abiertas
- **EL PRECIO — lo más urgente.** La magnum rompe el pricing: la botella vacía
  a 22 € baja del 75 % al 51-63 % de margen, y el **pack de 3 magnums a 69 € se
  queda entre el 6 % y el 30 %**, que no se sostiene. Las tres salidas, con
  números, en `producto/costes.md`. Es tuyo: nadie sube un precio por su cuenta
- **Estuche de magnum**: ninguna caja de 75 cl vale. Hay que pedirlo
- **Los medidores**: el lagrimómetro v2 está DIBUJADO y en la botella como
  columna-instrumento (pieza 54, fuente en `diseno/iconos/piezas-fuente/`).
  El GIRÓMETRO sigue siendo idea abierta en `producto/medidores-abierto.md`
- **CHIQUI A o B**: ver `diseno/propuestas/chiqui-decision.png`

### La botella — CERRADA 19-sep
**Estal SM BG MG ESSENTIA, Sommelier Long, 150 cl, color ANTICO.** Se acabó el
«formato por decidir»: es una referencia de catálogo con plano del fabricante.
900 g · 380,9 mm de alto · ø105 (perímetro 330) · boca interior 18,5 · cuello
de 32 y 115 mm · punt de 30. Ficha completa en `producto/ficha-tecnica.md`.

Esto cierra dos decisiones que llevaban abiertas desde agosto: el **acabado de
boca** (es de corcho, luego **el cierre mecánico de estribo queda descartado** —
exigiría otra botella) y con él la consulta al Consejo Regulador, que ya no
procede. Y abre una: **el precio** (ver arriba).

La botella dibujada de la web ya va a escala del plano (830 px = 380,9 mm), en
antico y con la tinta blanca fija, no heredada del tema. Renders de producto en
`diseno/renders/`, regenerables con `python3 generar.py` — capturan la web de
verdad (ruta interna `/render`, en noindex), así que no pueden quedarse viejos
cuando cambie una pieza.

El **desarrollo plano** (`diseno/desarrollo-plano.svg`, se regenera con
`node generar-desarrollo.mjs`) ya está montado sobre esta geometría: 9 bandas
en el cilindro de 330 × 140 y el lockup subido al hombro, porque un halo de
84 mm se comía el 60 % de una banda de 140. Las 56 piezas colocadas, ninguna
sin arte.

**Dos cosas que salieron de rehacerlo y conviene no perder:**
- Dos iconos tenían `letter-spacing` duplicado y **dejaban la lámina entera en
  blanco** — un SVG mal formado no falla, se descarta en silencio. El generador
  ahora valida antes de dar la lámina por buena.
- Los iconos venían con el dibujo pequeño dentro de una caja cuadrada: entre un
  40 % y un 75 % de aire muerto, que en la retícula ocupa sitio con nada. Se
  ciñeron todos con `diseno/iconos/ajustar-viewbox.py` (mide el dibujo real en
  el navegador, con las fuentes cargadas). **La regla que queda: el icono viene
  ceñido y el aire lo pone quien maqueta.**

### El arte — CERRADO y VERIFICADO 20-sep

Las 56 piezas con arte están **vectorizadas** (`diseno/iconos/vectorizar.mjs`):
ni una depende ya de que haya una fuente instalada, que es requisito del
taller y además arregló un fallo que llevaba días —los SVG cargados con `<img>`
no pueden descargar fuentes, así que el navegador los pintaba con Arial Narrow
y las frases largas salían cortadas.

El flujo completo, en orden, y **hay que ejecutarlo entero**:

```
cd diseno/iconos
python3 componer-texto.py      # las 24 de solo texto, 10 tratamientos
python3 componer-signos.py     # los pictogramas como signos + 10 remates
node    vectorizar.mjs         # el texto pasa a trazados
python3 ajustar-viewbox.py     # cada pieza ceñida a su dibujo
python3 normalizar-trazo.py    # el grosor, igual en MILÍMETROS IMPRESOS
python3 verificar-arte.py      # la puerta: falla si algo no imprime
```

`verificar-arte.py` es la red de seguridad y conviene pasarla siempre: comprueba
trazo mínimo de 0,8 mm, que no quede texto sin vectorizar y que ningún trazado
lleve `NaN`. Las tres cosas habían pasado desapercibidas porque **ninguna se ve
en pantalla**: un SVG con `NaN` se dibuja a medias en silencio, y un trazo de
0,1 mm se ve perfecto en un monitor y no existe sobre el vidrio.

Lo que encontró una auditoría de dirección de arte y está corregido: el
«grosor único» iba de 0,10 a 1,87 mm (19 piezas por debajo del mínimo), la
mitad de los pictogramas llevaba la palabra a la mitad de tamaño que la otra
mitad, los remates pesaban más que el contenido, y el hombro tenía piezas a
3,6 mm. Hoy: trazo de 1,0 mm en todo el set, 0,8 en los remates, un solo
cuerpo de palabra y el hombro limpio.

### Iconos — CERRADOS 19-sep
Las 56 de las 57 piezas tienen ya su arte en la web (`web/public/iconos/` +
mapa en `web/lib/iconos.ts`): 13 generadas con IA (Mystic→potrace), 24 de solo
texto compuestas en vector, y **20 dibujadas a mano en SVG el 19-sep** — la
cola de IA seguía sin créditos (402 en api.magnific.com y api.freepik.com) y
se cerró con SVG autoral en el mismo lenguaje: silueta maciza `#F6F1E6`,
detalle en negativo, margen generoso. Incluye 4 piezas que nunca entraron en
la cola (Oscargután, Javierito, Rufián «s. m.», Edición nº). Los prompts de
`diseno/iconos/cola.json` se conservan por si se quiere regenerar con IA.
La única sin icono es la 54 (Lagrimómetro): los medidores siguen siendo
decisión abierta tuya (`producto/medidores-abierto.md`). Recuerda: esto vale
para web y retícula; el arte final de serigrafía lo cierra el ilustrador.

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
- Inventario: **57 piezas**. La cifra fue 78 → 67 → 57. La ÚNICA fuente válida
  es `web/lib/piezas.ts` (`PIEZAS.length`); `producto/inventario.md` se genera
  desde ahí. Si vuelve a cambiar, hay que barrer también README, brand-brain.json,
  copy-web-y-brief.txt, producto/ y proveedores/ — el 67 se quedó pegado en nueve
  ficheros, dos de ellos correos que iban a salir hacia proveedores.

Para ABRIR la tienda: claves de Stripe (cuenta Discoolverworld SL) en Vercel
+ datos fiscales en /legal + activar el correo de formsubmit + quitar la banda
de prelanzamiento en `web/components/Nav.tsx`.

### La web — 26-ago (histórico)
`web/` · Next 16 + Tailwind 4, mismas convenciones que `clients/salsa-burgers`
y `clients/discoolver/web`. `npm run dev`.

**Ocho páginas, todas estáticas y sin desbordes en móvil:**
`/` · `/botella` · `/vino` (con puerta de edad) · `/estampado` (las 57, una a
una) · `/envios` · `/legal` · `/gracias` · 404.

Sistema visual: Bodoni Moda + Barlow Condensed + IBM Plex Mono sobre la paleta
de seis. La botella va dibujada y su estampado es **texto real en el DOM**:
indexable y legible por lector de pantalla. Catálogo en `lib/catalogo.ts`
(precios en céntimos, países permitidos por producto); las 57 piezas en
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
- Las 57 piezas con nombre, tratamiento e icono → `producto/inventario.md`
- Estructura de la retícula: 9 bandas justificadas, 75 % de ocupación
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
producto/    inventario de las 57 piezas · ficha técnica · costes
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

## ⚠️ DECISIÓN ABIERTA — el repositorio es público (30-ago-2026)

`jeicost/sf-ecosystem` está en PÚBLICO. Verificado a mano, no supuesto:

    curl https://raw.githubusercontent.com/jeicost/sf-ecosystem/main/\
      clients/lagrimas-de-sanchez/producto/costes.md          → HTTP 200

Cualquiera lee sin autenticarse el margen del 75 % (botella vacía) y del 56 %
(vino), las cinco cartas de negociación sin enviar y la lista de proveedores a
los que se les va a pedir precio. Un proveedor puede ver el margen del comprador
antes de responder al presupuesto. Afecta igual a discoolver, salsa-burgers,
nc-global-assets, adrian-grooves, dadybox, lidar-home y startup-factory.

**NO hay credenciales filtradas.** Comprobado: ni claves de Stripe, ni de
Supabase, ni tokens. Lo que aparece en `.claude/settings.json` es un comando que
LEE un token, no el token. El riesgo es comercial, no de accesos.

Se le planteó a Carlos el 28-ago y **no lo decidió**. Queda abierto.

La opción recomendada es una línea, reversible:

    gh repo edit jeicost/sf-ecosystem --visibility private \
      --accept-visibility-change-consequences

Comprobado antes de proponerla: los 8 proyectos de Vercel que despliegan desde
este repo usan la GitHub App, que funciona igual con repos privados. Nada en el
código depende de URLs públicas del repo. No se rompe ningún despliegue.

Si tuviera que seguir público, entonces no basta con borrar los ficheros en un
commit nuevo: los SHA antiguos siguen sirviéndose. Habría que purgar con
`git filter-repo`, force-push, y abrir ticket a GitHub Support.
