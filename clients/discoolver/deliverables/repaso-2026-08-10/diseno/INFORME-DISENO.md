# Repaso de diseño — 11 de agosto de 2026

Cuatro auditorías en paralelo sobre 16 capturas de producción (8 páginas ×
desktop/móvil), con contrastes medidos por muestreo de píxel y grids por
`getComputedStyle` — hallazgos medidos, no opiniones. **Todo lo de "APLICADO"
está en producción** (commits `d20ed6f` y `077b5cc`). Las capturas `fix-*.png`
de esta carpeta son la verificación post-fix.

## Lo aplicado, por superficie

### Tienda (globals.css aditivo + Guides/GuideObject/HeroForm)
- El titular del CTA final era invisible: lime sobre crema, **1,03:1** → magenta.
- El escaparate de 7 ítems dejaba una celda vacía de 283×518 px → 3 columnas,
  la tarjeta fantasma como banda a todo el ancho. En móvil → 2 columnas: la
  sección baja de 4.456 a 1.906 px y **el formulario de captación sube 2.861 px**.
- El CTA por ficha era idéntico a la línea de precio (mismo mono magenta) → acción
  con subrayado en lime. La filete de la fantasma caía 42 px desalineada → arriba.
- Nav sticky al 80% dejaba ver las portadas a través → 94%. El botón de la
  waitlist era un cuadrado sin etiqueta → "Avísame". Las dos tarjetas de precio
  no llevaban acción → enlazan a la lista, y Digital (el precio de lanzamiento)
  gana el énfasis que tenía Papel. Ronda: accent crema sobre ocre 2,86:1 → tinta.

### 360 (brand360.css aditivo + páginas)
- **BUG:** el CSS del B2C se fugaba dentro de `.b360` — los bloques de pasos
  heredaban `repeat(4,1fr)` y rayas crema `#F2F0EA` sobre fondo negro en cinco
  bloques de tres páginas. Blindados: tokens sombreados + `.steps/.step`
  declarados por completo. (Evidencia: `fix-steps360.png`.)
- `--b-slate` subía de **2,44:1 a 4,78:1** — las etiquetas del formulario eran
  ilegibles, y el comprador es sector público (RD 1112/2018 exige AA).
- CTA primario: blanco sobre `#FF00C8` era 3,45:1 → tinta oscura, 5,85:1.
- La cita de Ronda pasa de pie de foto (14px cursiva) a cita de display con
  filete magenta (`fix-cita.png`). "Tres puertas" decía tres con dos tarjetas.
  La tarjeta 07 huérfana va a ancho completo. Formulario: filas alineadas,
  16px (mata el zoom de iOS), pills de 44px, borde visible, disabled visible.
  En móvil el nav ya no desaparece (fila desplazable).

### App-landing (globals.css aditivo + componentes + asset)
- La sección del countdown era **negro sobre negro** (pintada para fondo claro
  con una foto oscura encima): titular de 72px, contador y el email que
  tecleabas, todos a 1,3:1. Resucitada (`fix-countdown.png`).
- **scrollWidth 717px en viewport de 390**: el grid del countdown resolvía a
  480px y las tarjetas de creators iban con grid inline sin media query → 390 justo.
- Bento: featured con texto negro sobre foto (scrim + blanco), tarjeta lima
  ilegible (1,03:1), títulos recortados en móvil ("Alojamie").
- El conejo del hero tapaba el caption ("MADRID" desaparecía) → arriba.
- **El logo renderizaba a ~5px**: el PNG tenía el logo dentro de un lienzo
  1280×1024. Sustituido por el asset bueno (968×174).
- Experiences: la fila de meta quedó coja tras quitar los ratings → texto+flecha
  agrupados con hover. HowItWorks: enlaces alineados abajo (23px de escalón).
  El amarillo hardcodeado `#FFD23F` → `var(--accent)`. El punto del ticker era
  lima sobre crema (1,03:1) → magenta. El wordmark recuperó su punto final.

## Lo NO aplicado — decisiones de Carlos

1. **creators-landing**: los dos agentes coinciden — es una tercera marca
   huérfana (Syne+DM Sans, paleta de 360, cero personajes, nav sin enlaces,
   logo en B/N a 6,7px) que duplica palabra por palabra el pitch de
   `/influencers`. Recomendación: matar (301) o reconstruir como ruta de la web
   con el sistema B2C. **Pendiente de decisión.**
2. **La puerta B2C→360**: ninguna superficie B2C enlaza a /360 (el flujo solo
   existe de vuelta). Se abre junto con la retirada del banner + noindex,
   cuando Carlos dé el OK final a /360.
3. **El H1 de la app en inglés** ("Enjoy like a local…"): es el único string en
   inglés de la página. ¿Claim de marca intocable o se castellaniza?
4. **Personajes animales en la tienda**: la tienda es 100% tipografía — los
   assets de OWL/FOX/BUNNY existen y no se usan. Propuesta de los agentes:
   al menos OWL en el hero o junto a "¿Otra ciudad?".
5. Ritmo vertical (240px idénticos entre secciones), muros de texto de
   /360/destinos (sin una sola imagen en 13.400px) → segunda pasada de diseño
   si se quiere, con dirección de arte de Carlos.
