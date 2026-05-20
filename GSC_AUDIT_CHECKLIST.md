# 📊 Google Search Console Audit — Interactive Checklist

**Fecha:** 2026-05-15  
**Tu email:** jacostech@gmail.com  
**Propiedades:** 3 (SF Web, NC Global, Discoolver)

---

## 🔗 Paso 1: Acceder a Google Search Console

### Opción A: URL directa (recomendado)
```
https://search.google.com/search-console
```

### Opción B: Desde browser
1. Google → "Google Search Console"
2. Login con jacostech@gmail.com
3. Selecciona propiedad en dropdown superior izquierdo

---

## 🏢 PROPIEDAD 1: Startup Factory (startupsfactory.es)

### A. Coverage (Cobertura de índice)

**Ubicación:** Left sidebar → "Indexing" → "Coverage"

**Verifica estos números:**
```
┌─────────────────────────────────────────┐
│ ✓ VALID (Páginas indexadas)             │
│   Target: 50+ (Actual: ___)             │
│   Tendencia: ↗️ (debe crecer)            │
│                                          │
│ ⚠️ VALID with warnings                  │
│   Target: 0-2 (Actual: ___)             │
│                                          │
│ ❌ ERROR (Errores de rastreo)           │
│   Target: 0 (Actual: ___)               │
│   Si > 0: Investigar qué URLs fallan    │
│                                          │
│ 🔍 EXCLUDED (Excluidas por robots.txt)  │
│   Normal: 5-10 (Actual: ___)            │
└─────────────────────────────────────────┘
```

**Acciones:**
- [ ] Si "Valid" < 50 → Chequear que sitemaps estén bien formados
- [ ] Si "Discovered but not indexed" > 5 → Posible problema de canonical duplicado
- [ ] Si "Error" > 0 → Click en "Error" tab para ver cuáles URLs fallan

---

### B. Enhancements (Rich Results)

**Ubicación:** Left sidebar → "Enhancements"

**Verifica estos tipos de schema:**
```
┌──────────────────────────────────────────┐
│ 🏢 Organization                          │
│   Status: ✓ Valid (Actual: ___)          │
│   Target: 1+ (home page)                 │
│                                          │
│ 📝 Article / BlogPosting                 │
│   Status: ✓ Valid (Actual: ___)          │
│   Target: 30+ (blog posts)               │
│                                          │
│ ❌ Errors                                │
│   Target: 0 (Actual: ___)                │
│   Si > 0: Click para ver detalles        │
└──────────────────────────────────────────┘
```

**Acciones:**
- [ ] Si Organization = 0 → Verificar que layout.tsx tenga schema
- [ ] Si Article errors > 0 → Chequear blog/[slug]/layout.tsx

---

### C. Performance (Tráfico orgánico)

**Ubicación:** Left sidebar → "Performance"

**Métricas a registrar:**
```
┌──────────────────────────────────────────┐
│ 📊 Total Impressions (Impresiones)       │
│   Valor anterior (mayo 1): ___           │
│   Valor actual (mayo 15): ___            │
│   Tendencia: ↗️ / → / ↘️                  │
│                                          │
│ 👆 Total Clicks (Clics)                  │
│   Valor anterior: ___                    │
│   Valor actual: ___                      │
│   CTR calculado: (Clicks ÷ Impressions × 100)  │
│                                          │
│ 📍 Avg Position (Posición promedio)      │
│   Target: < 15 (Actual: ___)             │
│   Si > 20 → Keywords sin visibility     │
└──────────────────────────────────────────┘
```

**Top Keywords a monitorear:**
- [ ] "AI agency" — Posición: ___ CTR: ___%
- [ ] "venture studio" — Posición: ___ CTR: ___%
- [ ] "team as a service" — Posición: ___ CTR: ___%
- [ ] "startup consulting" — Posición: ___ CTR: ___%

**Acciones:**
- Si CTR < 1% para keywords en posición < 10 → Mejorar title/description
- Si posición 11-20 → Keywords ready para ranking, optimizar backlinks

---

### D. Mobile Usability

**Ubicación:** Left sidebar → "Enhancements" → "Mobile Usability"

```
┌──────────────────────────────────────────┐
│ ✓ Valid Pages (Actual: ___)              │
│   Target: 100% (sin errores)             │
│                                          │
│ ❌ Pages with errors (Actual: ___)       │
│   Target: 0                              │
│   Errores comunes:                       │
│   - Viewport not set                     │
│   - Text too small                       │
│   - Clickable elements too close         │
└──────────────────────────────────────────┘
```

**Acciones:**
- [ ] Si errores > 0 → Click para ver cuáles páginas fallan
- [ ] Verificar viewport meta tag en app/layout.tsx

---

### E. Security & Manual Actions

**Ubicación:** Left sidebar → "Security & Manual Actions"

```
┌──────────────────────────────────────────┐
│ ⚠️ Manual penalties (Actual: ___)        │
│   Target: None                           │
│                                          │
│ 🔒 Security issues (Actual: ___)         │
│   Target: None                           │
└──────────────────────────────────────────┘
```

**Acciones:**
- Si hay alguna alerta → Actuar inmediatamente (rara vez pasan en SF Web)

---

## 🏢 PROPIEDAD 2: NC Global Assets (ncglobalassets.com)

Repetir **mismo checklist** que SF Web pero con targets menores:

```
Coverage target: 15+ URLs (actual SPA no estaba indexado)
Article/BlogPosting: 5+ posts (actual: ___)
Mobile usability: 100% sin errores
Performance: Comparar CTR con mes anterior
```

**Checklist rápido:**
- [ ] Coverage → Valid: ___ (target 15+)
- [ ] Enhancements → No errors
- [ ] Mobile Usability → 100%
- [ ] Performance → CTR trending ↗️

---

## 🏢 PROPIEDAD 3: Discoolver (discoolver.com)

**⚠️ STATUS ESPECIAL:** En migración SPA → Next.js

### Verificar Ownership

**Ubicación:** Top left → "Verify ownership"

```
┌──────────────────────────────────────────┐
│ Estado actual: ✓ Verified? ___ YES/NO   │
│                                          │
│ Si NO está verificada:                   │
│ 1. Click "Verify ownership"              │
│ 2. Selecciona método (DNS/HTML file)    │
│ 3. Completa verificación                │
└──────────────────────────────────────────┘
```

### Agregar Sitemap

**Ubicación:** Left sidebar → "Sitemaps"

```
┌──────────────────────────────────────────┐
│ 1. Click "Add/Test sitemaps"             │
│ 2. Ingresa: /sitemap.xml                 │
│ 3. Google verificará que sea válido      │
│                                          │
│ Expected status:                         │
│ ✓ Success (15+ URLs esperadas           │
│   cuando migración esté lista)           │
└──────────────────────────────────────────┘
```

### Crawl Stats (opcional pero útil)

**Ubicación:** Left sidebar → "Settings" → "Crawl stats"

```
Muestra:
- Requests per day (cuánto rastre Google)
- Response time (velocidad del sitio)
- KB downloaded (tamaño de páginas)

Durante migración: Esperar a que tenga contenido estable
```

---

## 📋 Template de Registro (Llena esto después de cada audit)

```
AUDIT FECHA: 2026-05-15

STARTUP FACTORY:
  Coverage Valid: ___ / 50 target
  Organization schema: YES/NO
  Mobile errors: ___ / 0 target
  CTR promedio: ___%
  Top keyword posición: ___
  
NC GLOBAL ASSETS:
  Coverage Valid: ___ / 15 target
  BlogPosting schema: ___ / 5+ posts
  Mobile errors: ___ / 0 target
  
DISCOOLVER:
  Ownership verified: YES/NO
  Sitemap added: YES/NO
  Coverage: ___ / TBD (en migración)
  
NOTAS/ALERTAS:
  _______________
```

---

## 🚨 Alertas Críticas (Acciones Inmediatas)

### 🔴 RED FLAGS
Si ves alguno de estos → ACTÚA INMEDIATAMENTE:

```
❌ "Removed by owner" > Indexed pages
   → Probable error en robots.txt (disallow accidental)
   → FIX: Revisar app/robots.ts

❌ Crawl errors > 10
   → URLs rotas o redirects mal configurados
   → FIX: Chequear logs de Vercel

❌ Mobile usability errors > 5
   → Layout issues que Google detecta
   → FIX: Ejecutar Lighthouse en PageSpeed Insights

❌ Manual action penalty
   → Spammy content o violación de políticas
   → FIX: Raro en SF Web, but check immediately
```

### 🟡 WARNINGS
Si ves esto → Agenda para próxima semana:

```
⚠️ "Discovered but not indexed" > 20
   → Páginas que Google vio pero no indexó
   → Probable causa: Canonical duplicado o noindex

⚠️ CTR < 1% para queries en posición < 10
   → Title/description no atrae clicks
   → FIX: Editar metadata en CMS

⚠️ Avg position 11-20
   → Keywords sin ranking fuerte yet
   → FIX: Backlinks + content optimization
```

### 🟢 HEALTHY SIGNS
```
✓ Valid pages creciendo mes a mes
✓ CTR > 2% para top keywords
✓ Mobile usability sin errores
✓ No crawl errors
✓ No manual actions
```

---

## 📱 Google Search Console Mobile App (opcional)

Si prefieres monitoreo mobile:
1. Descarga app "Google Search Console" (iOS/Android)
2. Login con jacostech@gmail.com
3. Recibe notificaciones de errores críticos

---

## 🔗 Atajos Directos (Copia en browser)

```
Startup Factory:
https://search.google.com/search-console/coverage?resource_id=https%3A%2F%2Fwww.startupsfactory.es%2F

NC Global Assets:
https://search.google.com/search-console/coverage?resource_id=https%3A%2F%2Fwww.ncglobalassets.com%2F

Discoolver:
https://search.google.com/search-console/coverage?resource_id=https%3A%2F%2Fwww.discoolver.com%2F
```

---

## 📊 Frecuencia Recomendada

| Métrica | Frecuencia | Acción |
|---------|-----------|--------|
| Coverage | Semanal | Si baja: investigar |
| Performance CTR | Semanal | Comparar tendencia |
| Mobile errors | Mensual | Si > 0: fix inmediato |
| Rich results | Mensual | Si baja: chequear schemas |
| Manual actions | Diario (push notif) | Si > 0: URGENT |

---

## 📝 Notas

- **GSC data lag:** Google actualiza coverage c/24-48h; CTR tarda 3-4 días
- **Primera auditoría:** Esperar 1-2 semanas post-deploy para ver datos estables
- **Baseline:** Estos datos son baseline. Auditorías futuras compararán contra esto
- **Discoolver:** Una vez migración SPA→Next.js completada, GSC mostrará mejora dramática en indexación (de 0 a 15+)

---

**Completa este checklist y comparte los resultados. Basado en los números, puedo optimizar metadata en el CMS.**
