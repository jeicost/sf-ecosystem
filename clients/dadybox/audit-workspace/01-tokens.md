# Design Tokens — Referencia hellodadybox.com PDF

## Paleta
- Primary navy: #0B1829
- Accent green: #3EE89A
- Green dark: #1A9B60 (cara oscura cubo)
- Green mid: #2DC080 (cara lateral cubo)
- White: #FFFFFF
- Text muted on white: rgba(11,24,41,0.65)
- Text muted on dark: rgba(255,255,255,0.6)

## Tipografía
- Familia: moderna sans-serif bold (Inter / Montserrat style)
- Títulos en WHITE slides: VERDE #3EE89A, weight 900, letter-spacing -1px
- Títulos en DARK slides: BLANCO #FFFFFF, weight 900
- Subtítulos en white: NEGRO/NAVY weight 700
- Body: rgba(11,24,41,0.72) en white, rgba(255,255,255,0.62) en dark
- Eyebrow: 7pt, weight 700, letter-spacing 2.5px, uppercase, verde

## Layout por tipo de slide
- SPLIT (mayoría): 35-40% panel oscuro/verde (foto placeholder) | 60-65% contenido blanco
- Logo: top-left del panel oscuro (no del slide completo)
- El panel oscuro tiene fotos reales en referencia → sustituimos con gradiente + decoración
- Content side: padding ~32-40px todos lados

## Elementos característicos de la referencia
1. TÍTULOS VERDES (#3EE89A) en la parte blanca de slides split — diferencia crítica vs actual
2. Círculo verde decorativo en esquina inferior derecha (partial cutoff, ~70-90px, opacity ~0.9)
3. Barra verde top (4px) en slides blancos y algunos oscuros
4. Bottom badge strip en cover: barra verde full-width con texto navy (sin los badges flotantes)
5. Cube SVG grande centrado en paneles oscuros (sustituye fotos)
6. Numbered circles: VERDE fondo + NAVY texto en items de dark slides
7. Plans: fondo MUY VERDE (no navy), cards BLANCAS con bordes redondeados

## Gradientes
- Dark slides: linear-gradient(135deg, #051015 0%, #0B1829 35%, #0D2A18 65%, #1A4D30 100%)
- Plans slide: linear-gradient(135deg, #1A5030 0%, #0F3A22 45%, #0B2218 100%) — MÁS VERDE
- Panel oscuro split: linear-gradient(160deg, #051015 0%, #0B1829 50%, #0D2A18 100%)
- CTA slide: gradient similar al cover

## Densidad de contenido
- Slides no deben tener más de 30% de espacio vacío visible
- Items numerados deben llenar ~65-70% del alto disponible
- Stats deben estar verticalmente centrados con texto header pegado arriba
