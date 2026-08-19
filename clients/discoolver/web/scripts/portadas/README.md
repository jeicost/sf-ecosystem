# Portadas de muestra de «Guías de autor»

Las siete portadas de `/guias` (`public/assets/guias/portada-guia-*.webp`) se
generan aquí. **Las personas son ficticias y generadas**: por eso el bloque las
rotula «Ejemplo de formato» y no les pone arroba, seguidores, testimonio ni
precio. Ver el docstring de `components/sections/GuiasDeAutor.tsx`.

El diseño no se inventa aquí. Es el sistema de portadas del editor de guías
(`~/Developer/discoolver-dg-editor/design/inspiracion-portadas/README.md`: los
10 parámetros derivados de WIRED y el addendum v4 validado con el CEO).
`plantilla-portada.html` es la **v5**: parte de `design/24-portada-star.html` y
le devuelve la densidad editorial que v4 había dejado fuera. Su cabecera
documenta qué añade y por qué.

## Cómo se rehacen

```bash
python3 _paso1-retratos.py           # Freepik Mystic → raw-*.jpg y ciudad-*.jpg
python3 -c "…rembg…"                 # recorte al bbox del alfa → cut-*.png
python3 -m http.server 8799 &         # la plantilla carga las fotos por URL
python3 _paso2-render.py              # Playwright → v5-*.png (794×1123 @2x)
```

Después, reducir a 720 px de ancho y guardar como WebP q84 en
`public/assets/guias/` (≈60 KB cada una).

⚠️ **Si cambian los bytes sin cambiar el nombre, hay que renombrar el fichero.**
El optimizador de imágenes de Next cachea por URL y ancho del `srcset`, así que
vaciar `.next/cache/images` no basta: en el navegador siguen saliendo las
viejas. En producción pasaría lo mismo con el CDN y con quien ya las tuviera.

## Las siete

Paleta = la que ya usa cada ciudad en `components/sections/Guides.tsx`, con su
contraste medido. Así el bloque de producto y el de autor se leen como una sola
familia. Dos son portadas claras (Málaga lima, Ibiza crema) y llevan tinta
oscura: por eso v5 necesitó un parámetro `--ink`, que v4 daba por blanco.

| Ciudad | Fondo | Tinta | Acento | Coverline |
|---|---|---|---|---|
| Madrid | `#22578a` | clara | `#f4b47a` | +MADRILEÑA que el último metro |
| Barcelona | `#c8006b` | clara | `#c9ff3f` | +BARCELONÉS que bañarse en enero |
| Málaga | `#c9ff3f` | oscura | `#c8006b` | +MALAGUEÑA que un espeto a las ocho |
| Valencia | `#6d2f5e` | clara | `#f4b47a` | +VALENCIANA que discutir por el arroz |
| Ibiza | `#f2f0ea` | oscura | `#c8006b` | +IBICENCO que la isla en octubre |
| Bangkok | `#8f004d` | clara | `#f4b47a` | +TAILANDESA que cenar de pie |
| Dubái | `#2b3a6b` | clara | `#e6c26a` | +DUBAITÍ que el desierto a las seis |

`offset=31` y `alto=70` en las siete: con valores más altos el recorte se comía
el «+» del coverline entero, y la regla 5 del addendum dice que el sujeto muerde
el borde inferior izquierdo de la palabra, no un carácter completo.

**«10 SAVES» se repite a propósito** en las siete: es una sección real de todas
las guías (`design/18-10saves.html` del editor) y funciona como marca de serie,
igual que el «PLUS» recurrente de WIRED. No es una cifra inventada de adorno.
