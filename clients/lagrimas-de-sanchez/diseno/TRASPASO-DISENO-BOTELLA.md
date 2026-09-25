# Traspaso — diseño de la botella · Lágrimas de Sánchez

**Para quien no ha estado en esto.** Estado a 25 de septiembre de 2026, último
commit `5e125c25`. Todo lo que dice este documento está verificado contra el
repositorio; las cifras salen de los informes generados, no de memoria.

---

## 1. Qué es el producto

Una **magnum de 150 cl en vidrio antico** serigrafiada por completo en el
propio cristal con **57 piezas tipográficas** de sátira política española.
Sin etiqueta frontal: todo el grafismo, marca incluida, va horneado en el
vidrio a 600 °C.

Se vende en tres presentaciones, pero **el producto es uno**: el mismo vidrio
decorado, vacío (rellenable, es el de margen) o lleno de tinto de la DO Vinos
de Madrid.

### El envase, cerrado y no negociable

Estal **SM BG MG ESSENTIA**, acabado de boca *Sommelier Long*, color ANTICO.
Es modelo registrado de Estal: **no lo tiene ningún otro proveedor** y la gama
solo existe en 150 cl.

| Dato | Valor |
|---|---|
| Altura total | 380,9 mm |
| Cuerpo cilíndrico | ø105 mm → **perímetro 329,9 mm** × 140 mm de alto |
| Hombro | 125,9 mm, **cónico** |
| Cuello | ø32 mm × 115 mm — **no se decora** |
| Peso vacía | 900 g |
| Punt (culo hundido) | 30 mm |

Ficha completa con fuentes: `producto/ficha-tecnica.md`.

### La decoración

- **Serigrafía cerámica vitrificada, UNA tinta y BLANCA** (`#F6F1E6` como
  referencia de pantalla; la equivalencia cerámica la propone el taller).
- **Sobre vidrio oliva casi negro.** Lo importante de esto: **no existe el
  oscuro.** Lo oscuro es tinta ausente. No hay placas de color, no hay grises,
  no hay segundo tono. Un elemento «negro» dibujado es un agujero en la tinta,
  y se hace con `fill-rule="evenodd"` o con máscara — nunca pintando un color
  oscuro encima, porque ese color no se imprime (ya pasó: un candado se dibujó
  con trazo `#2E3320` y en el vidrio habría salido un boquete).
- Zona de reserva: **80 × 58 mm** en la trasera, para la contraetiqueta
  adhesiva con los datos que cambian por lote.
- La botella se vende también vacía como rellenable: **la decoración debe
  aguantar lavavajillas.**

---

## 2. Las tres reglas que no se tocan

Cada una salió de un problema real y ninguna es estética:

1. **Ni una sola cara.** El art. 7.6 LO 1/1982 hace intromisión ilegítima el
   uso comercial de nombre o imagen, y el Supremo entiende que la excepción de
   caricatura del 8.2.b no ampara la explotación comercial. Por eso el
   vocabulario son apodos, palabras y objetos. Una pieza que «se lee como una
   cara» hay que rehacerla — pasó con CHARO y se corrigió a gafas.
2. **En el vidrio solo marca y creatividad.** Ninguna mención legal, de
   origen, de grado, de lote ni de DO: todo eso va en la contraetiqueta. Si se
   serigrafía el grado, las 1.000 botellas quedan casadas con un solo llenado.
3. **Trazo mínimo real.** Ver el apartado 5. Un dibujo precioso que no
   transfiere no es un dibujo.

Riesgo abierto conocido: la pieza **04-chiqui** (boca con lengua fuera) evoca
el logo de los Rolling Stones, marca de Musidor BV. Hay una alternativa
dibujada en `diseno/propuestas/04-chiqui-B.svg` y una comparativa en
`chiqui-decision.png`. **Es decisión del dueño, no del diseñador.**

---

## 3. Dónde está cada cosa

```
clients/lagrimas-de-sanchez/
├── README.md                     ← el punto de reentrada, léelo primero
├── diseno/
│   ├── referencias/              ← EL REGISTRO A IGUALAR (ver apartado 4)
│   │   ├── xixarel-2.png         ← la trasera: la foto que gobierna todo
│   │   └── xixarel.png
│   ├── iconos/                   ← LA TUBERÍA DE ARTE (apartado 5)
│   │   ├── componer-texto.py     ← genera las 24 piezas de frase
│   │   ├── componer-signos.py    ← genera los 10 remates
│   │   ├── vectorizar.mjs        ← convierte <text> en trazados
│   │   ├── ajustar-viewbox.py    ← ciñe cada pieza a su dibujo
│   │   ├── normalizar-trazo.py   ← sube al mínimo impreso
│   │   ├── engordar-arte.py      ← engorda rellenos midiendo (apartado 6)
│   │   ├── verificar-arte.py     ← PUERTA: falla si algo no imprime
│   │   ├── medir-imprimibilidad.py ← mide qué sobrevive a la malla
│   │   ├── exportar-proporciones.py
│   │   ├── alturas_impresion.py  ← lee las alturas medidas
│   │   └── piezas-fuente/        ← fuentes EDITABLES de las piezas dibujadas
│   ├── generar-desarrollo.mjs    ← monta la lámina 360º del taller
│   ├── desarrollo-plano.svg/.png ← lo que ve el serigrafista
│   ├── alturas-impresion.json    ← generado: mm reales de cada pieza
│   ├── INFORME-IMPRIMIBILIDAD.md ← generado: medición, 2 escenarios
│   ├── LISTA-ILUSTRADOR.md       ← el encargo pendiente, curado
│   ├── hoja-contactos.pdf        ← las 67 piezas, real + ampliada
│   ├── PROPUESTA-NIVEL-XITXARELLO.md ← el estudio del registro
│   └── renders/                  ← capturan la web, no se dibujan aparte
├── producto/   ficha-tecnica · costes · inventario · medidores-abierto
├── legal/      checklist-legal · oepm-preparacion
├── proveedores/ 6 correos listos + paquetes/ de adjuntos por proveedor
└── web/        Next.js; la botella vive en components/Botella.tsx
```

**Las piezas de arte están en `web/public/iconos/` (67 ficheros SVG).** Es
copia de trabajo: **nunca se editan a mano.** Ver apartado 5.

---

## 4. El registro a igualar

La referencia es **El Xitxarel·lo** (Penedès). Las fotos están en
`diseno/referencias/`. Lo que se ha destilado de mirarlas, y que hay que
respetar:

- **La textura la hace la VARIEDAD, no la densidad.** En un palmo de su vidrio
  conviven nueve maneras distintas de poner una palabra: hueca, calada, dentro
  del objeto, al lado, sello, píxeles, cursiva, redonda, banderín. Una sola
  tipografía repetida sesenta veces se aplana por mucho que la aprietes.
- **Cada frase lleva dibujo.** No hay piezas de solo texto: barco sobre
  FILIBUSTER, percha sobre PENJAT, la palabra dentro de una cabeza, tijeras al
  lado. El texto y el pictograma son una sola pieza.
- **No hay placas macizas.** Las masas blancas de la referencia son ICONOS.
  Una caja rellena con texto calado dentro se lee como una etiqueta pegada.
- **Un instrumento vertical es la estructura.** Su TROMPÍMETRE recorre el
  estampado entero y ordena dos columnas de piezas a sus lados. No es un
  adorno en el medio.
- **Las piezas se cortan por los cantos.** Es lo que cuenta que el cilindro da
  la vuelta. Corta pictogramas y códigos, nunca un chiste de texto: un código
  de barras cortado es la vuelta; «HERMANÍSIMO» sin el HER es una errata.
- **Solo se ve un tercio.** Un cilindro de ø105 enseña ~40 % de su perímetro.
  En su foto se cuentan unas treinta piezas, no las que tiene la botella. Por
  eso allí cada pieza es grande.

---

## 5. Cómo funciona el sistema de arte (esto es lo importante)

### La regla de oro

**Las piezas de `web/public/iconos/` son salida, no fuente.** Editarlas a mano
se pierde en el siguiente pase. Las fuentes son:

| Tipo | Cuántas | Fuente real |
|---|---|---|
| Frases (`t-*`) | 24 | `diseno/iconos/componer-texto.py` (tabla `PIEZAS` + `DIBUJOS_POR_PIEZA`) |
| Remates (`r-*`) | 10 | `diseno/iconos/componer-signos.py` |
| Dibujadas a mano | 2 | `diseno/iconos/piezas-fuente/*.svg` |
| Arte calcado (01–13 y otras) | 31 | El propio SVG en `public/iconos/` **es** la fuente; el original pre-engorde está en `diseno/iconos/engordadas/*.original.svg` |

### La tubería, en orden y entera

```bash
cd diseno/iconos
python3 componer-texto.py        # frases → SVG con <text> vivo
python3 componer-signos.py       # remates
node    vectorizar.mjs           # <text> → trazados (obligatorio, ver trampas)
python3 ajustar-viewbox.py       # ciñe cada pieza a su dibujo
cd ..    && node generar-desarrollo.mjs   # ← MONTA Y MIDE: escribe alturas-impresion.json
cd iconos
python3 normalizar-trazo.py      # sube trazos al mínimo impreso real
python3 verificar-arte.py        # PUERTA: 0 fallos o no se manda nada
python3 exportar-proporciones.py # web/lib/proporciones.ts (lo usa el empaquetador)
python3 medir-imprimibilidad.py  # informe de qué sobrevive a la malla
cd ..    && node generar-desarrollo.mjs   # segunda vuelta: alturas ya estables
```

**Por qué `generar-desarrollo.mjs` va en medio:** desde que la lámina empaqueta
en filas justificadas con autoajuste, la altura a la que se imprime una pieza
depende de toda la cola. El generador es quien lo decide, así que **exporta las
alturas medidas** a `alturas-impresion.json` y las leen `normalizar-trazo.py`,
`verificar-arte.py` y `medir-imprimibilidad.py`. Antes había una tabla escrita
a mano que asumía 17,4 mm donde el plano imprimía 11: todo salía un 60 % más
fino de lo prometido. Al leer las medidas de verdad, las piezas rotas bajaron
de 13 a 6.

### Las trampas que ya han mordido (no las repitas)

- **Un SVG cargado con `<img>` no puede descargar fuentes.** Es un documento
  aislado. Por eso todo el texto va vectorizado — y además ningún taller acepta
  texto vivo, porque su RIP tampoco tiene la fuente.
- **opentype.js tiene tres trampas silenciosas**: la opción `letterSpacing`
  mete `NaN` en el trazado; su `toPathData()` mete más NaN aunque los comandos
  de origen sean válidos (hay que serializar `path.commands` a mano); y
  concatenar glifos en un solo `d` hace que unos contornos anulen a otros por
  la regla de relleno (un `<path>` por glifo). **Un `NaN` dentro de `d` no da
  error**: el navegador dibuja hasta ahí y descarta el resto.
- **Un SVG mal formado sale EN BLANCO, no falla.** Dos atributos duplicados en
  una etiqueta y el navegador descarta el fichero entero en silencio.
- **Las máscaras necesitan región explícita** (`maskUnits="userSpaceOnUse"` con
  `x`/`y`/`width`/`height`). Sin ella el valor por defecto es ±10 % del
  viewport, y al ceñir el viewBox la pieza desaparece entera.
- **`vectorizar.mjs` conserva `class`**: los marcadores `class="talla"` y
  `class="engorde"` le dicen a `normalizar-trazo.py` qué trazos gobierna otra
  herramienta y no debe tocar. Si se pierden, el mínimo ciego suelda el texto
  calado (FACHA salía como un bloque negro).
- **Una fuente variable vectoriza el máster por defecto.** opentype.js no
  instancia ejes `fvar`: pedir peso 800 con un `.ttf` variable da Regular. Hay
  que instanciar antes (`fontTools.varLib.instancer`).
- **`ajustar-viewbox.py` también EXPANDE.** Si el contenido se sale de la caja,
  la «ganancia» sale negativa y antes pasaba el umbral en silencio, cortando
  rótulos («E LA CURVA»).

---

## 6. Imprimibilidad: cómo se mide y qué falta

`medir-imprimibilidad.py` rasteriza cada pieza a su altura real de impresión
(40 px/mm) y le aplica morfología en **dos escenarios**:

- **Estricto, 0,8 mm** — la garantía conservadora.
- **Malla fina, 0,35 mm** — lo habitual en tinta vitrificable sobre vidrio con
  malla de 120–140 hilos.

Mide tres cosas: **tinta fina** (% más fino que el mínimo, no transfiere),
**calado cerrado por hueco entero**, ponderado por su **impacto** sobre la
tinta de la pieza (distingue el ojal de un rotulito del calado que lleva el
chiste), e **islas muertas** con área mínima (elementos sueltos que
desaparecen enteros).

### Estado medido hoy

De 67 piezas: **18 ✓ limpias · 18 △ con riesgo solo en el escenario estricto ·
25 ⚠️ que dependen de confirmar la malla fina · 6 ⛔ rotas en ambos**.

Las 6 rotas, todas por la misma causa (textura fina o calado que la malla se
come; **están aprobadas visualmente en pantalla**, el debate es si la
degradación al imprimir se asume como pátina o se redibuja el detalle):

`t-al-menos-no-gobierna-la-ultraderecha` · `t-el-pueblo-primero-despues-de-mi`
· `t-ecologetas` · `t-son-las-5-y-no-he-comido` · `06-la-nina-de-la-curva` ·
`43-izquierda-caviar`

**El dato que decide la mitad de esta lista no es de diseño: es del taller.**
Si garantiza por escrito trazo mínimo ≤0,5 mm, las 25 ⚠️ dejan de ser
problema. Es la pregunta 7 de `proveedores/correo-serigrafia.txt`.

### La herramienta que quizá no conozcas

`engordar-arte.py` engorda el arte de línea aplicando un trazo **del mismo
color del relleno** a sus paths. Conserva cada curva del dibujo y es lo que la
ganancia de tinta hace en la malla, solo que a nuestro favor. El grosor **no
se elige a ojo**: prueba nueve candidatos y mide cada uno con la misma
morfología del informe. Rescató 18 piezas (Charo pasó de perder el 30 % de su
tinta a 0 %; Gracita de 97 % a 12 %).

Tres cosas que aprendió a golpes y están en su código:

- potrace voltea el eje Y (`scale(0.1,-0.1)`): leer la `d` para localizar el
  rótulo protege el dibujo y suelda el nombre. **La caja se mide renderizada.**
- `stroke="none"` **no** es tener trazo. Tratarlo como tal dejaba media tanda
  sin probar.
- El engorde sirve al dibujo y **mata los rótulos**: van protegidos y
  agrandados ×1,4–1,5, con una guardia medida que descarta el cambio si
  empeora.

---

## 7. La composición: qué hace el empaquetador

La botella de la web (`web/components/Botella.tsx`) **no tiene la composición
escrita a mano**. Tiene un empaquetador de galería justificada:

```
alto_de_fila = (ancho_disponible − huecos) / suma_de_proporciones
```

- Las proporciones reales salen de `web/lib/proporciones.ts` (generado).
- El ancho disponible se mide en la **Bézier del hombro** a la altura de cada
  fila: arriba caben tres piezas, abajo siete, como en el vidrio.
- Las filas **fluyen alrededor del carril del lagrimómetro**, que cruza la
  botella entera (y=436→800) y ordena dos columnas de 78 px.
- El alto ideal **se autoajusta** hasta que el tejido toca el talón. No hay
  número mágico que mantener.
- Un **ritmo fijo** de alturas da el contraste de escala de la referencia
  (nunca aleatorio: el render debe repetirse build tras build).
- **La última fila no se justifica** (si no, la pieza que sobra sale de
  cartel).
- Los remates entran con la **mitad de peso**: son argamasa, no contenido.

**La botella dibujada pinta la CARA FRONTAL**, no el inventario: 46 piezas +
9 remates, al tamaño de la referencia, con las de los costados cortadas por el
canto. Las 57 están enteras en el inventario, en `/estampado` y en el
desarrollo plano. Estas diez no salen hoy en la cara frontal y es una decisión
reversible de una línea:

`3` · `8` · `15` · `19` · `27` · `28` · `38` · `44` · `46` · `53`

**Una pieza-columna manda sobre su propio dibujo.** El lagrimómetro tuvo que
redibujarse tres veces hasta dar con la proporción del trompímetre (0,150
frente a su 0,153). El nombre en vertical al costado la ensanchaba un 40 %: el
ancho de una pieza que cruza la botella es espacio que le quitas a todo lo
demás. Acabó con el nombre horizontal sobre el dial, como la referencia.

---

## 8. Qué está cerrado y qué está abierto

### Cerrado — no reabrir sin motivo nuevo

- El envase (referencia, color, medidas) y todo lo que de él se deriva.
- La tinta: una, blanca.
- Las tres reglas del apartado 2.
- El inventario de 57 piezas y sus textos.
- El sistema de arte: tubería, puertas, empaquetador.
- La estructura de composición: instrumento vertical + dos columnas.

### Abierto — esto es el encargo

1. **Las 6 piezas rotas** del apartado 6: decidir pátina o redibujo, y
   ejecutarlo. `LISTA-ILUSTRADOR.md` tiene el detalle por pieza.
2. **Elevar el oficio pieza a pieza.** El sistema garantiza que imprimen y que
   componen; no garantiza que estén bien dibujadas. La referencia tiene un
   nivel de mano (banderines, sellos, rotulación) que las nuestras aún no
   alcanzan en todos los casos. `hoja-contactos.pdf` es la hoja de revisión.
3. **Variedad de tratamiento.** Se han implementado nueve, pero el reparto
   puede afinarse: hay zonas del estampado donde dos piezas del mismo registro
   caen cerca.
4. **La cara frontal**: qué diez piezas se quedan fuera es una decisión
   editorial, no técnica.
5. **CHIQUI A o B** — decisión del dueño.

### Bloqueado por el dueño, no por diseño

Precio (hay SKU en margen negativo, ver `producto/costes.md`), claves de
Stripe, registros DNS, envío de los correos a proveedores, muestra física y
presentación en la OEPM. **Nada de esto lo desbloquea un diseñador.**

---

## 9. Cómo verificar cualquier cambio

Un cambio de arte no está hecho hasta que pasa esto:

1. `python3 verificar-arte.py` → **0 fallos**. Es puerta, no aviso.
2. `python3 medir-imprimibilidad.py` → el recuento de ⛔ no debe subir.
3. **Mirar la pieza al tamaño del swatch**, no solo ampliada. Media docena de
   fallos de este proyecto eran invisibles ampliados y evidentes a 8 mm.
4. `npm run build` en `web/` y mirar la botella entera, no la pieza suelta.
5. `node generar-desarrollo.mjs` y mirar la lámina: los dos soportes tienen
   que contar la misma historia.
6. Si cambia cualquier pieza, **subir `VERSION_ARTE`** en `web/lib/iconos.ts`:
   los iconos se sirven con `Cache-Control: immutable` y la tubería los
   regenera con el mismo nombre.

Y una regla de método que este proyecto se ganó a pulso: **la métrica no
sustituye al ojo, y el ojo no sustituye a la métrica.** Hubo piezas que la
medición daba por buenas y estaban soldadas, y piezas marcadas como rotas que
al mirarlas eran textura aceptable. Se usan las dos, siempre, en ese orden.
