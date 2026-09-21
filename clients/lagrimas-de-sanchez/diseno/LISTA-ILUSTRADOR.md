# Lista de trabajo del ilustrador — 22-sep-2026

Este documento acompaña a `INFORME-IMPRIMIBILIDAD.md` (la medición) y al
presupuesto de unificación (1.000–2.200 €). Sale de una auditoría visual de
las 67 piezas **verificada después contra medición morfológica** a la altura
real de impresión de cada pieza — lo que la auditoría estimó y la medición
desmintió no está aquí.

## Contexto que el ilustrador necesita

- Serigrafía cerámica, UNA tinta blanca `#F6F1E6` sobre vidrio oliva casi
  negro. **No existe el oscuro**: lo oscuro es tinta ausente (calado).
- Dos escenarios de trazo mínimo: 0,8 mm (garantía conservadora) y 0,35 mm
  (malla fina, pendiente de confirmar por escrito con el taller — pregunta 7
  de `proveedores/correo-serigrafia.txt`). El informe da cada pieza en ambos.
- Las alturas de impresión son las del `desarrollo-plano.svg` (bandas de
  11–17 mm, hombro 5,5–7 mm, lagrimómetro 84 mm). Si una pieza no cabe en su
  altura, la conversación es de COMPOSICIÓN, no de dibujo.
- Las piezas 01–13 (arte de IA calcado) son **el registro de calidad del
  set** por decisión del dueño: se afinan, no se rehacen en otro estilo.

## Bloque A — roto en cualquier malla (medido)

Física: texto micro-calado o línea de pluma que no llega a 0,35 mm.

1. **11-la-cajera** — el código de barras entero está bajo mínimos en ambos
   sentidos (barras Y huecos). Menos barras, más anchas; el dígito con trazo
   espurio del final («2665ł») se regenera.
2. **09-el-portero** — cuerpo en contorno de pluma (~0,1 mm) y cruce de
   brazos sin resolver. Pasar el cuerpo a masa con calados anchos, al estilo
   de la cabeza.
3. **08-gracita-bolanos** — 174 elementos por debajo del mínimo (puntadas
   punteadas). Delantal en masa o línea única; resolver la bola sobre el lazo.
4. **05-pili-juerga** — cadena de bolitas y dentado de llaves mueren; fundir
   las llaves en una silueta.
5. **06-la-nina-de-la-curva** — la mitad de la tinta es línea fina; subir
   pesos conservando el triángulo de señal.
6. **03-chirimoyas** — semillas-guion con contraformas de 0,2 mm; menos
   semillas y más grandes.
7. **12-tucan** — cordones, cremallera y plumeado de boceto: dejar masas y
   calados que aguanten (cabeza, pico, cazadora lisa).
8. **07-catedratica** — tampón en idioma de plumilla, goma flotando entre
   letras, tilde de 0,3 mm.
9. **13-charo** — melena y cara en línea de 0,1 mm (solo las gafas son
   masa). Melena maciza con cara calada.
10. **55-pucherazo / 56-contiene-lagrimas / 36-telepedro** — el chiste va en
    texto calado/encajado que no cabe a su altura de banda: o suben de banda
    (composición) o el texto sale del objeto al patrón «al lado» del set.
11. **57-edicion-numerada** — simplificar el sello: marco único, sin línea
    de puntos, «EDICIÓN Nº» como único texto.
12. **15-felpudo** — mitad de las rayitas del tejido, al doble de grosor.
13. **43-izquierda-caviar** — menos huevas y más grandes (separaciones
    ≥0,8 mm); resolver el cruce del mango con UNA convención.
14. **33-la-banda-del-peugeot** — ventanillas: contraformas de esquina se
    cierran; una ventanilla corrida con tres cabezas.
15. **Cajas caladas del hombro (22, 44, 51 y FACHA-26)** — se imprimen a
    5,5–6 mm con 2-3 líneas caladas; el calado exige o dos líneas máximo a
    más cuerpo, o subir su altura de fila en el cono.

## Bloque B — remates de forma (rápidos, sin redibujo)

- **17-oscargutan** — soldar los brazos al hombro; cerrar o definir la
  ranura de la coronilla.
- **42-cabalgar-contradicciones** — fusionar la oreja derecha a la cabeza
  (arranque como la izquierda).
- **32-sincronizada** — varilla del péndulo de una pieza, sin escalón.
- **18-javierito** — la ramita del globo/muñón, al grosor único del set con
  remate redondeado.
- **41-maquina-del-fango** — el cruce eje/aro con una sola convención.
- **34-fango** — cuellos de las gotas colgantes a ≥0,8 mm o gotas exentas.
- **02-chepas** — la rama del suelo al peso de la silueta, o fuera.

## Decisiones del dueño (no del ilustrador)

- **04-chiqui**: la boca con lengua evoca el logo de los Rolling Stones
  (marca registrada de Musidor BV). Decidir si se aleja el dibujo o se asume.
- Escenario de malla: si el taller garantiza <0,5 mm por escrito, el Bloque A
  se reduce a la mitad (ver columnas del informe).

## Lo que YA está resuelto (no tocar)

- Interlínea con tildes/descendentes, «İ» fantasma, RESILIENTE montada,
  cifras de píxel con costuras: arreglado en `componer-texto.py` (los t- se
  regeneran, nunca se editan a mano).
- Lagrimómetro (54): reconstruido con etiquetas al doble; su fuente editable
  vive en `diseno/iconos/piezas-fuente/`.
- El candado falso de la urna (55) y los restos invisibles de 14: eliminados
  (pintaban un color que la serigrafía no tiene).
