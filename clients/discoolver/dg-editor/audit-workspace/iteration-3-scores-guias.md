# Iter 3 Scores — Guías Discoolver 2026
Fecha: 2026-05-13

## Tabla de scores

| Ítem | Iter 2 | Iter 3 | Δ |
|------|--------|--------|---|
| Layout y proporciones | 8 | 8.5 | +0.5 |
| Tipografía | 8 | 8 | — |
| Color / diferenciación | 9 | 9 | — |
| Espaciado | 8 | 8 | — |
| Componentes (states vacíos) | 7.5 | 8.5 | +1 |
| Estados interactivos | 8 | 8 | — |
| Responsive A4 | 8 | 8 | — |
| Microdetalles | 8 | 8.5 | +0.5 |
| Jerarquía visual | 8.5 | 9 | +0.5 |
| Densidad | 7.5 | 8.5 | +1 |
| **Mínimo** | **7.5** | **8** | **+0.5** |
| **Media** | **8.25** | **8.5** | **+0.25** |

## Cambios aplicados

### 01-portada.html
- Ocultar upload UI (#upload-btn + #bg-placeholder) cuando ?guide= está presente
- Sin foto: headline centrado verticalmente (top:50% + translateY(-60%))
- Sin foto: font-size headline 82px → 118px, hl2 54px → 70px
- Sin foto: watermark tipográfico de ciudad (Bebas Neue 180px, opacity 0.04) en bottom
- Sin foto: glow más pronunciado (acc35 → acc12 → transparent)

### 18-10saves.html
- Padding automático de items hasta 10 con slots "PRÓXIMAMENTE" (dashed border, opacity 0.28)
- Grid siempre completo visual aunque haya menos de 10 saves en la guía

### 10-arte-exposiciones.html
- Cuando items=0: ocultar big-split (foto hardcodeada de Unsplash + intro) en lugar de dejarla visible
- Empty state editorial: box dashed con ARTE ghost text (80px) + magenta separator + texto curado
- Box min-height: 620px para llenar la mayor parte de la página

### 16-contraportada.html
- back-content: inset ajustado + padding vertical para reducir el aire
- Watermark tipográfico de ciudad en bottom (160px, opacity 0.018) no interfiere con QR
- Social row (síguenos + @discoolver + discoolver.com) añadida debajo del year stamp

## Diferencias residuales

- **Portada sin foto**: Diseño tipográfico sin foto tiene techo ~8.5 — la foto protagonista es insustituible
- **Arte 0 items**: Box editorial llena 2/3 de la página pero hay ~250px vacíos al final — limitación de documento-flow vs fixed A4
- **Contraportada**: Sigue con ~150px de aire arriba y abajo del bloque central — elección de diseño editorial aceptable para back cover

## Condición de terminación
Mínimo 8 (subió de 7.5). Diferencias residuales son de contenido real (fotos) y límites de sistema, no de CSS/diseño.
→ Loop terminado para este run.
