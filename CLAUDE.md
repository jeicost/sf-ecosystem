# Startup Factory Engineering & SEO Standards

**Este documento aplica a TODOS los proyectos SF.** Claude lo lee en cada sesión. Las reglas de SEO son obligatorias pre-deploy.

---

## 🔒 SEO Checklist — Obligatorio Pre-Deploy

Antes de cualquier `vercel --prod`, verificar:

- [ ] **Title tag** — max 60 caracteres, incluye keyword principal + brand
- [ ] **Meta description** — 120-160 chars, CTA implícito (compra, pide, lee, etc)
- [ ] **Canonical tag** — self-canonical en TODAS las páginas (evita duplicación)
- [ ] **OG tags** — og:title, og:description, og:image, og:url correctos (social shares)
- [ ] **Blog posts** — Article/BlogPosting schema JSON-LD obligatorio (datePublished, author, headline)
- [ ] **Dominio www-consistent** — TODOS los URLs en metadata, sitemap, robots.txt, redirects usan www
- [ ] **Sitemap + robots.txt** — sitemap.xml referenciado en robots.txt, ambos apuntan a dominio www

---

## 📋 Por Tipo de Proyecto

### Next.js (Recomendado para nuevos proyectos)

**Estructura mínima:**
```
app/
├── layout.tsx           # metadata raíz, GA4, Organization schema
├── page.tsx             # Homepage
├── robots.ts            # User-Agent, Allow, Sitemap
├── sitemap.ts           # URLs dinámicas desde DB/CMS
└── blog/
    ├── page.tsx         # BlogList
    └── [slug]/
        ├── page.tsx     # generateMetadata() + generateStaticParams()
        └── layout.tsx   # BlogPosting schema
```

**Metadata por página (Next.js):**
```ts
import type { Metadata } from 'next';

const DOMAIN = 'https://www.example.com';

export const metadata: Metadata = {
  title: 'Page Title — Brand',
  description: 'Page description 120-160 chars',
  metadataBase: new URL(DOMAIN),
  alternates: { canonical: '/page-slug' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${DOMAIN}/page-slug`,
    title: 'OG Title (may differ from title tag)',
    description: 'OG Description',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter Title',
    description: 'Twitter Description',
    images: ['/twitter-image.jpg'],
  },
};
```

**Blog post metadata (async):**
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return {
    title: `${post.title} — Blog`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: [{ url: post.ogImage }],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
```

**BlogPosting schema (app/blog/[slug]/layout.tsx):**
```tsx
export default function BlogLayout({ children, params }) {
  const { slug } = params;
  const post = /* fetch post by slug */;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.ogImage || post.coverUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author,
      url: post.authorUrl, // optional
    },
    publisher: {
      '@type': 'Organization',
      name: 'Brand Name',
      url: 'https://www.example.com',
      logo: { '@type': 'ImageObject', url: '/logo.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.example.com/blog/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {children}
    </>
  );
}
```

**robots.ts:**
```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/private'],
    },
    sitemap: 'https://www.example.com/sitemap.xml',
  };
}
```

**sitemap.ts (dinámico):**
```ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const baseUrl = 'https://www.example.com';
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', changefreq: 'weekly', priority: 1 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/blog', changefreq: 'weekly', priority: 0.7 },
  ];

  const postPages = posts.map((p) => ({
    url: `/blog/${p.slug}`,
    lastmod: p.publishedAt,
    changefreq: 'monthly',
    priority: 0.7,
  }));

  return [
    ...staticPages.map((p) => ({
      url: `${baseUrl}${p.url}`,
      ...p,
    })),
    ...postPages.map((p) => ({
      ...p,
      url: `${baseUrl}${p.url}`,
    })),
  ];
}
```

---

### React SPA (Vite, React Router)

Si no puedes migrar a Next.js inmediatamente, implementa estos helpers en el SPA:

**seo-helper.ts:**
```ts
export function updatePageMeta({
  title,
  description,
  canonical,
  ogType = 'website',
  ogTitle,
  ogDescription,
  ogImage,
  publishedTime,
  author,
}) {
  // Title
  document.title = title;

  // Description
  const descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.content = description;
  else document.head.appendChild(
    Object.assign(document.createElement('meta'), {
      name: 'description',
      content: description,
    })
  );

  // Canonical
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.href = canonical;
  } else {
    document.head.appendChild(
      Object.assign(document.createElement('link'), {
        rel: 'canonical',
        href: canonical,
      })
    );
  }

  // OG tags
  const ogTags = {
    'og:title': ogTitle || title,
    'og:description': ogDescription || description,
    'og:type': ogType,
    'og:url': canonical,
    ...(ogImage && { 'og:image': ogImage }),
    ...(publishedTime && { 'article:published_time': publishedTime }),
    ...(author && { 'article:author': author }),
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  });

  // Article schema (if applicable)
  if (ogType === 'article') {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: ogTitle || title,
      description,
      url: canonical,
      ...(ogImage && { image: ogImage }),
      ...(publishedTime && { datePublished: publishedTime }),
      ...(author && { author: { '@type': 'Person', name: author } }),
    };

    const oldScript = document.getElementById('schema-article');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'schema-article';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}
```

**Uso en componente:**
```tsx
useEffect(() => {
  updatePageMeta({
    title: `${post.title} — Blog`,
    description: post.excerpt,
    canonical: `https://www.example.com/blog/${post.slug}`,
    ogType: 'article',
    ogTitle: post.seoTitle || post.title,
    ogDescription: post.seoDescription || post.excerpt,
    ogImage: post.ogImage || post.coverUrl,
    publishedTime: post.publishedAt,
    author: post.author,
  });
}, [post]);
```

---

## 📚 Reglas Globales

### Dominio
- **SIEMPRE usa `www`** — `https://www.example.com`
- Redirect `https://example.com/path` → `https://www.example.com/path` (308 permanente)
- Aplica en: robots.txt, sitemap.xml, canonical tags, metadata links, redirects.json

### Blog / Contenido
- **Article/BlogPosting schema obligatorio** en todos los posts
- Cada post debe tener: title, description, ogImage, publishedAt, author
- Sitemap debe listar TODAS las páginas de blog con lastmod = publishedAt

### Imágenes
- **ALT text obligatorio** en todas las imágenes
- Formatos optimizados: WebP + fallback JPG/PNG
- Max 2-3 imágenes críticas por página (LCP impact)

### Performance
- First Contentful Paint (FCP) mobile < 2.5s
- Total blocking time < 200ms
- Cumulative Layout Shift < 0.1
- Mide con Lighthouse 🔴 Critical, 🟠 > 50 → fijar antes de deploy

---

## 🚀 Stack Recomendado para Nuevos Proyectos

1. **Frontend:** Next.js 16 app router + TypeScript
2. **Styling:** TailwindCSS (o CSS modules si prefieres)
3. **Content:** CMS headless (SF-CMS, Notion, etc) o JSON local
4. **Deployment:** Vercel (auto-builds sitemaps, robots.txt, rewrites)
5. **Monitoring:** Google Search Console + Analytics 4

---

## 🔄 Audit SEO Automático (Pre-Deploy)

Si integras auditoría en CI:
```bash
# package.json
"scripts": {
  "audit:seo": "node scripts/seo-audit.js",
  "build": "next build && npm run audit:seo"
}
```

Script checklist (scripts/seo-audit.js):
- [ ] Title < 60 chars
- [ ] Description 120-160 chars
- [ ] Canonical en todas las páginas
- [ ] Article schema en blog posts
- [ ] robots.txt valida
- [ ] sitemap.xml valida (XML bien formado)
- [ ] Dominio www-consistent (grep en archivos)

---

## 📖 Referencia Rápida

| Elemento | Checklist |
|----------|-----------|
| **Title** | < 60 chars, keyword + brand, único por página |
| **Description** | 120-160 chars, CTA implícito, único por página |
| **Canonical** | Self-canonical, `https://www.domain.com/path` |
| **OG:image** | 1200x630px (square: 1:1), < 200KB, con logo |
| **Article schema** | Solo en blog posts, datePublished + author obligatorio |
| **robots.txt** | Sitemap declarado, disallow: [paths], Allow: /* |
| **sitemap.xml** | Todas las URLs, www-consistent, changefreq + priority |
| **Dominio** | www siempre, 308 redirect sin www |
