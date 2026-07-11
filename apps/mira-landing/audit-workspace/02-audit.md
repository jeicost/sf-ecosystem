# Audit Mobile — MIRA Landing · 2026-05-11

## Stack actual
- Framework: Next.js 15 static export
- CSS: Inline styles React + <style> block al final de page.tsx
- Fuente: Space Grotesk (Google Fonts)

## Tabla de deltas por sección

| Sección | Issue | Impacto |
|---------|-------|---------|
| **Body global** | Sin overflow-x:hidden — cualquier elemento que desborde crea scroll horizontal | alto |
| **Nav** | "by Startup Factory" wraps a 2 líneas en 375px — nav height se rompe | alto |
| **Hero titular** | `clamp(60px,8.5vw,112px)` en 375px → 60px mín, "MIRA costs $99." desborda a la derecha | alto |
| **Hero subtítulo** | Sin padding adaptativo, texto cae contra bordes | medio |
| **Hero stats bar** | 4 items en flex row sin wrap — "$99" y "24/7" se cortan parcialmente | medio |
| **Problem** | `gridTemplateColumns: '1fr 1fr'` hardcoded — cards del lado derecho van off-screen | alto |
| **Teams tabs** | Tabs no scrollan horizontalmente — ítems de INNOVATION/ADMIN/FINANCE off-screen | alto |
| **Teams content** | `gridTemplateColumns: '1fr 1fr'` en panel — SVG + capabilities cortados | alto |
| **Brand Brain** | `gridTemplateColumns: '1fr 1fr', gap: 80` — columna derecha off-screen | alto |
| **How it works** | `gridTemplateColumns: '1fr 1fr'` — funciona OK en 375px (cards ~160px) | bajo |
| **Use Cases** | Cards 340px en overflow-x:auto — funcionan como swipe carousel | bajo |
| **Pricing** | `gridTemplateColumns: '1fr 1fr'` — tarjetas $99/$299 crampadas a ~160px, CTA "Buy MIRA Full Stack →" wraps a 4 líneas | alto |
| **Social proof** | `repeat(auto-fit, minmax(300px,1fr))` — colapsa a 1 col correctamente | ok |
| **FAQ** | Funciona bien en mobile | ok |
| **Footer CTA form** | flexWrap funciona, el form es usable | ok |
| **OG image** | Sin imagen en metadata.openGraph.images — preview en WhatsApp/iMessage solo texto | medio |
