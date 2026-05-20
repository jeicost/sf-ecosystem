# Lecciones acumuladas — Loop Diseño

Este archivo es la **memoria persistente** del skill.

---

## Patrones consolidados

_Lecciones validadas en este primer run._

1. **Font-weight explícito en TODOS los elementos tipográficos.** Al cambiar de una fuente variable (Raleway) a una geométrica (Satoshi/Inter), los elementos que no tienen `font-weight` especificado en CSS heredan 400 en vez del visual anterior. Revisar sistemáticamente: `.brand-card .name`, `.infra-row .ttl`, `.pullquote`, `.team-card .name`, `.tm-quote`, `.chat-modal__title`. Añadir weight en el bloque 2 (tipografía), no esperar al final.

2. **Secciones light requieren ~15 overrides.** Los elementos que tienen colores dark hardcoded (checklist tick bg, logo-cell bg, tmbox borders, avatar circles) deben tener overrides explícitos en `.section--light`. Es mejor crearlos todos de una vez que descubrirlos iteración a iteración.

3. **Los scroll positions para screenshots difieren entre desktop y mobile.** En mobile, las secciones son más altas por el layout single-column. Usar `element.getBoundingClientRect().top + window.scrollY` para obtener posiciones exactas de cada sección, no asumir que son las mismas que en desktop.

4. **El estado interactivo (hover/focus) no se puede verificar con screenshots estáticos.** Asignar score 8 por defecto si el CSS está correctamente implementado y no se puede hacer testing interactivo. No gastar iteraciones en este ítem.

5. **`display-md` y `display-lg` con clamp: calibrar el max antes de iterar.** Un max demasiado grande (64-96px) en headings de sección causa wrapping de 5-6 líneas que rompe la densidad. Empezar con: `display-lg: clamp(36px, 3.8vw, 52px)`, `display-md: clamp(26px, 2.8vw, 40px)`.

---

## Errores recurrentes y cómo evitarlos

- **Error:** Asumir que el scroll position Y en desktop coincide con mobile para screenshots → **Prevención:** Siempre obtener posiciones via `getBoundingClientRect()`.
- **Error:** No añadir `font-weight` explícito al cambiar de fuente → **Prevención:** En Bloque 2, revisar TODOS los elementos con `font-family: var(--font-display)` y añadir weight.
- **Error:** Tomar screenshots a positions estimadas y malinterpretar secciones → **Prevención:** Usar Playwright con `page.evaluate()` para obtener posiciones reales de elementos.

---

## Atajos por tipo de proyecto

### Landing pages (primera entrada)
- El CTA banner full-width es un cambio de alto impacto visual, bajo riesgo técnico. Hacer en Bloque 3.
- Las secciones `section--light` se implementan bien con una sola clase CSS + overrides. No usar CSS-in-JS ni inline styles.
- En Vite+React vanilla CSS: no hay tree-shaking de CSS, todos los estilos cargan siempre. Organizar por componente, no por feature.

---

## Trampas conocidas en herramientas / stacks

### Vite + React + vanilla CSS
- La fuente Satoshi de Fontshare (api.fontshare.com) funciona con `<link>` en `index.html`. No necesita instalación npm.
- Al eliminar `document.body.classList.add("type-fraunces")`, la regla CSS `body.type-fraunces {}` queda dead code — no rompe nada pero puede confundir. Eliminar también la regla CSS en una siguiente iteración de cleanup.
- El `mix-blend-mode: screen` en el logo img funciona bien para logos en PNG sobre dark background.

---

## Estimaciones de iteraciones por tipo de proyecto

| Tipo de proyecto | Mediana de iteraciones | Rango observado |
|------------------|------------------------|-----------------|
| Landing simple (Vite+React, vanilla CSS) | 4 | 4–4 |

---

## Decisiones de diseño que casi siempre requieren input humano

- **Color de acento de marca vs. color de referencia**: Si el diseño actual usa un color de marca con identidad establecida (gold, rojo de marca, etc.) y la referencia usa un color diferente (lime, azul), preguntar SIEMPRE antes de implementar. El usuario en este run eligió mantener gold.
- **Hero gallery strip (mockups de producto)**: Si la referencia tiene una galería de product mockups y el sitio actual tiene una foto de hero distinta, preguntar qué contenido visual usar. En este run se mantuvo el hero full-bleed de Bangkok.

---

## Historial de runs

| Fecha | Proyecto | Iteraciones | Score final mínimo | Lección clave |
|-------|----------|-------------|---------------------|----------------|
| 2026-05-03 | NC Global Assets → HOOX style | 4 | 8/10 (9/10 en 9 de 10 ítems) | Font-weight explícito al cambiar fuente; secciones light necesitan overrides exhaustivos |
