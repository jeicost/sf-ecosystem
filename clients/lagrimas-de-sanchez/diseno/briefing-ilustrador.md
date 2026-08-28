# Briefing de ilustrador — Lágrimas de Sánchez

**Encargo:** arte final de las 57 piezas del estampado de una botella serigrafiada,
más la unificación del set. Hay 13 borradores generados con IA que sirven de
punto de partida y de referencia de composición.

---

## Qué es esto

Una botella borgoña de 750 ml en vidrio ámbar, serigrafiada por completo en el
propio cristal con 57 piezas: apodos, frases y aforismos del vocabulario
político español de la última década. **Sin etiqueta frontal** — todo va
horneado a 600 °C, es permanente y apto para lavavajillas.

Referencia estructural exacta: el vino **El Xitxarel·lo** del Penedès. Esa es la
densidad, ese es el registro: palabras e iconos en una sola tinta blanca sobre
ámbar, muy juntos, con un bloque de marca sereno en el centro.

---

## El trabajo, en tres partes

### 1 · Vectorizar y limpiar las 13 existentes
Los borradores están en `diseno/iconos/NN-nombre/` (PNG generado + SVG trazado
automáticamente). El trazado automático tiene demasiados nodos y bordes sucios:
hay que redibujar limpio, no retocar.

### 2 · Dibujar las 44 restantes
Inventario completo con nombre, objeto y tratamiento en `producto/inventario.md`.

### 3 · Unificar el set — LO MÁS IMPORTANTE
Es lo que ninguna IA hace y por lo que se contrata a una persona:
- **Un solo grosor de trazo** en las 57 piezas.
- **Un solo tamaño óptico**: que una chirimoya y un galgo pesen lo mismo en la
  retícula aunque midan distinto.
- **Una sola tipografía** para todas las palabras integradas. Los borradores
  llevan letras distintas porque las generó un modelo; eso hay que rehacerlo
  entero con una condensada de palo, peso 700, mayúsculas.

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

## Los siete tratamientos, con su reparto

El texto va **integrado en el diseño**, no debajo como un pie de foto: arqueado
sobre una silueta, en banda cruzando una forma, calado dentro de un objeto.

| Tratamiento | Cuántas | Nota |
|---|---|---|
| Palabra desnuda | ~26 | Solo tipografía. Es lo que da respiración |
| Silueta + palabra integrada | ~18 | Un solo objeto por pieza |
| Texto dentro del objeto | 4 | Televisor, urna, pantalla |
| Caja invertida | máx. 5 | Blanco macizo con texto calado. Repartidas, nunca dos juntas |
| Sello circular | máx. 4 | Solo nombres cortos |
| Banderín o cinta | 2-3 | Para romper la horizontalidad |
| Escala vertical | 1 | El lagrimómetro, columna entera del lateral |

---

## La composición de la botella

- Banda desarrollada: **275 × 195 mm**, de la base al arranque del hombro.
- **El cuello NO se decora.**
- 12 bandas horizontales justificadas de lado a lado. Ocupación ~75 %.
  Huecos de 1 a 3 mm. Se lee como un periódico maquetado, no como una nube.
- Halo del lockup: **130 × 88 mm libres** de tinta en el frente.
- Reserva trasera: **80 × 58 mm** para la contraetiqueta (solo versión vino).
- Zona muerta: 20 mm bajo el labio, 7 mm sobre la base.
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
2. El desarrollo plano montado, listo para el serigrafista.
3. El logotipo refinado con sus variantes.
4. Prueba impresa a tamaño real.

## Presupuesto orientativo
1.500–3.000 € por el set completo. Pedir a tres.
