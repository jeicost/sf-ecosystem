---
name: feedback-dynamic-imports-regresion
description: dynamic() imports en page.tsx de Next.js App Router fragmentan el bundle en 99 chunks — peor rendimiento en mobile
metadata:
  type: feedback
---

NO usar `dynamic()` imports en `page.tsx` de Next.js App Router para componentes "use client" con el objetivo de mejorar performance. El resultado es el opuesto.

**Why:** En Salsa Burgers, añadir dynamic imports para 6 componentes below-fold pasó de ~15 chunks a 99 chunks y de 641KB a 1595KB transferidos. En mobile con latencia alta, 99 requests HTTP es peor que 15 aunque cada chunk sea más pequeño. Next.js App Router ya hace code-splitting por ruta — el dynamic() en page.tsx solo fragmenta más sin beneficio.

**How to apply:** Solo usar `dynamic()` cuando hay un componente muy pesado con lógica propia que se puede diferir completamente (e.g., un mapa, un editor rich text). Para listas de componentes "use client" normales en la misma página, imports estáticos siempre.
