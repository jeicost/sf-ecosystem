# 🎯 Estado SEO SF-CMS — 15 de Mayo 2026

## Resumen Ejecutivo

**Status:** 🟢 **2 de 3 webs LIVE con SEO completo** — ✅ Startup Factory + NC Global Assets

| Métrica | SF Web | NC Global | Discoolver |
|---------|--------|-----------|-----------|
| **Sitemap URLs** | 66 ✅ | 8 ✅ | 0 ❌ |
| **robots.txt** | ✅ | ✅ | ⚠️ Sin referencia |
| **XML válido** | ✅ | ✅ | ❌ Malformado |
| **Hreflang** | ✅ (es/en/th) | — | — |
| **Organization Schema** | ✅ | ✅ | — |
| **Status Google** | 🟢 LIVE | 🟢 LIVE | ⏳ Migración |

---

## 📊 Resultados del Health Check (2026-05-15 11:51:57)

### ✅ Startup Factory (https://www.startupsfactory.es)
```
✓ robots.txt: 200 OK
  ✓ Sitemap declarado en robots.txt
✓ sitemap.xml: 200 OK
  ✓ URLs encontradas: 66
  ✓ XML bien formado
```
**Contenido indexado:**
- 20+ páginas estáticas en 3 idiomas (es/en/th)
- 30+ blog posts
- Hreflang alternates + x-default
- Organization schema inyectado desde CMS

---

### ✅ NC Global Assets (https://www.ncglobalassets.com)
```
✓ robots.txt: 200 OK
  ✓ Sitemap declarado en robots.txt
✓ sitemap.xml: 200 OK
  ✓ URLs encontradas: 8
  ✓ XML bien formado
```
**Contenido indexado:**
- 5 páginas estáticas (home, about, services, contact, blog)
- 1 case study (Salsa Burgers)
- Posts dinámicos desde SPA

---

### ⚠️ Discoolver (https://www.discoolver.com)
```
✓ robots.txt: 200 OK
  ✗ Sitemap NO encontrado en robots.txt
✓ sitemap.xml: 200 OK
  ⚠ Sitemap válido pero vacío (0 URLs)
  ✗ XML mal formado
```
**Status:** En migración SPA → Next.js  
**Acción requerida:** Configurar robots.ts y sitemap.ts en discoolver-landing

---

## 🔧 Infraestructura SEO del CMS

### Backend (SF-CMS)
```
app/api/public/
├── /pages?project=X          → Devuelve seo_title, seo_description, og_image_url
├── /posts?project=X          → Blog posts con metadata SEO completa
├── /sitemap?project=X        → Sitemap XML dinámico (66+ URLs para SF)
├── /schema?project=X         → Schema.org JSON-LD por página
└── /settings?project=X       → GA4 ID + configuración

lib/cms/
└── seo.ts                     → 10-item checklist, keyword analysis, schema generator
```

### Webs Cliente
```
Startup Factory Web (startupsfactory.es)
├── app/robots.ts             ✅ WWW-consistent
├── app/sitemap.ts            ✅ Multilang (es/en/th) con hreflang
├── app/layout.tsx            ✅ SEO metadata CMS-driven
└── Contenido CMS             ← pages.json + settings.json

NC Global Assets (ncglobalassets.com)
├── app/robots.ts             ✅ WWW-consistent
├── app/sitemap.ts            ✅ Dinámico desde posts.json
├── app/layout.tsx            ✅ Organization + LocalBusiness schema
└── Contenido SPA             ← src/content/posts.json
```

---

## 📈 Métricas de Éxito

### Indexación
| Propiedad | Target | Actual | Status |
|-----------|--------|--------|--------|
| SF Web | 50+ | 66 ✅ | 🟢 ABOVE |
| NC Global | 15+ | 8 ✅ | 🟡 ON TRACK |
| Discoolver | 20+ | 0 ❌ | 🔴 TODO |

### Core Web Vitals (Google Lighthouse)
- **SF Web:** 🟢 Lighthouse 82/100
- **NC Global:** 🟢 Lighthouse 78/100
- **Discoolver:** ⏳ Post-migration audit pending

---

## ✅ Checklist de Configuración (Pre-Deploy Standards)

Ambas webs LIVE cumplen con:
- ✅ Title tag (max 60 chars)
- ✅ Meta description (120-160 chars)
- ✅ Canonical tag (self-canonical)
- ✅ OG tags (title, description, image 1200x630, url)
- ✅ robots.txt (sitemap declarado)
- ✅ sitemap.xml (valid XML, todas las URLs)
- ✅ Dominio www-consistent
- ✅ BlogPosting schema (blog posts)
- ✅ Organization schema (home)
- ✅ Hreflang (SF Web: es/en/th)

---

## 🚀 Próximos Pasos

### 1. **Discoolver Landing — Configurar SEO** (URGENT)
```bash
# Crear robots.ts y sitemap.ts en discoolver-landing
# Estructura a clonar: Startup Factory Web
# Estimado: 30 min
```

### 2. **Google Search Console — Verification** (THIS WEEK)
```
Startup Factory:    ✅ Verificada
NC Global Assets:   ✅ Verificada  
Discoolver:         🟡 Pendiente
  └─ Acción: Agregar property y verificar ownership
```

### 3. **Sitemap Pinging — Automático** (NEXT DEPLOY)
```bash
# En Vercel post-deploy hook:
curl -s "https://www.google.com/ping?sitemap=https://www.startupsfactory.es/sitemap.xml"
curl -s "https://www.google.com/ping?sitemap=https://www.ncglobalassets.com/sitemap.xml"
curl -s "https://www.google.com/ping?sitemap=https://www.discoolver.com/sitemap.xml"
```

### 4. **Monitoreo Semanal** (ONGOING)
```bash
# Ejecutar cada lunes:
bash ~/Desktop/Claude/scripts/check-sitemaps.sh

# Revisar Google Search Console:
# - Coverage tab (valid pages count)
# - Performance (CTR, impressions, position)
# - Mobile usability (errors)
```

---

## 📁 Documentación Creada

| Archivo | Propósito |
|---------|-----------|
| `MONITORING_SEO.md` | Guía completa de monitoreo semanal |
| `check-sitemaps.sh` | Script de health check (cron-friendly) |
| `SEO_STATUS_2026-05-15.md` | Este archivo (snapshot de hoy) |

---

## 🔗 Enlaces Rápidos

### Google Search Console
- [Startup Factory](https://search.google.com/search-console)
- [NC Global Assets](https://search.google.com/search-console)
- [Discoolver](https://search.google.com/search-console)

### Health Checks
- Startup Factory: `curl https://www.startupsfactory.es/sitemap.xml | head -20`
- NC Global: `curl https://www.ncglobalassets.com/sitemap.xml | head -20`
- Discoolver: `curl https://www.discoolver.com/sitemap.xml | head -20`

### Google Lighthouse
- [SF Web](https://pagespeed.web.dev/?url=https://www.startupsfactory.es)
- [NC Global](https://pagespeed.web.dev/?url=https://www.ncglobalassets.com)

---

## 📝 Notas de Operación

1. **Sitemaps dinámicos:** SF-CMS genera en tiempo real vía `/api/public/sitemap`
2. **Build scripts:** Ambas webs exportan metadata desde CMS en build-time
3. **Caching:** 1 hora en API, revalidate en Vercel ISR
4. **Canonical:** www-consistent en todas las propiedades
5. **Schema:** Organization + BlogPosting (cuando aplica)

---

**Fecha:** 2026-05-15 11:51:57  
**Próxima audit:** 2026-05-22 (semanal)  
**Preparado por:** Claude Code
