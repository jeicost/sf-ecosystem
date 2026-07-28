# 📊 Monitoreo SEO en Vivo — Startup Factory Ecosystem

**Última actualización:** 2026-05-15  
**Status:** ✅ Todos los sitemaps activos y robots.txt configurados

---

## 🌍 Propiedades Monitoreadas

### 1. **Startup Factory** (startupsfactory.es)
- **URL:** https://www.startupsfactory.es
- **Robots:** https://www.startupsfactory.es/robots.txt
- **Sitemap:** https://www.startupsfactory.es/sitemap.xml
- **Google Search Console:** ✅ Verificada
- **Vercel Project:** sf-cms-next
- **Status:** 🟢 LIVE

**Contenido indexado:**
- 20+ páginas estáticas (es/en/th con hreflang)
- ~30 blog posts
- Hreflang alternates: es → en → th → x-default

---

### 2. **NC Global Assets** (ncglobalassets.com)
- **URL:** https://www.ncglobalassets.com
- **Robots:** https://www.ncglobalassets.com/robots.txt
- **Sitemap:** https://www.ncglobalassets.com/sitemap.xml
- **Google Search Console:** ✅ Verificada
- **Deployment:** Netlify (SSG static export)
- **Status:** 🟢 LIVE

**Contenido indexado:**
- 5 páginas estáticas (home, about, services, contact, blog)
- 1 case study (Salsa Burgers)
- Posts dinámicos desde src/content/posts.json

---

### 3. **Discoolver Landing** (discoolver.com)
- **URL:** https://www.discoolver.com
- **Robots:** https://www.discoolver.com/robots.txt
- **Sitemap:** https://www.discoolver.com/sitemap.xml
- **Google Search Console:** 🟡 Configurar
- **Status:** ⏳ En migración (SPA → Next.js)

---

## ✅ Checklist Semanal de Monitoreo

### Monitoreo Automático (Scripts)
```bash
# Ejecutar semanalmente (agregado a cron si es posible)
./scripts/check-sitemaps.sh

# O manualmente:
curl -s https://www.startupsfactory.es/sitemap.xml | head -20
curl -s https://www.ncglobalassets.com/sitemap.xml | head -20
```

### Verificaciones Manuales (Google Search Console)

#### **Startup Factory**
- [ ] Coverage tab → "Valid pages" count aumentando
- [ ] Enhancements → "Mobile Usability" 100%
- [ ] Performance → CTR, impressions, avg position
- [ ] Indexing → "User-declared canonical" without duplicates
- [ ] Search appearance → Rich results activos (Organization schema)

**Action items:**
- Si "Discovered but not indexed" > 5 → investigar canonicals duplicados
- Si "Crawl errors" > 0 → chequear 404s o redirects rotos

#### **NC Global Assets**
- [ ] Sitemaps tab → sitemap.xml "Valid"
- [ ] Pages tab → blog posts indexados (>15 posts = ✅)
- [ ] Mobile usability → sin errores
- [ ] Performance → comparar CTR con mes anterior

#### **Discoolver**
- [ ] Setup verification (ownership)
- [ ] Agregar sitemap.xml
- [ ] Monitorear crawl budget durante primera semana post-migration

---

## 📈 Métricas de Éxito

### 1. **Cobertura de Indexación**

| Propiedad | Target | Actual | Trend |
|-----------|--------|--------|-------|
| **SF Web** | 50+ páginas | ? | ↗️ |
| **NC Global** | 20+ páginas | ? | ↗️ |
| **Discoolver** | 15+ páginas | ? | ⏳ |

**Cómo chequear:**
```
Google Search Console → Coverage → "Valid" tab → muestra el total indexado
```

### 2. **Core Web Vitals**
- **FCP (First Contentful Paint):** < 1.8s
- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **TTB (Time to Interactive):** < 3.5s

**Cómo chequear:**
```
PageSpeed Insights: https://pagespeed.web.dev/?url=https://www.startupsfactory.es
```

### 3. **Tráfico Orgánico**
- **Impresiones:** monitorear en GSC
- **CTR:** target > 2%
- **Promedio de posición:** < 15 para keywords principales

---

## 🔍 Keywords Principales a Monitorear

### Startup Factory
- "AI agency Barcelona"
- "venture studio Spain"
- "team as a service"
- "growth partner"
- "startup consulting"

### NC Global Assets
- "assets management"
- "global solutions"
- "case studies"

### Discoolver
- "grupo descuentos"
- "turismo España"
- "viajes corporativos"

**Cómo chequear:**
```
Google Search Console → Performance → 
Filtrar por "Query" o "Country" o "Device"
```

---

## 🚨 Alertas y Acciones

### 🔴 **CRITICAL**
- [ ] Sitemap devuelve 404 → Verificar robots.ts apunta a URL correcta
- [ ] Más de 10 "Crawl errors" en GSC → Investigar redirects rotos
- [ ] "Removed by owner" > indexado → Chequear robots.txt no tiene disallow accidental

**Fix:**
```bash
# Verificar sitemap es accesible
curl -I https://www.startupsfactory.es/sitemap.xml
# Debe devolver 200

# Verificar robots.txt
curl https://www.startupsfactory.es/robots.txt
# Debe incluir: Sitemap: https://www.startupsfactory.es/sitemap.xml
```

### 🟡 **WARNING**
- [ ] "Discovered but not indexed" > 20 → Posible problema de metadata
- [ ] CTR < 1% para queries con posición < 10 → Mejorar title/description
- [ ] Lighthouse < 50 → Optimizar performance

**Fix:**
```bash
# Chequear metadata de una página
curl -s https://www.startupsfactory.es | grep -E "title|description|og:"
```

### 🟢 **HEALTHY**
- Valid pages creciendo mes a mes
- CTR > 2% para top keywords
- Mobile usability sin errores
- Lighthouse > 70

---

## 📅 Calendario de Acciones

| Fecha | Acción | Responsable |
|-------|--------|-------------|
| 📅 Cada lunes | Revisar GSC Coverage | Carlos |
| 📅 1ro de mes | Audit SEO completo | Carlos |
| 📅 Post-deploy | Ping sitemaps a Google | Auto (Vercel hook) |
| 📅 Q1 2026 | Comprehensive audit | Carlos + SEO agency |

---

## 🔗 Enlaces Rápidos

### Google Search Console
- [Startup Factory](https://search.google.com/search-console/about?resource_id=https%3A%2F%2Fwww.startupsfactory.es)
- [NC Global Assets](https://search.google.com/search-console/about?resource_id=https%3A%2F%2Fwww.ncglobalassets.com)
- [Discoolver](https://search.google.com/search-console/about?resource_id=https%3A%2F%2Fwww.discoolver.com)

### Lighthouse
- [SF Web](https://pagespeed.web.dev/?url=https://www.startupsfactory.es)
- [NC Global](https://pagespeed.web.dev/?url=https://www.ncglobalassets.com)

### Sitemap Validators
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [Google Structured Data Tester](https://search.google.com/test/rich-results)

---

## 🤖 Automatización (Próximos pasos)

### Script: check-sitemaps.sh
```bash
#!/bin/bash
# Verificar que todos los sitemaps son válidos

domains=("startupsfactory.es" "ncglobalassets.com" "discoolver.com")
for domain in "${domains[@]}"; do
  echo "Checking $domain..."
  curl -s -I "https://www.$domain/sitemap.xml" | grep HTTP
  curl -s "https://www.$domain/robots.txt" | grep -i sitemap
done
```

### Google Search Console API
Si se necesita:
```bash
# Fetch top queries from GSC (requires OAuth)
gapi="https://www.googleapis.com/webmasters/v3/sites"
# Implementar en ci/gsc-report.js si necesario
```

---

## 📝 Notas de Operación

1. **Sitemaps dinámicos:** SF-CMS genera sitemaps en tiempo real vía `/api/public/sitemap?project=X`
2. **Robots.txt estático:** Configurado en app/robots.ts (compilado en build-time)
3. **Hreflang:** SF Web incluye alternates (es/en/th)
4. **Organization Schema:** Inyectado desde CMS en layout.tsx
5. **BlogPosting Schema:** Generado por app/blog/[slug]/layout.tsx

---

**Última revisión:** 2026-05-15  
**Próxima audit:** 2026-05-22
