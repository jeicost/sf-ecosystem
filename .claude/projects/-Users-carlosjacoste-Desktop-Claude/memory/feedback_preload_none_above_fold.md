---
name: feedback-preload-none-above-fold
description: preload="none" en video above-fold es PEOR que autoPlay+preload="auto" — el buffer empieza 500-1500ms más tarde
metadata:
  type: feedback
---

Para videos **above the fold** (visibles en carga inicial): usar `autoPlay + preload="auto"`, NO `preload="none"` con IntersectionObserver.

**Why:** Con `preload="none"`, el browser no empieza a descargar el video hasta que React hidrata y el observer dispara (500-1500ms en mobile). Con `autoPlay + preload="auto"`, el browser empieza a bufferizar en paralelo con la descarga del JS. El video hero de Salsa Burgers tardaba visiblemente más con la "optimización" que sin ella.

**How to apply:**
- Hero video (primera pantalla): `autoPlay loop muted playsInline preload="auto"`
- Videos below-fold: `preload="none"` + IntersectionObserver que llama `video.play()` al hacer scroll
- Poster: usar `poster` solo si el video es genuinamente lento (>5MB). Un poster muy bueno hace que el usuario crea que el video fue reemplazado por imagen.
