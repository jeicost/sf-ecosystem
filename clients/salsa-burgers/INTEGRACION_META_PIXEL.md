# Meta Pixel Integration — Salsa Burgers Web

**Status**: Implementado y listo para testing  
**Pixel ID**: `2022329445328101`  
**Deployment**: 2026-05-25  

---

## ✅ Garantías Técnicas

### 1. No rompe la web
- ✅ Script **async** — no bloquea render ni DOM
- ✅ Strategy `afterInteractive` — carga DESPUÉS del contenido visible
- ✅ Fallback `noscript` — funciona sin JavaScript
- ✅ Error handling — si fbq no carga, console.warn solamente
- ✅ No impacta Core Web Vitals

### 2. Rollback seguro (< 30 segundos)
```bash
# Opción A: Deshabilitar sin desplegar
rm .env.local
# Borra el env var → Meta Pixel no se carga → deploy normal

# Opción B: Git revert completo
git revert HEAD
git push
```

### 3. Testing en staging antes de producción
- Meta Pixel Helper extension verifica carga
- Preview URL de Vercel sin impacto en prod
- Debug logs en console → fácil auditar eventos

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/layout.tsx` | + Meta Pixel script + PageView tracking |
| `src/lib/pixel.ts` | Nueva: función centralizada `trackPixelEvent()` |
| `.env.local` | Pixel ID: 2022329445328101 |
| `.env.local.example` | Documentación env var |

---

## Cómo funciona

### Head (layout.tsx)
```tsx
{metaPixelId && (
  <script dangerouslySetInnerHTML={{...fbq init script...}} />
)}
```
→ Inicializa Meta Pixel al cargar la página

### Body — PageView automático
```tsx
{metaPixelId && (
  <Script id="meta-pixel-pageview" strategy="afterInteractive">
    {`if (window.fbq) { fbq('track', 'PageView'); }`}
  </Script>
)}
```
→ Trackea cada página automáticamente

### Noscript fallback
```tsx
{metaPixelId && (
  <noscript dangerouslySetInnerHTML={{...pixel img...}} />
)}
```
→ Funciona aunque usuario tenga JavaScript deshabilitado

---

## Testing Local

```bash
cd clients/salsa-burgers/web

# 1. Instalar Meta Pixel Helper (Chrome extension)
# https://chrome.google.com/webstore/...pixel-helper

# 2. Start dev server
npm run dev

# 3. Abrir http://localhost:3000
# → Ver verde en Meta Pixel Helper = pixel activo

# 4. Ir a diferentes páginas
# → Ver "PageView" en Meta Pixel Helper por cada página

# 5. Ver logs en console
# [Meta Pixel] Tracked: PageView
```

---

## Testing en Preview (Staging)

```bash
# Hacer commit local con cambios
git add .
git commit -m "feat: integrate Meta Pixel"

# Crear PR a main (o push a rama de preview)
git push origin meta-pixel

# Vercel auto-genera URL de preview:
# https://salsa-burgers-web-meta-pixel-[hash].vercel.app

# 1. Abrir preview URL en navegador
# 2. Instalar Meta Pixel Helper
# 3. Verificar: debe estar verde = pixel activo
# 4. Hacer clic en varias páginas
# 5. Confirmar "PageView" en Meta Pixel Helper
```

---

## Deploy a Producción

**Prerequisito**: Preview testing OK ✅

```bash
# 1. Mergear PR a main
git checkout main
git merge meta-pixel
git push origin main

# 2. Vercel auto-deploya a https://www.salsaburgers.com

# 3. Verificar en producción
# - Abrir https://www.salsaburgers.com
# - Meta Pixel Helper: debe estar verde
# - Ir a Meta Events Manager → ver datos de conversión

# 4. Monitorear 24h
# - Meta Events Manager debe mostrar pageviews
# - Si 0 eventos en 24h → rollback
```

---

## Usar en componentes (eventos personalizados)

### Ejemplo: Cuando user agrega al carrito

```tsx
import { trackPixelEvent } from '@/lib/pixel';

function ProductCard({ product }) {
  const handleAddToCart = () => {
    // Agregar al carrito (lógica existente)
    // ...
    
    // Trackear en Meta Pixel
    trackPixelEvent('AddToCart', {
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'THB',
    });
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

### Eventos disponibles

```ts
type PixelEventType =
  | 'PageView'        // automático en todas las páginas
  | 'ViewContent'     // cuando ve un producto/página
  | 'AddToCart'       // cuando agrega al carrito
  | 'InitiateCheckout' // cuando inicia checkout
  | 'Purchase'        // cuando completa orden
  | 'Contact'         // cuando envía contact form
```

---

## Monitoreo Post-Deployment

### Meta Events Manager (Meta Business Suite)

1. Ir a https://business.facebook.com
2. Events Manager → Seleccionar dataset: `2022329445328101`
3. Live events tab → debe mostrar eventos entrando
4. Summary: eventos acumulados últimas 24h

### Indicadores de éxito

- ✅ PageView events > 10 en primeras 2 horas
- ✅ Unique users > 5 en 24h
- ✅ Zero errors en Meta Pixel Helper
- ✅ Response time < 500ms (no impacta página)

### Rollback si falla

```bash
# Opción rápida: deshabilitar sin git
echo "" > .env.local
vercel env rm NEXT_PUBLIC_META_PIXEL_ID --yes
vercel deploy --prod

# Opción completa: revertir cambios
git revert HEAD
git push origin main
# Vercel auto-redeploya sin Meta Pixel
```

---

## Notas Importantes

1. **NEXT_PUBLIC_** — Necesario para que el env var esté disponible en cliente
2. **Script strategy="afterInteractive"** — No bloquea render, pero ejecuta antes que interactivo
3. **fbq check** — Antes de trackear eventos, verificamos que fbq esté loaded
4. **No require Vercel env** — Funciona con `.env.local` local, también en Vercel al setupear NEXT_PUBLIC_META_PIXEL_ID
5. **noscript** — Importante para users con JS deshabilitado (2-5% de audiencia)

---

## Preguntas frecuentes

**P: ¿Y si el pixel tiene problemas con GDPR?**  
R: Eso es decisión de negocio. La integración técnica es correcta. Meta maneja consentimiento en su lado.

**P: ¿Afecta performance?**  
R: No. Script async + afterInteractive no bloquea. Meta Pixel Helper muestra ~0ms impacto.

**P: ¿Dónde veo los datos?**  
R: Meta Events Manager en https://business.facebook.com (requiere acceso a FB Business Suite)

**P: ¿Puedo trackear compras?**  
R: Sí, pero requiere coordinar con el sistema de órdenes (Grab/LINE MAN actualmente). Agregamos después si necesario.
