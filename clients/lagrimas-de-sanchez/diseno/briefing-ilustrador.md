# Briefing de ilustrador — Lágrimas de Sánchez

**Encargo:** arte final y UNIFICACIÓN de las 57 piezas del estampado de una
botella serigrafiada. **56 de las 57 ya existen en SVG** (19-sep): no hay que
inventarlas, hay que hacerlas hermanas y dejarlas listas para pantalla.

---

## Qué es esto

Una **magnum de 150 cl en vidrio ANTICO** — Estal SM BG MG Essentia, boca
Sommelier Long — serigrafiada por completo en el propio cristal con 57 piezas:
apodos, frases y aforismos del vocabulario político español de la última
década. **Sin etiqueta frontal** — todo va horneado a 600 °C, es permanente y
apto para lavavajillas.

El antico es un oliva oscurísimo, casi negro. **La tinta es una y es blanca**;
sobre ese vidrio no hay otra opción que funcione.

Referencia estructural exacta: el vino **El Xitxarel·lo** del Penedès. Esa es la
densidad, ese es el registro: palabras e iconos en una sola tinta blanca sobre
vidrio oscuro, muy juntos, con un bloque de marca sereno en el centro.

Renders del objetivo en `diseno/renders/` (se regeneran con `generar.py`).

---

## El trabajo, en tres partes

### 1 · Redibujar limpias las 13 trazadas automáticamente
Están en `diseno/iconos/NN-nombre/` (PNG generado con IA + SVG de trazado
automático). El trazado tiene demasiados nodos y bordes sucios: hay que
**redibujar limpio, no retocar**.

### 2 · Depurar las 43 dibujadas a mano
Están en `web/public/iconos/` y son SVG de construcción geométrica, hechos
para que la web y la retícula funcionaran. Sirven de indicación exacta de QUÉ
tiene que decir cada pieza y con qué silueta, pero están dibujadas con
primitivas y se nota: hay que darles mano de dibujante. La que falta es la 54
(el lagrimómetro), pendiente de que el cliente cierre los medidores.

El inventario completo con nombre, objeto y tratamiento está en
`producto/inventario.md`, y el mapa de qué fichero es cada pieza en
`web/lib/iconos.ts`.

### 3 · Unificar el set — LO MÁS IMPORTANTE
Es lo que ninguna IA hace y por lo que se contrata a una persona:
- **Un solo grosor de trazo** en las 57 piezas.
- **Un solo tamaño óptico**: que una chirimoya y un galgo pesen lo mismo en la
  retícula aunque midan distinto.
- **Un solo SISTEMA tipográfico, que no es lo mismo que una sola tipografía.**
  Ojo aquí, porque este punto decía lo contrario y se corrigió el 20-sep: el
  estampado usa **siete registros** (condensada bold, condensada ligera, una
  didone, su cursiva, una grotesca redonda, una monoespaciada y el contorno
  hueco), y esa variedad **es el trabajo**, no un defecto de los borradores.
  Es lo que convierte una pizarra en textura, y sale de medir la referencia:
  en un palmo de su vidrio conviven nueve tratamientos distintos con una sola
  tinta. Lo que sí hay que unificar es el peso óptico, el grosor de trazo y la
  familia DENTRO de cada registro. Ver `PROPUESTA-NIVEL-XITXARELLO.md`.

---

## Especificación técnica (de serigrafía, no negociable)

| | |
|---|---|
| Formato | SVG vectorial, trazados cerrados, sin trazos abiertos |
| Tintas | **Una**, blanco. Sin degradados, sin grises, sin tramas |
| Trazo mínimo | **0,8 mm a tamaño final** — por debajo, la malla lo pierde |
| Altura de carácter mínima | 1,2 mm |
| Tamaño de pieza | 16 × 12 mm las pequeñas, hasta 90 × 30 mm las anclas |
| Prueba de fuego | Impreso a tamaño real en papel y mirado a un metro |

**La regla que decide todo:** si a 12 mm no se lee de un vistazo, la pieza no vale.

---

## Reglas de contenido (legales, no estéticas)

1. **Ni una cara, ni un retrato, ni una caricatura de persona real.** Solo
   palabras, apodos y objetos. Es lo que hace la marca registrable y vendible en
   tienda; una caricatura lo impediría todo.
2. **Ninguna marca ajena**: nada de logos de coches, ropa, hoteles o aviones.
   Objetos genéricos siempre.
3. **En el vidrio no va ninguna mención legal** — ni grado, ni lote, ni
   denominación de origen. Todo eso vive en la contraetiqueta adhesiva.
4. Cuidado con parecidos involuntarios: a la pieza CHIQUI (boca con lengua) hay
   que quitarle los dientes y acortar la lengua — como está, se acerca demasiado
   a un logo muy conocido.

---

## Los ocho tratamientos, con su reparto

El texto va **integrado en el diseño**, no debajo como un pie de foto: arqueado
sobre una silueta, en banda cruzando una forma, calado dentro de un objeto.

| Tratamiento | Cuántas | Nota |
|---|---|---|
| Palabra desnuda | ~16 | Solo tipografía. Es lo que da respiración |
| Palabra hueca (contorno) | ~6 | Aire dentro del bloque sin dejar hueco |
| Signo + palabra AL LADO | ~12 | Nunca debajo: eso es un pie de foto |
| Texto dentro del objeto | 4 | Televisor, urna, pantalla |
| Caja invertida | máx. 5 | Blanco macizo con texto calado. Repartidas, nunca dos juntas |
| Sello circular | máx. 4 | Solo nombres cortos |
| Banderín o cinta | 2-3 | Para romper la horizontalidad |
| Escala vertical | 1 | El lagrimómetro, columna entera del lateral |

---

## La composición de la botella

**Ojo, esto cambió el 19-sep con la botella definitiva.** La banda ya no es la
de una borgoña de 75 cl:

- Banda principal: **330 × 140 mm** (el cuerpo cilíndrico, 360°). Es **20 % más
  ancha y 28 % más baja** que la que figuraba antes en este briefing.
- **El hombro mide 126 mm y es cónico**: ahí no cabe banda corrida. Suben
  piezas sueltas y pequeñas, y el perímetro se cierra según suben.
- **El cuello NO se decora** (115 mm).
- 8-9 bandas horizontales justificadas en el cilindro + 3-4 piezas sueltas en
  el hombro. Ocupación ~75 %. Huecos de 1 a 3 mm. Se lee como un periódico
  maquetado, no como una nube.
- El **lockup va en la parte baja del hombro**, donde el cono ya abre y la
  superficie es casi plana.
- Halo del lockup: **130 × 88 mm libres** de tinta en el frente.
- Reserva trasera: **80 × 58 mm** para la contraetiqueta (solo versión vino).
- Zona muerta: 20 mm bajo el arranque del hombro, 15 mm sobre la base.
- Contraste de escala brutal: 3 o 4 piezas enormes por cara visible, el resto
  pequeño. Nada de gradación suave.

---

## El logotipo

`web/components/Marca.tsx` tiene la semilla y `web/public/marca/` los ficheros:
lockup en PNG, el galgo y la gota sueltos en SVG.

- La **A de LÁGRIMAS es una lágrima** con travesaño calado y su tilde encima.
- El **galgo** corona el emblema — es la misma pieza 01 del estampado.
- Encargo: refinar ambos como logotipo definitivo, con sus versiones y usos
  mínimos.

---

## Entregables

1. 57 SVG individuales, una tinta, trazo mínimo garantizado.
2. El desarrollo plano montado **sobre la geometría de la Essentia**, listo
   para el serigrafista.
3. El logotipo refinado con sus variantes.
4. Prueba impresa a tamaño real.

## Presupuesto orientativo
**1.000–2.200 €.** Bajó respecto a la horquilla anterior (1.500–3.000 €) porque
el encargo ya no incluye inventar 44 piezas desde cero: las 56 existen y lo que
se compra es oficio, unificación y arte final. Pedir a tres.
