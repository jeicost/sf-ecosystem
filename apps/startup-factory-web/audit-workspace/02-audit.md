# Auditoría comparativa — Pangea vs Startups Factory

## Stack actual
- Framework: Next.js 16.2.4 (Turbopack)
- CSS: Tailwind CSS
- Fuente actual: Space Grotesk (variable)
- Archivo principal: app/[locale]/page.tsx

## Tabla de deltas

| Aspecto | Pangea (referencia) | SF actual | Delta | Impacto |
|---------|---------------------|-----------|-------|---------|
| Fondo base | #000000 negro puro | #0F0F0F casi negro | Mínimo | bajo |
| Color texto principal | #FFFFFF blanco puro | #F5F0E8 blanco cálido | Notable | medio |
| Orb hero | Esfera gigante glowing purple/magenta | Sin orb, imagen de fondo | CRÍTICO | alto |
| Fondo espacial | Círculos oscuros flotantes | Grid sutil | Muy visible | alto |
| Botones forma | rounded-full (pill) | rounded-lg (8px) | Muy visible | alto |
| Botones color | Gradient purple→magenta | Flat #3D2FFF | Notable | medio |
| H1 tamaño | 80-96px, weight 800+ | 72-80px, weight 900 | Ligero | bajo |
| Sections padding | py-32-40 (muy aireado) | py-24 | Moderado | medio |
| Cards radius | rounded-2xl a 3xl (16-24px) | rounded-xl (12px) | Moderado | medio |
| Cards border | rgba(255,255,255,0.08) sutil | border-[#2A2A2A] visible | Notable | medio |
| Cards bg | #0A0A0F casi negro | #1A1A1A gris oscuro | Moderado | bajo |
| Gradiente en texto | En titulares clave | Sin gradientes | CRÍTICO | alto |
| Glow efectos | Múltiples orbs ambientales | Ninguno | CRÍTICO | alto |
| Letter-spacing H1 | -0.03em muy comprimido | -0.01em aprox | Moderado | medio |
| Eyebrow labels | 11px uppercase tracking | 10px uppercase tracking | Mínimo | bajo |
| Sección alternancia | Ambas dark, diferencias sutiles | dark/dark diferenciadas | Mínimo | bajo |
| Nav | Limpia, minimal, pill buttons | Similar pero rectangular | Ligero | bajo |
| Footer | Dark minimal | Dark minimal | Mínimo | bajo |
