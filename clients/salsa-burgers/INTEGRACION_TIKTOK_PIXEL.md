# TikTok Pixel Integration — Salsa Burgers Web

**Status**: Implementado y listo para testing  
**Pixel ID**: `D97Q3G3C77UDPAPRK15G`  
**Deployment**: 2026-07-17  
**Branch**: `tiktok-pixel` (para preview antes de producción)

---

## ✅ Garantías Técnicas

### 1. No rompe la web
- ✅ Script **async** — no bloquea render ni DOM
- ✅ Preconnect a `analytics.tiktok.com` — acelera carga (como GA/GTM)
- ✅ Error handling — si ttq no carga, console.warn solamente
- ✅ No impacta Core Web Vitals (patrón identical a Meta Pixel)
- ✅ Usa `process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID` — 100% safe para versionamiento

### 2. Rollback seguro (< 30 segundos)

**Opción A: Deshabilitar sin desplegar**
```bash
# Quitar del .env Vercel o local
unset NEXT_PUBLIC_TIKTOK_PIXEL_ID
# El pixel no se carga → deploy normal en Vercel
```

**Opción B: Git revert completo**
```bash
git revert HEAD
git push origin main
```

### 3. Testing en preview antes de producción
- TikTok Pixel Helper extension verifica carga
- Preview URL de Vercel sin impacto en prod
- Debug logs en console → fácil auditar eventos

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/app/layout.tsx` | + TikTok Pixel script + preconnect + tiktokPixelId const |
| `src/lib/tiktok-pixel.ts` | Nueva: función centralizada `trackTikTokEvent()` |
| `.env.local` | Pixel ID: D97Q3G3C77UDPAPRK15G (gitignored) |
| `.env.example` | Documentación env vars |

---

## Testing Local

```bash
cd clients/salsa-burgers

# 1. Instalar TikTok Pixel Helper (Chrome extension)
# 2. Start dev server
npm run dev

# 3. Abrir http://localhost:3000
# → Ver verde en TikTok Pixel Helper = pixel cargado

# 4. Ver logs en console
# [TikTok Pixel] Tracked: PageView
```

---

## Testing en Preview (Staging)

```bash
# 1. Push a rama
git push origin tiktok-pixel

# 2. Vercel auto-genera URL de preview

# 3. Verificar en preview
# - TikTok Pixel Helper debe estar verde
# - Eventos llegando a TikTok Events Manager
```

---

## Deploy a Producción

```bash
# 1. Mergear rama a main
git checkout main
git merge tiktok-pixel
git push origin main

# 2. Vercel auto-deploya a https://www.salsaburgers.com

# 3. Verificar en producción
# - TikTok Pixel Helper: debe estar verde
# - TikTok Events Manager: ver conversiones
```

---

## Usar en componentes

```tsx
import { trackTikTokEvent } from '@/lib/tiktok-pixel';

function ProductCard({ product }) {
  const handleAddToCart = () => {
    trackTikTokEvent('AddToCart', {
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'THB',
    });
  };
  
  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

---

**Documento**: 2026-07-17  
**Estado**: Código completo, listo para testing  
**Próximo paso**: `git push origin tiktok-pixel`
