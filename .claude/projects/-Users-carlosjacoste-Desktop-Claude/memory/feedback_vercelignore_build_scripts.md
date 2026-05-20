---
name: feedback-vercelignore-build-scripts
description: .vercelignore nunca debe excluir la carpeta scripts/ si el build command la usa
metadata:
  type: feedback
---

Al crear `.vercelignore`, nunca añadir `scripts/` si el `package.json` build script la referencia.

**Why:** En Salsa Burgers, el build es `"node scripts/fetch-cms-content.mjs && next build"`. Al añadir `scripts` al `.vercelignore`, Vercel no subía ese directorio y el build fallaba con `MODULE_NOT_FOUND` (requireStack: []). Error silencioso difícil de diagnosticar.

**How to apply:** Antes de añadir carpetas a `.vercelignore`, revisar `package.json` scripts para verificar qué directorios usa el build. El `.vercelignore` mínimo seguro:
```
node_modules
.next
*.pdf
tsconfig.tsbuildinfo
```
