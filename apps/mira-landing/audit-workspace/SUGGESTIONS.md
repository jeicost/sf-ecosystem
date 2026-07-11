# MIRA Landing — Sugerencias de mejora
**Fecha:** 2026-05-11 | Ordenadas por impacto/esfuerzo

---

## 🔴 Alta prioridad

### 1. OG Image para WhatsApp/iMessage
Cuando compartes el link, no hay imagen. El preview solo muestra texto.
Crear `/public/og-image.png` (1200×630px) con: logo MIRA, headline "$99. One time.", fondo dark purple.
Añadir en layout.tsx: `openGraph: { images: [{ url: '/og-image.png', width: 1200, height: 630 }] }`

### 2. Activar FormSubmit
Enviar un formulario de prueba desde la landing. FormSubmit manda un email de activación a jacostech@gmail.com. Sin activarlo, los registros del form no llegan.

---

## 🟡 Media prioridad

### 3. Dominio propio para la landing
`mira-landing-chi.vercel.app` no es memorable.
Opciones: `landing.mira.startupsfactory.es` o `get.mira.startupsfactory.es`
Solo requiere añadir CNAME en IONOS + configurar alias en Vercel.

### 4. Stripe para cobros reales
Los botones "Buy" actualmente llevan al formulario de captura de email (comportamiento beta correcto).
Cuando se quiera cobrar online: integrar Stripe Checkout con Payment Links (sin código) o Stripe.js.
Price IDs: Marketing $99 one-time / Full Stack $299 one-time / Updates $9.99/mes.

### 5. Página de confirmación post-form
Ahora el botón cambia de texto al enviar ("✓ We'll be in touch!").
Mejor UX: redirect a `/thank-you` con próximos pasos explicados (qué pasa en las 24h siguientes).

### 6. Testimonios reales con foto
Las cards de Carlos Jacoste y Diego Docavo usan iniciales. Fotos reales aumentan conversión +20%.
Añadir `<img>` con foto de perfil real cuando estén disponibles.

---

## 🟢 Baja prioridad (polish)

### 7. Animación de logos en Social Proof
Los 4 logos de clientes (Salsa Burgers, Discoolver, NC Global, Startup Factory) son solo texto.
Cambiarlos por logotipos reales en SVG o PNG para mayor credibilidad visual.

### 8. Use Cases — flecha de scroll visible en mobile
El carousel horizontal de Use Cases no tiene indicador visual de que hay más cards.
Añadir una flecha o dots de paginación para que el usuario sepa que puede deslizar.

### 9. FAQ — añadir pregunta sobre onboarding en Bangkok
Pregunta sugerida: "Do I need to be in Bangkok?" → No, 100% remote. Brand Brain setup en videollamada.

### 10. Hero — Reducir el espacio vacío bajo las stats en mobile
El `minHeight: 100vh` del hero deja ~150px vacíos bajo la barra de stats en iPhone.
Fix: añadir `@media (max-width: 640px) { section:first-child { min-height: auto; padding-top: 80px; } }`

### 11. Añadir Google Analytics o Plausible
Actualmente no hay tracking. No se sabe cuántos founders llegan a la landing ni desde dónde.
GA4 o Plausible (privacy-first, sin cookies banner): 30 min de trabajo.

### 12. CTA secundario en nav mobile
En mobile el nav muestra "Pricing" + "Sign in →".
Cambiar "Pricing" por "Get MIRA →" que linkea a #pricing para mayor conversión en mobile.
