# Lista de trabajo del ilustrador — 23-sep-2026 (v2, tras el sprint de arte)

Acompaña a `INFORME-IMPRIMIBILIDAD.md` (la medición, dos escenarios de malla)
y al presupuesto de unificación (1.000–2.200 €). **La v1 de esta lista tenía
22 piezas rotas; quedan 8**, todas de la misma clase: textura fina que la
malla se come (puntadas, semillas, rayados de plumilla, calados de rotulito).
El resto se arregló en el propio sistema:

- **Engorde medido** (`iconos/engordar-arte.py`): a los rellenos de potrace
  se les eligió un trazo del color de la tinta PROBANDO grosores contra la
  métrica y mirando después la pieza (charo, tucán, catedrática, pili,
  portero, gracita, galgo, chepas, niña, chiqui, bulos, felpudo, oscargután,
  javierito, fango, caballito, marlaskona, el-puto-amo). Los rótulos van
  protegidos y agrandados ×1.4–1.5.
- **Cirugías**: cajera reconstruida (código de barras imprimible), urna del
  pucherazo con banda a todo lo ancho, sello EDICIÓN Nº simplificado,
  huevas del caviar 8→5 más gordas, pantalla del telepedro crecida,
  CONTIENE LÁGRIMAS ×1.42, HERMANÍSIMO de sello→hueca, lagrimómetro con
  etiquetas al doble, cabezas del Peugeot con aire.
- **Sistema**: interlínea consciente de tildes; talla exacta de 0,28 mm en
  el texto calado (el mínimo ciego soldaba FACHA); cuerpos de acompañamiento
  de las cifras de píxel subidos; `class` sobrevive a la vectorización.

## Lo que queda (8), con su número medido a malla fina

Todas están APROBADAS visualmente en pantalla; el trabajo es decidir si la
degradación al imprimir se asume como pátina o se redibuja el detalle.

1. **08-gracita-bolanos** — 12 % de tinta fina, 15 puntadas que desaparecen.
   O delantal en línea única o asumir que las puntadas se van.
2. **09-el-portero** — 19 % fina (el jersey rayado pierde el rayado).
3. **06-la-nina-de-la-curva** — 29 % fina: el rotulado del triángulo pierde
   arañazos; la señal y el texto sobreviven.
4. **36-telepedro** — 32 % fina a 11 mm: la palabra dentro de la pantalla
   queda al límite; si el taller no baja de 0,5 mm, sacar el rótulo fuera.
5. **43-izquierda-caviar** — 19 % fina (bordes del mango y brillos).
6. **03-chirimoyas** — semillas interiores se empastan (14 %): o menos
   semillas más gordas o fruta lisa con la banda.
7. **t-al-menos-no-gobierna-la-ultraderecha** y **t-alma-socialista** — a
   5,5–6 mm en el hombro el calado de 3 líneas rellena ojales (estencil).
   Legibles pero duros; la alternativa es subirlas de fila o a 2 líneas.

## Decisiones del dueño (no del ilustrador)

- **04-chiqui**: la boca con lengua evoca el logo de los Rolling Stones
  (marca de Musidor BV). Decidir si se aleja el dibujo o se asume.
- **Escenario de malla**: con <0,5 mm garantizado por escrito del taller
  (pregunta 7 del correo), las 8 de arriba se quedan en pátina admisible.

## Reglas para tocar piezas (aprendidas a golpes)

- Los `t-*` NUNCA se editan a mano: se regeneran (`iconos/componer-texto.py`).
- Las fuentes editables de piezas dibujadas viven en `iconos/piezas-fuente/`.
- Los originales pre-engorde están en `iconos/engordadas/*.original.svg`.
- Después de tocar CUALQUIER pieza: `ajustar-viewbox.py` → `normalizar-trazo.py`
  → `verificar-arte.py` → `medir-imprimibilidad.py`, y mirar la pieza al
  tamaño del swatch. Los trazos `class="engorde"` y `class="talla"` los
  gobierna su herramienta, no el mínimo global.
