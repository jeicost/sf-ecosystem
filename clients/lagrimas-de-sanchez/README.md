# Lágrimas de Sánchez

**Estado: 24 de agosto de 2026 · concepto y producto cerrados, producción sin arrancar**

Marca de botella de cristal serigrafiada y vino de la DO Vinos de Madrid.
Dominios en propiedad: `lagrimasdesanchez.com` y `.es`

---

## El producto en una frase

Una botella borgoña de 750 ml en vidrio ámbar, serigrafiada por completo en el
propio cristal con **67 piezas tipográficas** del vocabulario político español de
la última década. Tinta cerámica blanca vitrificada a 600 °C: no es una etiqueta,
es parte del vidrio. Sin etiqueta frontal. Ni una sola cara.

**Un solo SKU de vidrio, tres presentaciones:**

| | PVP | Coste | Margen |
|---|---|---|---|
| La botella vacía, rellenable | 22 € | 4,60 € | **75 %** |
| El estuche completo (1 vino + 1 vacía) | 39 € | — | — |
| Pack de 3 vinos | 69 € | 24,86 € | 56 % |

**La tesis:** esto no es un negocio de vino, es un negocio de regalo con vino
dentro. **La botella vacía es el negocio; el vino es la prensa.**

---

## RETOMAR AQUÍ

### Lo que bloquea todo — es tuyo, no mío
1. **Registrar la marca en la OEPM.** ~125 €. Único punto donde un tercero puede
   adelantarse y quedarse con el nombre. Ver `legal/checklist-legal.md`
2. **Pedir los presupuestos.** Los tres correos están escritos en
   `proveedores/`. Contactos verificados en `proveedores/contactos-proveedores.txt`
   - Serigrafía → Ibicrom, Serijerez, Todoglass, Serigrafía Portal
   - Vidrio → Juvasa, Estal, Verallia, Vidrala
   - Bodegas → Vinícola de Arganda, Jeromín, Pablo Morate
3. **Contratar ilustrador** para las 67 piezas en SVG de una tinta. 1.500-3.000 €.
   Sin arte final no hay serigrafía

### Decisiones abiertas
- **Acabado de boca**: corcho + T-cork de zamak, o cierre mecánico tipo La Casera
  para los dos productos. El mecánico es más barato, más icónico y una sola pieza,
  pero exige otro formato de botella. Se decide con los presupuestos delante
- **Consejo Regulador de Vinos de Madrid**: ¿admite cierre mecánico? Aplazado
- **Color**: ámbar es la elección. Verde antiguo es el plan B si no hay stock
- **Los medidores**: Carlos le está dando una vuelta al lagrimómetro y a la idea
  de un segundo medidor (EL GIRÓMETRO). Todas las versiones y las mejoras
  propuestas están en `producto/medidores-abierto.md`. La lámina y el Excel
  llevan la versión 2, que es la vigente hasta que él decida

### Hecho
- Concepto, tono y arquitectura de producto
- Las 67 piezas con nombre, tratamiento e icono → `producto/inventario-67-piezas.txt`
- Estructura de la retícula: 12 bandas justificadas, 75 % de ocupación
- Modelo de costes de los dos productos → `producto/costes.md`
- Checklist legal completo → `legal/checklist-legal.md`
- Copy completo de la web → `web/copy-y-brief-web.txt`
- Briefs de diseño de producto y de web para Claude Design → `diseno/`

---

## Las tres reglas que no se tocan

**1. Ni una cara.** Toda la sátira la cargan apodos, palabras y objetos. Sin
imagen, el art. 7.6 de la LO 1/1982 no entra. Es lo que hace la marca
registrable, exportable y vendible en retail.

**2. En el vidrio solo marca y creatividad.** Ninguna mención legal, de origen,
de grado, de lote ni de DO. Todo eso vive en la contraetiqueta adhesiva. Es lo
que permite llenar la misma botella con vino de Madrid hoy y de otra DO mañana,
o venderla vacía.

**3. La home vende la botella vacía, no el vino.** Una home que vende alcohol
necesita puerta de edad y no se puede anunciar en Meta ni en Google. El vino
vive en `/vino`. Es una decisión de arquitectura con valor económico directo.

---

## Estructura

```
producto/    inventario de las 67 piezas · ficha técnica · costes
proveedores/ contactos verificados + los tres correos listos para enviar
legal/       checklist completo: marca, imagen, IIEE, etiquetado, publicidad
web/         copy completo y brief para Claude Design
diseno/      briefs, la lámina del desarrollo plano, el banco de piezas,
             y 3 mesas de trabajo .dc.html (frontal, lateral, retícula)
```

## Referencia estructural
**El Xitxarel·lo** (Penedès): palabrario catalán serigrafiado en blanco sobre
vidrio topacio, sin etiqueta, con lockup sereno en el centro. Es la densidad y
el registro a igualar: 60-80 piezas, bandas horizontales justificadas, dos
tercios de las piezas puramente tipográficas.
