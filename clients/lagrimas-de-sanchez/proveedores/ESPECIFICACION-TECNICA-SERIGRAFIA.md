# Especificación técnica de serigrafía
## Lágrimas de Sánchez · magnum 150 cl · 1 tinta blanca sobre vidrio antico

Documento para el taller. Rev. 2 · 30 de septiembre de 2026.
Contacto: Carlos Jacoste · Aranjuez, Madrid · lagrimasdesanchez.com

---

## 1. El envase

Ya está elegido y no es sustituible. Es una referencia de catálogo con plano
de fabricante, no un formato genérico.

| | |
|---|---|
| Fabricante | **Estal** (Girona) · estal.com · +34 972 821 676 |
| Referencia | **SM BG MG ESSENTIA**, acabado de boca *Sommelier Long* |
| Capacidad | 150 cl (magnum) · 1.545 ml al ras |
| Color del vidrio | **ANTICO** — oliva oscurísimo, casi negro. No es ámbar |
| Peso en vacío | 900 g |
| Altura total | 380,9 mm |
| Cuerpo cilíndrico | **ø105 mm → perímetro 329,9 mm** × **140 mm** de alto |
| Hombro | 125,9 mm, **cónico** |
| Cuello | ø32 mm × 115 mm — **no se decora** |
| Punt (culo hundido) | 30 mm |

El acabado de boca es de corcho. El vidrio lo aportamos nosotros salvo que
ustedes puedan suministrarlo (ver § 7).

---

## 2. La decoración

- **Serigrafía cerámica vitrificada, UNA tinta, BLANCA.** Referencia de
  pantalla `#F6F1E6`; la equivalencia en esmalte cerámico la proponen
  ustedes.
- **Sin etiqueta frontal.** Todo el grafismo va en el vidrio, incluido el
  bloque de marca.
- **Zona decorada:**
  - Cuerpo cilíndrico: **330 × 140 mm**, cobertura 360°.
  - Hombro cónico: piezas sueltas, según su criterio de altura máxima
    decorable (ver § 6, pregunta 2).
  - Cuello: limpio.
- **Reserva sin tinta: 80 × 58 mm** en la trasera del cuerpo, para una
  contraetiqueta adhesiva con los datos que cambian por lote.
- **Uso final:** la botella se vende también **vacía, como rellenable**. La
  decoración debe aguantar lavavajillas doméstico.

### Tiradas previstas

| | |
|---|---|
| Primera tirada | **1.000 unidades** |
| Reposiciones | tandas de 300–500 a lo largo del año |
| Presupuesto pedido | por unidad a **600 / 1.000 / 3.000** uds, y aparte pantallas, fotolitos y puesta a punto |

---

## 3. El arte

**67 piezas** en un solo color, sin tramas, sin degradados y sin
transparencias. Todo el texto va **vectorizado**: no hay ni una fuente viva
en el arte, porque sabemos que su RIP tampoco la tendría.

### Lo que entregamos

| Fichero | Qué es |
|---|---|
| `desarrollo-plano.svg` / `.png` | El 360° desplegado: cuerpo cilíndrico, franja del hombro y reserva de contraetiqueta marcada |
| Las 67 piezas sueltas en SVG | Vectorial, un color, texto en trazados |
| `INFORME-IMPRIMIBILIDAD.md` | Ver § 4 |
| Renders del resultado buscado | Para que veamos todos lo mismo |

Podemos entregar en el formato que ustedes prefieran (AI, PDF/X, EPS) y con
la sobredimensión y la compensación que nos indiquen. Solo necesitamos que
nos digan cuáles (§ 6, pregunta 6).

### Aviso sobre el montaje

El desarrollo que enviamos es un **montaje de referencia**: sirve para ver
densidad, reservas y peso óptico. La composición definitiva sobre el sector
cónico del hombro la esperamos cerrar con ustedes, porque el desarrollo real
de un cono es un sector de corona y no un rectángulo (§ 6, pregunta 2).

---

## 4. Lo que hemos medido nosotros, y por qué se lo contamos

No les mandamos el arte «a ver qué pasa». Cada pieza se ha rasterizado a su
**altura real de impresión** (40 px/mm) y se ha sometido a apertura y
dilatación morfológica, que es la manera de simular qué sobrevive a la malla.
Medimos tres cosas por pieza:

- **Tinta fina** — porcentaje de tinta más fina que el mínimo: no transfiere.
- **Calado cerrado** — contraformas que la ganancia de tinta empasta.
- **Islas muertas** — elementos sueltos que desaparecen enteros.

Y lo hacemos en **dos escenarios**, porque el suelo lo ponen ustedes:

| Escenario | Trazo mínimo | Resultado |
|---|---|---|
| **Estricto** | 0,80 mm | 21 piezas limpias · 14 con riesgo asumible |
| **Malla fina** | 0,35 mm | 26 piezas más entran sin problema — 61 de 67 en total |
| **Rotas en ambos** | — | **6 piezas**, y las estamos rehaciendo |

**Lo que esto significa para el presupuesto y para el arte:** si su malla
garantiza ≤0,5 mm, el arte entra tal cual. Si su suelo real es 0,8 mm,
tenemos 26 piezas que redibujar antes del fotolito — y preferimos hacerlo
ahora que descubrirlo con las pantallas hechas.

Alturas de impresión del arte: de **3,6 mm** la pieza más pequeña a **128 mm**
la columna vertical del instrumento, con una **mediana de 13,8 mm**.

Los grosores están fijados en **milímetros impresos**, no en unidades de
dibujo: mínimo 0,85 mm en los pictogramas, 0,50 mm en los textos y 1,00 mm en
los remates de relleno. Cada pieza pasa una verificación automática antes de
salir; si algo baja del suelo, el arte no se genera.

---

## 5. Lo que sabemos que es delicado

Se lo decimos nosotros para que lo valoren al presupuestar:

1. **Dos pasadas de blanco.** El vidrio es antico, casi negro. Damos por
   hecho que una sola pasada no opaca. Si son dos, necesitamos el precio de
   las dos.
2. **El 360° sin junta.** Todo el diseño es tejido continuo que da la vuelta.
   Si su línea deja un solape o unos milímetros muertos, dígannoslo **ahora**:
   rehacemos la retícula. Descubrirlo después es rehacer el arte entero.
3. **El hombro cónico.** 126 mm de cono con deformación. Necesitamos su
   altura máxima real decorable con garantía de registro, y la deformación
   asociada, para compensarla en el arte.
4. **Magnum en línea.** Casi todo el mercado está montado para 75 cl.
   Preferimos saber si esto les obliga a cambiar utillaje antes de seguir.
5. **La merma del vidrio aportado.** Compramos nosotros el vidrio y se lo
   mandamos decorado: cada rotura en su taller no cuesta dos euros, cuesta
   cinco. Necesitamos saber quién la asume y con qué porcentaje trabajan.

---

## 6. Las preguntas que necesitamos contestadas por escrito

Están ordenadas por lo que más decide:

1. **¿Cuál es el trazo mínimo que garantizan con su malla?** Es el dato que
   más condiciona el arte (§ 4).
2. **¿Hasta qué altura del hombro decoran con garantía de registro, y con qué
   deformación?** Si nos dan la altura real, adaptamos el diseño a ella en
   vez de forzarlo.
3. **¿Cuántas pasadas de blanco sobre antico?** Con su precio.
4. **¿El 360° es real y sin junta, o queda solape?**
5. **¿Qué zona muerta exigen bajo el arranque del hombro y sobre la base?**
6. **¿En qué formato quieren el arte final**, con qué sobredimensión y qué
   compensación de deformación?
7. **¿Trabajan el formato magnum en línea** o les obliga a cambiar utillaje?
8. **¿Han decorado antes esta referencia de Estal** o similares de 150 cl?
9. **¿Pueden hacernos una o dos botellas de muestra** antes de la tirada?
   Para nosotros esto no es opcional: no lanzamos 1.000 sin ver una.
10. **¿Pueden suministrar ustedes la botella?** Es de Estal (Girona) y nos
    evitaría el doble porte desde Madrid.
11. **Plazo de entrega** desde arte final aprobado.
12. **La merma**: quién la asume y con qué porcentaje (§ 5.5).

---

## 7. Documentación que necesitamos con el pedido

- Declaración de conformidad para **contacto alimentario** del vidrio
  (Reg. UE 1935/2004).
- Certificado de las **tintas cerámicas** con límites de plomo y cadmio.
- Confirmación **por escrito** de aptitud para lavavajillas.

---

## 8. Cómo damos el arte por bueno

Para que sepan qué vamos a mirar cuando nos manden la muestra:

1. Que las piezas que el informe da por limpias salgan limpias.
2. Que el registro cierre el 360° sin junta visible.
3. Que la reserva de contraetiqueta esté donde tiene que estar.
4. Que la decoración aguante lavavajillas, comprobado en la muestra.
5. Que el blanco opaque de verdad sobre el antico.

Si algo de esta especificación no encaja con su proceso, preferimos que nos
lo digan ahora y adaptarlo nosotros. El arte es nuestro y se regenera con un
comando; las pantallas, no.
