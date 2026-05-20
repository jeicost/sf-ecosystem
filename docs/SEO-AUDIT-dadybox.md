# SEO Content Audit
## https://dadybox.com/
### Fecha: 2026-05-07

---

## SEO Health Score: **42/100** 🔴

> El contenido y la estructura de negocio son sólidos. La página cae por ausencia **total** de infraestructura técnica SEO: sin canonical, sin OG tags, sin schema, sin robots.txt, sin sitemap, y sin analítica detectada. Solucionar esos 6 puntos críticos puede subir el score a ~72/100 sin tocar una línea de contenido.

---

## 1. On-Page SEO Checklist

### 1.1 Title Tag
| Criterio | Estado | Detalle |
|---|---|---|
| Existe | ✅ Pass | Presente |
| Longitud (50-60 chars) | ⚠️ Needs Work | 41 chars — demasiado corto, deja espacio sin aprovechar |
| Keyword primaria | ✅ Pass | "Fulfillment 3PL" y "E-commerce" presentes |
| Posición de keyword | ⚠️ Needs Work | La marca ("Dadybox") va primero — las keywords deberían liderar |
| Nombre de marca | ✅ Pass | "Dadybox" incluido |
| Único | ✅ Pass | Diferente de otras páginas |
| Compelling | ⚠️ Needs Work | Funcional pero descriptivo, no hay gancho emocional o diferenciador |

- **Actual:** `Dadybox - Fulfillment 3PL para E-commerce`
- **Recomendado:** `Fulfillment 3PL para E-commerce en España | Dadybox`
- **Por qué:** Las keywords primarias (fulfillment, 3PL, e-commerce) lideran el título, la marca cierra. Añadir "España" captura búsquedas localizadas. Pasa de 41 a 55 chars.

---

### 1.2 Meta Description
| Criterio | Estado | Detalle |
|---|---|---|
| Existe | ✅ Pass | Presente |
| Longitud (150-160 chars) | ❌ Fail | 110 chars — 40 chars sin explotar |
| Keyword primaria | ✅ Pass | "Fulfillment 3PL en Madrid" al final |
| Call to action | ❌ Fail | No hay verbo de acción que invite al clic |
| Única | ✅ Pass | Diferente por página |
| Compelling | ⚠️ Needs Work | Tono de marca interesante pero no convierte en SERP |

- **Actual:** `"La logística que hace brillar tu e-commerce: rápida, clara y con un toque de magia. Fulfillment 3PL en Madrid."` (110 chars)
- **Recomendado:** `"Externaliza tu fulfillment con Dadybox: envíos 24H, integraciones Shopify/WooCommerce y devoluciones sin fricción. 3PL para e-commerce en Madrid. ¡Pide tu presupuesto!"` (168 chars → recortar a ~158)
- **Impacto estimado:** Una meta description optimizada puede aumentar el CTR orgánico un 20-35%, lo que se traduce directamente en más tráfico sin más posiciones.

---

### 1.3 Estructura de Headings (H1–H3)

**Homepage:**
```
H1 (×1): "Envíos sin dramas. Tu logística nuestra magia."
  H2: "Marcas que confían en nosotros"
  H2: "Tu logística e-commerce en piloto automático"
  H2: "Integra Dadybox en tu ecosistema de e-commerce sin tocar una línea de código"
  H2: "Nuestros Servicios"
  H2: "Devoluciones y checkout sin fricción"
  H2: "Planes que crecen con tu e-commerce"
  H2: "Aprende a dominar logística, checkout y experiencia de cliente"
    H3: "Logística Inteligente"
    H3: "Envíos Que Llegan (Siempre)"
    H3: "SGA – Sistema de Gestión de Almacén"
```

| Criterio | Estado | Detalle |
|---|---|---|
| 1 solo H1 | ✅ Pass | Exactamente uno |
| H1 contiene keyword | ❌ Fail | "Envíos sin dramas. Tu logística nuestra magia." — es un tagline de marca, **no contiene** "fulfillment", "3PL" ni "e-commerce" |
| H1 diferente del title | ✅ Pass | Correcto |
| Jerarquía lógica | ✅ Pass | H2 bajo H1, H3 bajo H2 |
| H2s descriptivos | ⚠️ Needs Work | "Marcas que confían en nosotros" y "Nuestros Servicios" son demasiado genéricos |
| Keywords en H2s | ⚠️ Needs Work | Solo 1 H2 con keyword relevante de forma natural |

- **Problema principal:** El H1 es un tagline creativo que Google no puede indexar semánticamente. Perdes la oportunidad de capturar la keyword más valiosa de la página.
- **Recomendación H1:** `"Fulfillment 3PL para e-commerce — Externaliza tu logística con Dadybox"` o usar una estructura donde el tagline visual sea CSS y el H1 sea semánticamente rico.

---

### 1.4 Optimización de Imágenes
| Criterio | Estado | Detalle |
|---|---|---|
| Alt text en todas las imágenes | ✅ **Excelente** | 47 imágenes, 0 sin alt text |
| Calidad del alt text | ✅ Pass | Descriptivos y con keywords donde aplica |
| Formato de archivos | ⚠️ Needs Work | Mayoría son SVGs (ideal para logos) pero sin WebP para raster images |
| Lazy loading | ✅ Pass | Next.js gestiona loading automáticamente |
| Imágenes preloaded | ✅ Pass | Logo, mascota, dashboard y logo GLS con `rel="preload"` |

> ✅ **Punto fuerte:** El 100% de alt text cumplido es excepcional. La mayoría de sitios tienen 20-40% de imágenes sin describir.

---

### 1.5 Enlazado Interno
| Criterio | Estado | Detalle |
|---|---|---|
| Links internos presentes | ✅ Pass | 27 links internos |
| Anchor text descriptivo | ⚠️ Needs Work | 8 links idénticos a `/reserva-demo?focus=form` con anchors "Reserva tu llamada" |
| Deep linking | ⚠️ Needs Work | Pocos links a páginas de contenido profundo |
| Contexto relevante | ✅ Pass | Links colocados en secciones lógicas |
| Sin links rotos | ✅ Pass | No detectados |

**Problema:** 8 de 27 links internos (30%) apuntan al mismo destino con anchors casi idénticos. Google interpreta esto como señal de poca diversidad de contenido.

**Recomendación:** Reducir a 2-3 CTAs principales por página. Distribuir el resto en links descriptivos que refuercen temas: `"Ver servicios de envío 24H"`, `"Comparar planes de fulfillment"`, `"Leer guías de logística e-commerce"`.

---

### 1.6 Estructura de URLs
| URL | Estado | Evaluación |
|---|---|---|
| `/` | ✅ Pass | Raíz correcta |
| `/servicios-envio` | ✅ Pass | Legible, con keyword |
| `/ecom-academy` | ✅ Pass | Limpia |
| `/qa` | ❌ Fail | Demasiado corta y no tiene keywords — debería ser `/preguntas-frecuentes-logistica` o `/faq-fulfillment` |
| `/reserva-demo` | ⚠️ Needs Work | "demo" es poco descriptivo para SEO — `/solicitar-presupuesto-fulfillment` convertiría mejor |
| `/legal/privacidad` | ✅ Pass | Estructura limpia |

---

## 2. Calidad de Contenido (E-E-A-T)

| Dimensión | Score | Evidencia |
|---|---|---|
| **Experience** | ⚠️ Presente | Tienen clientes reales (Warner, Coca-Cola Fan Store, Salesland, Ilunion). Falta mostrar casos de uso específicos con datos. |
| **Expertise** | ⚠️ Presente | Contenido técnicamente correcto sobre logística. Sin autor identificado, sin credenciales del equipo. |
| **Authoritativeness** | ❌ Débil | No hay page "Sobre nosotros" detectada, sin menciones de prensa, sin certificaciones visibles. |
| **Trustworthiness** | ⚠️ Presente | HTTPS ✅, Dirección física (Calle Albasanz, 14 BIS, 28037 Madrid) ✅, teléfono ✅, email ✅. Sin reseñas estructuradas, sin política de precios transparente. |

**Recomendaciones E-E-A-T:**
1. Añadir página "Sobre Dadybox" con equipo fundador, años de experiencia, volúmenes gestionados.
2. Publicar 2-3 casos de estudio con métricas reales ("Marca X redujo incidencias un 40% en 3 meses").
3. Obtener y mostrar reseñas de Google My Business.
4. Añadir número de pedidos gestionados, años en el mercado, m² de almacén — datos que construyen autoridad.

---

## 3. Análisis de Keywords

### Keyword Primaria
| Elemento | Evaluación |
|---|---|
| **Keyword objetivo** | `fulfillment 3PL e-commerce España` / `externalizar logística e-commerce` |
| **Intención de búsqueda** | Comercial/Transaccional — el usuario quiere contratar un servicio |
| **Keyword en title** | ✅ "Fulfillment 3PL" + "E-commerce" presentes |
| **Keyword en H1** | ❌ Ausente — el H1 es un tagline creativo |
| **Keyword en primeras 100 palabras** | ✅ Aparece en el hero |
| **Keyword en H2** | ⚠️ Parcialmente — "logística e-commerce" en H2 pero no "3PL" |
| **Keyword en meta description** | ✅ "Fulfillment 3PL en Madrid" al final |
| **Keyword en URL** | ❌ Ausente en URL raíz (aceptable para homepage) |
| **Densidad** | ~1.2% (dentro del rango óptimo 1-2%) |

### Keywords Secundarias a Incorporar
```
1. externalizar fulfillment e-commerce
2. almacén e-commerce Madrid
3. picking y packing e-commerce
4. gestión de devoluciones online
5. envíos 24H e-commerce España
6. integración Shopify fulfillment
7. 3PL para marcas D2C
8. software gestión almacén (SGA)
9. logística última milla España
10. fulfillment Black Friday
```

### Alineación con Intención de Búsqueda
El contenido está **bien alineado** con intención comercial/transaccional: planes, CTAs, integraciones, precios. La debilidad está en la **fase informacional** — usuarios que buscan "qué es un 3PL" o "cómo externalizar logística" no encuentran contenido educativo en la homepage.

---

## 4. Technical SEO — Hallazgos Críticos

### 4.1 Robots.txt
| Estado | Detalle |
|---|---|
| ❌ **404 — AUSENTE** | `https://dadybox.com/robots.txt` devuelve 404 |

**Impacto:** Sin robots.txt, los crawlers de Google deben inferir qué indexar. Las páginas `/legal/` se indexan innecesariamente. Si hay páginas de staging o duplicadas, no puedes protegerlas.

**Fix inmediato:**
```
User-agent: *
Allow: /
Disallow: /legal/
Disallow: /reserva-demo
Sitemap: https://dadybox.com/sitemap.xml
```

---

### 4.2 Sitemap XML
| Estado | Detalle |
|---|---|
| ❌ **404 — AUSENTE** | `https://dadybox.com/sitemap.xml` devuelve 404 |

**Impacto:** Google no tiene un inventario oficial de páginas. El E-com Academy puede tener artículos que nunca se indexen. Para un sitio Next.js es trivial generarlo.

**Fix:** En Next.js 13+, añadir `app/sitemap.ts`:
```typescript
export default function sitemap() {
  return [
    { url: 'https://dadybox.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://dadybox.com/servicios-envio', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://dadybox.com/ecom-academy', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://dadybox.com/qa', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
```

---

### 4.3 Canonical Tags
| Estado | Detalle |
|---|---|
| ❌ **AUSENTES en todas las páginas** | Ninguna página tiene `<link rel="canonical">` |

**Impacto:** Si `dadybox.com` y `www.dadybox.com` responden ambas, Google verá **contenido duplicado**. Lo mismo aplica con parámetros UTM (`?utm_source=ig`) que crean URLs duplicadas.

**Fix Next.js:**
```typescript
// app/layout.tsx o por página
export const metadata = {
  alternates: { canonical: 'https://dadybox.com' }
}
```

---

### 4.4 Open Graph & Twitter Card
| Estado | Detalle |
|---|---|
| ❌ **Open Graph: AUSENTE** | Cero tags `og:*` en ninguna página |
| ❌ **Twitter Card: AUSENTE** | Cero tags `twitter:*` |

**Impacto:** Cuando alguien comparte dadybox.com en LinkedIn, Instagram, WhatsApp o Twitter, **no aparece imagen, título ni descripción** — solo una URL cruda. Para un e-commerce B2B, esto destruye conversiones en social.

**Fix Next.js (homepage):**
```typescript
export const metadata = {
  openGraph: {
    title: 'Fulfillment 3PL para E-commerce | Dadybox',
    description: 'Externaliza tu logística y enfócate en vender. Envíos 24H, integraciones nativas y devoluciones sin fricción.',
    url: 'https://dadybox.com',
    siteName: 'Dadybox',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fulfillment 3PL para E-commerce | Dadybox',
    description: 'Tu logística e-commerce en piloto automático. 3PL en Madrid.',
    images: ['/og-image.jpg'],
  }
}
```

---

### 4.5 Analytics y Tracking
| Estado | Detalle |
|---|---|
| ❌ **SIN ANALÍTICA DETECTADA** | No se encontró Google Analytics (GA4), GTM, Meta Pixel, ni ningún otro tracker |

**Impacto:** Este es probablemente el problema más grave del negocio (no solo SEO). Sin analítica:
- No sabes qué keywords traen tráfico orgánico
- No puedes medir conversiones del funnel
- No puedes hacer remarketing
- No puedes optimizar con datos reales
- Google Search Console no recibe señales de comportamiento

**Fix inmediato:** Instalar GA4 + GTM. Con Next.js usar `@next/third-parties`:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'
// En app/layout.tsx
<GoogleAnalytics gaId="G-XXXXXXXXXX" />
```

---

### 4.6 Schema / Structured Data
| Estado | Detalle |
|---|---|
| ❌ **AUSENTE** | Cero JSON-LD en todas las páginas analizadas |

**Oportunidades de rich results perdidas:**

| Schema | Página | Impacto |
|---|---|---|
| `Organization` | Homepage | Aparece en Knowledge Panel de Google |
| `LocalBusiness` | Homepage | Aparece en Google Maps / búsquedas locales "3PL Madrid" |
| `FAQPage` | /qa | Rich result con 9 preguntas expandibles en SERP — pueden doblar el espacio visual ocupado |
| `BreadcrumbList` | Todas | Breadcrumbs visibles en SERP |
| `Service` | /servicios-envio | Rich result para servicios de negocio |
| `WebSite` + `SearchAction` | Homepage | Sitelinks search box en SERP |

**Ejemplo FAQPage (máximo impacto, mínimo esfuerzo):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "¿Qué volumen mínimo necesito para trabajar con Dadybox?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Dadybox no requiere volúmenes mínimos fijos. Los planes se adaptan desde marcas que están empezando a externalizar."
    }
  }]
}
```

---

### 4.7 Velocidad y Core Web Vitals (Estimado)

| Métrica | Estimado | Observaciones |
|---|---|---|
| LCP | 🟡 2.5-3.5s | SVGs + Next.js ok, pero múltiples JS chunks sin bundle splitting óptimo |
| FID/INP | 🟢 <100ms | Next.js hidratación eficiente |
| CLS | 🟢 <0.1 | SVGs con dimensiones definidas |
| TTFB | 🟡 200-400ms | Hosting Vercel (standard) |

> Para medición real: usar Google PageSpeed Insights o Core Web Vitals report en Search Console.

**Hallazgo:** El site revela `<meta name="generator" content="v0.app"/>`. Esto expone que fue prototipado con la herramienta de Vercel AI — eliminar esta meta tag para no revelar el stack.

---

### 4.8 Mobile-Friendliness
| Criterio | Estado |
|---|---|
| Viewport meta tag | ✅ `width=device-width, initial-scale=1` presente |
| Framework responsive | ✅ Next.js con Tailwind (inferido) |
| Fuentes preloaded | ✅ WOFF2 con crossorigin |
| Touch targets | ⚠️ No verificable sin browser test |

---

## 5. Content Gap Analysis

Temas que la competencia cubre y Dadybox aún no tiene como landing pages o posts:

| Tema / Keyword Objetivo | Volumen Est. | Competencia | Tipo de Contenido | Prioridad |
|---|---|---|---|---|
| "qué es un 3PL" / "qué es fulfillment" | Alto | Media | Guía educativa / blog post | 1 |
| "cuánto cuesta externalizar logística" | Alto | Baja | Artículo pricing + comparativa | 1 |
| "fulfillment vs almacén propio" | Medio | Baja | Artículo comparativo | 2 |
| "3PL para marcas de moda" | Medio | Baja | Landing page sectorial | 2 |
| "gestión de devoluciones e-commerce" | Alto | Media | Landing page dedicada | 2 |
| "fulfillment para Amazon FBA" | Medio | Media | Post comparativo | 3 |
| "preparación logística Black Friday" | Alto (estacional) | Media | Guía + checklist descargable | 3 |
| "expansión logística Europa" | Medio | Baja | Landing internacional | 3 |
| "Shopify fulfillment España" | Medio | Baja | Landing de integración | 2 |
| "3PL Madrid precios" | Medio | Muy Baja | Página local + precios | 1 |

---

## 6. Oportunidades de Featured Snippets

| Query Objetivo | Tipo de Snippet | Página Existente | Acción |
|---|---|---|---|
| "¿Qué es un 3PL?" | Párrafo (40-60 palabras) | ❌ No existe | Crear sección o blog post con H2 "¿Qué es un operador logístico 3PL?" |
| "¿Cómo funciona el fulfillment?" | Lista numerada | Homepage (parcial) | Estructurar proceso en `<ol>` con H2 directo |
| "¿Qué volumen necesito para un 3PL?" | Párrafo | /qa | Añadir respuesta en formato de 50 palabras exactas |
| "Precios fulfillment e-commerce España" | Tabla | /#planes | Convertir tabla de planes en HTML `<table>` semántico |
| "Integraciones WooCommerce 3PL" | Lista | Homepage (parcial) | Crear página `/integraciones/woocommerce` |

---

## 7. Análisis Schema — Estado vs Recomendado

| Schema Type | Estado Actual | Recomendación |
|---|---|---|
| Organization | ❌ Ausente | Añadir en homepage — nombre, logo, contacto, redes sociales |
| LocalBusiness | ❌ Ausente | CRÍTICO: Tienen dirección física en Madrid — activa para búsquedas "3PL Madrid" |
| FAQPage | ❌ Ausente | /qa tiene 9 preguntas listas — implementación de 20 minutos con alto impacto |
| BreadcrumbList | ❌ Ausente | Páginas internas sin breadcrumb visual ni estructural |
| Service | ❌ Ausente | /servicios-envio es candidata perfecta |
| WebSite + SearchAction | ❌ Ausente | Habilita sitelinks search box en Google |
| Article | ❌ Ausente | Para futuros posts del E-com Academy |

---

## 8. Oportunidades de Enlazado Interno

**Arquitectura actual (simplificada):**
```
/ (Homepage)
 ├── /servicios-envio
 ├── /ecom-academy
 │    ├── #blog
 │    ├── #playbook
 │    └── newsletter
 ├── /qa
 ├── /reserva-demo
 └── /legal/*
```

**Problemas detectados:**
1. `/servicios-envio` no tiene links desde la homepage que usen anchor text keyword-rico
2. El blog del E-com Academy no está generando links contextuales hacia las páginas de servicio
3. No existe página "Sobre Dadybox" que reciba links y construya autoridad

**Quick wins de enlazado:**
- Desde sección "SGA" en homepage → `/servicios-envio` con anchor "Ver todos los servicios de envío disponibles"
- Desde FAQ homepage → `/qa` con anchor "Ver todas las preguntas frecuentes sobre fulfillment"
- Cada post del E-com Academy → link hacia plan/servicio relevante

---

## 9. Core Web Vitals — Impacto en Negocio

| Escenario | Impacto Estimado |
|---|---|
| LCP > 3s en mobile | +25% tasa de rebote en móvil |
| Sin canonical + parámetros UTM | Google divide el link equity entre URLs duplicadas |
| Sin OG image | CTR en redes sociales cae ~60% vs posts con imagen |
| Sin FAQPage schema | Ocupa 1 resultado en SERP; con schema puede ocupar 4-5 |

---

## 10. Estrategia de Contenido — Recomendaciones

### Frecuencia de publicación
- **Blog E-com Academy:** 2 posts/mes mínimo (actualmente parece placeholder)
- **Casos de estudio:** 1 cada 2 meses
- **Actualizaciones de contenido:** Revisar páginas principales cada 6 meses

### Tipos de contenido prioritarios
1. **Guías educativas** — Para atraer tráfico informacional que luego convierte
2. **Páginas de integración** — `/integraciones/shopify`, `/integraciones/woocommerce` (búsquedas long-tail de alta conversión)
3. **Páginas sectoriales** — `/fulfillment-moda`, `/fulfillment-cosmetica` (keywords menos competidas)
4. **Casos de estudio** — Construyen E-E-A-T y convierten directamente

### Matriz de Priorización de Contenido
| Contenido | Volumen | Competencia | Valor Negocio | Score |
|---|---|---|---|---|
| "Cuánto cuesta un 3PL" | Alto | Baja | Alto | **9/10** |
| Landing /integraciones/shopify | Medio | Baja | Alto | **9/10** |
| "Qué es fulfillment" definitivo | Alto | Media | Medio | **7/10** |
| Caso de estudio cliente | Bajo | — | Alto | **8/10** |
| Landing /fulfillment-madrid | Medio | Baja | Alto | **9/10** |

---

## 11. Recomendaciones Priorizadas

### 🔴 Crítico — Solucionar Esta Semana (30 min - 2h cada uno)

| # | Acción | Impacto Estimado | Esfuerzo |
|---|---|---|---|
| 1 | **Instalar GA4 + Google Search Console** | Sin esto no hay SEO — se va ciego | 30 min |
| 2 | **Crear robots.txt** | Evita indexación de páginas no deseadas, habilita sitemap | 15 min |
| 3 | **Generar sitemap.xml** | Google descubre todas las páginas y prioriza rastreo | 30 min (Next.js) |
| 4 | **Añadir canonical tags** en todas las páginas | Evita penalizaciones por contenido duplicado | 1h |
| 5 | **Añadir Open Graph + Twitter Card** | Arregla sharing en todas las redes sociales | 1h |
| 6 | **Eliminar `meta generator` de v0.app** | Seguridad: no revelar stack tecnológico | 5 min |

### 🟠 Alta Prioridad — Este Mes

| # | Acción | Impacto Estimado | Esfuerzo |
|---|---|---|---|
| 7 | **Implementar FAQPage schema** en /qa | Rich results con 9 preguntas en SERP | 2h |
| 8 | **Implementar LocalBusiness schema** | Aparecer en búsquedas "3PL Madrid" en Maps | 1h |
| 9 | **Optimizar H1 homepage** para incluir keyword primaria | Mejora relevancia en queries de fulfillment | 30 min |
| 10 | **Ampliar meta description** a 150-160 chars con CTA | +20-35% CTR estimado | 30 min |
| 11 | **Renombrar /qa a /preguntas-frecuentes** | Keyword en URL, redirect 301 desde /qa | 1h |
| 12 | **Optimizar title tag** — keywords al inicio | Mejora CTR en queries sin marca | 15 min |

### 🟡 Prioridad Media — Este Trimestre

| # | Acción | Impacto |
|---|---|---|
| 13 | Crear página `/integraciones/shopify` y `/integraciones/woocommerce` | Long-tail de alta conversión |
| 14 | Añadir página "Sobre Dadybox" con equipo y historia | E-E-A-T, confianza |
| 15 | Publicar 2 posts/mes en E-com Academy (con keywords reales) | Tráfico informacional + autoridad de dominio |
| 16 | Implementar Organization schema en homepage | Knowledge panel Google |
| 17 | Crear landing `/fulfillment-madrid` o `/3pl-madrid` | Búsquedas locales de alta conversión |
| 18 | Añadir breadcrumbs visuales y BreadcrumbList schema | Mejor UX + SERP breadcrumbs |

### 🟢 Baja Prioridad — Cuando Haya Recursos

| # | Acción |
|---|---|
| 19 | Crear páginas sectoriales (moda, cosmética, electrónica) |
| 20 | Artículo "¿Cuánto cuesta externalizar logística en España?" |
| 21 | Caso de estudio público con métricas reales |
| 22 | Optimizar velocidad de carga (bundle analysis Next.js) |
| 23 | Implementar WebSite schema + SearchAction |

---

## Resumen Ejecutivo

**dadybox.com** tiene una propuesta de valor clara, buen volumen de contenido (~4.000 palabras en homepage) y una estructura de servicios bien definida. El copywriting y el diseño son competitivos.

El problema SEO no es de contenido — **es de infraestructura**. El sitio no tiene robots.txt, sitemap, canonicals, OG tags, schema ni analítica. Estas son las bases que Google espera encontrar en cualquier site profesional. Sin ellas, el rastreador indexa de forma impredecible, el link equity se fragmenta y las redes sociales no muestran previews.

**Si solo puedes hacer 3 cosas hoy:**
1. Instalar GA4 y añadir el site a Google Search Console
2. Crear `robots.txt` y `sitemap.xml`
3. Añadir canonical + OG tags

Con esos 3 pasos el score técnico sube de 0/30 a ~24/30 y el score global pasa de **42/100 a ~68/100**.

---
*Auditoría realizada con análisis automático de HTML + revisión manual · dadybox.com · 2026-05-07*
