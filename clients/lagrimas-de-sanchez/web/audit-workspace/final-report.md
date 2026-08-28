# loop-diseno · Lágrimas de Sánchez — 26/27-ago-2026

**Sin referencia externa que replicar.** El objetivo era elevar el diseño propio
a nivel de landing de concurso. El rubric se puntúa contra principios, no contra
una imagen.

## Cambios aplicados

**Bloque 1 · Tokens.** Paleta reescrita a blanco / negro / amarillo señal
(#FFD400). Regla derivada del contraste, no del gusto: el amarillo sobre blanco
da 1,5:1 y no se lee, así que va en bloque con negro encima (13:1) o como
rotulador detrás del texto.

**Bloque 2 · Tipografía.** Cuatro roles con trabajos distintos. El fallo gordo
que se corrigió: Barlow Condensed hacía de texto corrido y es una cara de
rótulo. Entra Public Sans para leer. Bodoni Moda queda para titulares, la
condensada solo para rótulos y las piezas del vidrio, Plex Mono para datos.

**Bloque 3 · Layout macro.** Alternancia de superficies: blanco → cinta amarilla
→ blanco → negro → blanco → negro. Es lo que le da ritmo; antes eran secciones
apiladas con la misma densidad.

**Bloque 4 · Componentes.** Cinta de las 67 piezas a todo lo ancho. Bordes de
2 px y cero radios: lenguaje de cartel, no de tarjeta. Botones rectangulares.

**Bloque 7 · La botella.** Reescrita como objeto de producto:
- Cuatro capas de vidrio (cantos casi negros por el grosor, brillo especular
  descentrado, velo de hombro, culo oscuro) más sombra de apoyo.
- **Jerarquía corregida:** el nombre de la botella es el elemento MÁS GRANDE y
  todo lo demás orbita, como en la referencia. Antes ULTRADERECHA competía con
  el lockup y lo tapaba.
- Lagrimómetro integrado como columna central que parte el cuerpo en dos.
- Pictogramas de trabajo en 12 piezas.

## Fallos propios encontrados y corregidos

| Fallo | Causa |
|---|---|
| Secciones `.s-dark` salían blancas | `background: var(--color-ink)` con `--color-ink` redefinido en la MISMA regla. Las variables se sustituyen dentro del propio bloque |
| ULTRADERECHA se salía de la botella (dos veces) | Variantes responsive `sm:` dentro de un dibujo que escala por transform: miran el ancho de ventana, no el del objeto |
| Hueco muerto en móvil bajo el hero | `scale` encoge lo que se ve pero NO reduce el espacio reservado |
| Celda vacía de otro color en la rejilla | `gap-px` sobre fondo: una fila incompleta deja hueco. Bordes por celda lo resuelve |
| El hombro comía piezas | Es cónico: solo admite una pieza por banda |

## Scores finales

| Ítem | Antes | Ahora |
|---|---|---|
| Layout y proporciones | 6 | 9 |
| Tipografía | 5 | 9 |
| Color | 6 | 9 |
| Espaciado | 7 | 8 |
| Componentes | 7 | 9 |
| Estados interactivos | 7 | 8 |
| Responsive | 8 | 9 |
| Microdetalles | 6 | 8 |
| Jerarquía visual | 5 | 9 |
| Densidad | 6 | 8 |

## Diferencias residuales, conscientes

- **La botella es menos densa que la referencia.** A tamaño de web, meter las 67
  la convierte en papilla. Es adaptación, no descuido.
- **Los pictogramas son trazados de trabajo**, no arte final. Los 39 definitivos
  los dibuja el ilustrador en SVG de una tinta.
- **Espaciado y microdetalles en 8:** la escala es consistente pero no está
  auditada elemento a elemento.

## Decisiones tomadas sin consultar

- No se tocó el amarillo como acento: ya era decisión de marca del usuario.
- El ámbar del vidrio se mantiene aunque conviva mal con el amarillo. Se resuelve
  poniendo la botella sobre bloque negro, no cambiándole el color al producto.
