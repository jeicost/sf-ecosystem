## 1. Stack

| Dato | Valor |
|---|---|
| Next.js | **16.2.11** (`next@16.2.11`, `eslint-config-next@16.2.11`) |
| React | 19.2.4 |
| Router | **App Router** puro (`app/`, sin `src/`, sin `pages/`) |
| Bundler | **Turbopack** — es el default de Next 16; los scripts son `next dev` / `next build` sin flags y existe `.next/turbopack/` |
| CSS | **Tailwind v4.3.3 instalado pero prácticamente sin usar**: `postcss.config.mjs` carga `@tailwindcss/postcss` y `app/globals.css` empieza con `@import "tailwindcss"`, pero **no hay ni una utilidad Tailwind en el código** (grep sobre `app/` + `components/`: 0 resultados de `flex`, `text-*`, `p-*`, `bg-*`…). Todo el diseño son **2.640 líneas de CSS plano BEM** en `app/globals.css`. Tailwind sólo aporta preflight + theme vars |
| TS paths | `@/*` → `./*` |
| Build | `node scripts/fetch-cms-content.mjs && next build` |
| Vercel | `prj_fxRmmDp5z9FBUPmZurgb43GsN5Ep` / `discoolver-landing`, **git-connected: push a `main` = build de producción** |
| Middleware | **no hay** (`middleware.ts` / `proxy.ts` inexistentes) |

## 2. Layout raíz — `/Users/carlosjacoste/Developer/Claude/clients/discoolver/web/app/layout.tsx`

- **3 fuentes con `next/font/google`**, todas con `variable` + `display:"swap"`, subset `latin`:
  `Space_Grotesk` → `--font-space-grotesk` (weights 400/500/600/700), `Geist` → `--font-geist`, `Geist_Mono` → `--font-geist-mono`.
- Las variables se aplican **en `<html>`**: `<html lang="es" className={`${spaceGrotesk.variable} ${geist.variable} ${geistMono.variable}`}>`.
- **`<body>` no tiene `className`**, ni un solo atributo. Todo el estilo del body sale del selector `body {}` de `globals.css`.
- **Cero providers** (ni theme, ni context, ni analytics). El árbol es: `<body>` → skip-link → `{children}` → 2 `<script type="application/ld+json">`.
- `metadata` = `buildMetadata({...path:"/"})` + `metadataBase: new URL(site.url)` + `manifest` + `icons` (favicon.ico, icon-192/512, apple-touch-icon).
- `import "./globals.css"` está **sólo aquí** (verificado por grep): globals.css se aplica a **todas** las rutas, sin excepción.
- Los dos JSON-LD (`organizationJsonLd`, `websiteJsonLd`) se inyectan en **todas** las páginas, incluida cualquier ruta nueva.

## 3. Tokens CSS exactos de `app/globals.css`

Bloque `:root` recuperado 1:1 del CSS de producción original (líneas 8-30):

```
--paper: #0a0a0f      --radius-sm: 4px       --font-display: var(--font-space-grotesk), "Helvetica Neue", sans-serif
--ink: #f2f0ea        --radius-md: 10px      --font-body: var(--font-geist), "Helvetica Neue", system-ui, sans-serif
--ink-2: #9494a0      --radius-lg: 18px      --font-mono: var(--font-geist-mono), "JetBrains Mono", ui-monospace, monospace
--bg-card: #14141c    --radius-xl: 28px
--bg-soft: #1d1d27    --section-y: 120px
--line: #f2f0ea       --container: 1280px
--primary: #c426c4    --motion: 1
--primary-2: #e04ce0
--accent: #c9ff3f
--accent-2: #00d4d4
```

Segundo `:root` (capa aditiva "Guide shop 2026", líneas 1683-1687):
`--brand-magenta: #c8006b`, `--cover-blue: #306ea6`, `--cover-peach: #f4b47a`.

Vars locales (no en `:root`): `--book-color` (inline en `Book3D`), `--bt: 26px` (`.book3d`), `--tilt-x`/`--tilt-y` (escritas por `TiltBook`), `--cover-bg`/`--cover-ink`/`--cover-accent` (`.cover-typo`).

**Reglas globales sin scope que van a alcanzar a `/360` sí o sí** (todas en globals.css, cargado por el root layout):
`*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}` · `html{color-scheme:dark;-webkit-font-smoothing:antialiased;scroll-behavior:smooth}` · `body{background:var(--paper);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.5}` · `img{max-width:100%;display:block}` · `a{color:inherit;text-decoration:none}` · `button{font:inherit;background:none;border:none}` · `::selection{background:var(--primary)}` · `:focus-visible{outline:2px solid var(--accent)}` · **`[id]{scroll-margin-top:96px}`** (línea 2607, aplica a *cualquier* elemento con id) · más el preflight de Tailwind v4.

Y **236 nombres de clase globales**, muchos genéricos y muy colisionables: `.container .section .btn .btn-primary .btn-ghost .btn-ink .hero .nav .foot .eyebrow .reveal .map .step .steps .flow .exp .exps .cta .wordmark .display-xl/-lg/-md .section__head .section__lead .faq__* .track-* .cform* .bento* .phone-app* .book3d*`…

## 4. Patrón exacto de un componente de sección

Server component sin `"use client"`, export nombrado, **una sola prop `content` tipada**, JSX y clases hardcodeadas, texto siempre desde `content.*`:

```tsx
// components/sections/Hero.tsx
import type { HomeContent } from "@/lib/content/home";
export function Hero({ content }: { content: HomeContent }) { … }
```

- El tipo sale del fallback: `lib/content/home.ts` exporta `defaultHomeContent` (`as const`) y
  `export type HomeContent = { -readonly [K in keyof typeof defaultHomeContent]: string }`.
- Interactividad aislada en wrappers `"use client"` de `components/ui/` (`Reveal`, `TiltBook`, `HeroForm`, `Icon`, `Book3D`). Las secciones se quedan en server.
- Ritmo visual: `<section className="section …" id="ancla" aria-labelledby="…">` → `.container` → `<Reveal delay={n}>` (delays escalonados 0/80/160/240/320) → `.section__head` con `.eyebrow` + `h2.display-lg.section__title` + `.section__lead`.
- Ajustes puntuales con `style={{}}` inline (`marginTop`, `color: "var(--primary)"`), nunca clases nuevas ad-hoc.
- `Footer` es la excepción: recibe props sueltas con default (`brandDesc`, `copyright`), no el objeto `content`.

## 5. `lib/site.ts` + `lib/seo.ts`

`site` es un objeto `as const` con `name`, **`url: "https://discoolver-landing.vercel.app"`**, `locale: "es_ES"`, `description`, `ogImage: "/og-default.jpg"`, `twitter`, `organization{name,legalName,logo,sameAs}`.

`buildMetadata({title, description, path = "", image, noindex}): Metadata` compone `const url = ${site.url}${path}` y devuelve `title`, `description`, **`alternates.canonical = url` (absoluto, no relativo → `metadataBase` no interviene en el canonical)**, `openGraph` completo (url, siteName, locale, type website, imagen 1200×630 con alt = title), `twitter` summary_large_image, y `robots` (index/follow + googleBot max-image-preview large / max-snippet -1, o `noindex` si se pide).

Uso: cada `page.tsx` hace `export const metadata: Metadata = buildMetadata({...})`. El root layout añade `metadataBase`, `manifest` e `icons`. Consumidores adicionales de `site.url`: `app/sitemap.ts` (rutas hardcodeadas `""` y `/influencers`), `app/robots.ts` (sitemap + host) y `lib/jsonld.ts`.

> **Ojo SEO**: el host canónico es un `*.vercel.app`. Si `/360` va a vivir en un dominio propio, `buildMetadata` le pondrá un canonical cross-domain incorrecto.

## 6. CMS (`lib/cms-pages.ts` + `scripts/fetch-cms-content.mjs`)

Bake en build-time, modelo **flat-fields**, una sección por página con `id: "content"`:

1. `scripts/fetch-cms-content.mjs` corre antes de `next build`, recorre `PAGE_SLUGS = ['home','influencers']`, pega a `${SF_CMS_API_URL}/pages?project=discoolver&slug=<slug>` con header `x-api-key`, normaliza `sections_json` (clave = `s.id ?? s.type`) y escribe `content/pages.json` (gitignored, hoy `{}` en local).
2. En la página: `loadCmsSections(slug)` hace `require("../content/pages.json")` dentro de try/catch → `{}` si falla; `section(cms,"content")` saca el data bag; `mergeContent(fallback, cmsData)` **sólo recorre las claves del fallback** y sólo pisa si el valor CMS es string no vacío.
3. Draft Mode: `loadCmsSectionsLive(slug)` hace fetch request-time con `x-preview-secret` + `cache:"no-store"`; devuelve `null` ante cualquier fallo y la página cae al bake.

**Sin envs**: el script imprime warning, crea `content/pages.json` = `{}` y hace `exit(0)` — **nunca `exit(1)`**. `mergeContent` no encuentra overrides y renderiza el copy hardcodeado de `lib/content/{home,influencers}.ts`. Consecuencia práctica: **en local nunca ves lo que el CMS va a pisar en producción** (es la trampa de las 40 colisiones documentada en el CLAUDE.md).

Nota para `/360`: `loadCmsSections` y `loadCmsSectionsLive` tipan el slug como `"home" | "influencers"`, y `PAGE_SLUGS` está hardcodeado en el script. Meter contenido de `/360` en el CMS obliga a ampliar ambos (edición aditiva, sin riesgo para B2C).

## 7. Fuentes: cómo añadir Poppins + Inter sin romper el B2C

Las tres fuentes actuales se declaran con `next/font/google` **dentro de `app/layout.tsx`** y se cuelgan de `<html className={...variable}>`. La tentación es añadir ahí Poppins e Inter — **no lo hagas**: modifica el fichero raíz del B2C, mete dos descargas de fuente y dos `<link rel=preload>` en *todas* las páginas B2C, y `--font-body` seguiría apuntando a Geist igual.

La vía limpia y de cero-impacto: `next/font` funciona en **cualquier módulo**, y la clase `.variable` puede colgarse de **cualquier elemento**, no sólo de `<html>`. Fichero nuevo:

```ts
// /Users/carlosjacoste/Developer/Claude/clients/discoolver/web/lib/fonts-360.ts
import { Poppins, Inter } from "next/font/google";

export const poppins360 = Poppins({
  subsets: ["latin"], variable: "--font-360-display", display: "swap",
  weight: ["500", "600", "700"],           // sólo los pesos que uses: Poppins no es variable
});
export const inter360 = Inter({
  subsets: ["latin"], variable: "--font-360-body", display: "swap",
});
```

Se aplican en el `<div>` raíz del layout de `/360`. Las variables `--font-space-grotesk/geist/geist-mono` siguen intactas en `<html>` y el B2C no descarga ni un byte de Poppins/Inter (Next sólo preloadea la fuente en las rutas donde se usa).

## 8. Receta del route group `/360` aislado

**Estructura** (todo ficheros nuevos; la URL `/360` exige una carpeta literal `360` — un grupo `(360)` con paréntesis **no** genera segmento):

```
app/(b2b)/layout.tsx        ← layout del grupo: fuentes + CSS + wrapper de scope
app/(b2b)/three60.css       ← tokens y clases propias, importado SÓLO aquí
app/(b2b)/360/page.tsx      ← la landing → URL /360
components/b2b/…            ← secciones propias, NO reutilizar components/layout/*
lib/fonts-360.ts            ← Poppins + Inter
lib/seo-360.ts              ← si el host canónico difiere del de site.ts
```

**Layout del grupo:**

```tsx
// app/(b2b)/layout.tsx
import { poppins360, inter360 } from "@/lib/fonts-360";
import "./three60.css";

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="s360" className={`s360 ${poppins360.variable} ${inter360.variable}`}>
      {children}
    </div>
  );
}
```

**CSS con scope duro** — la regla no negociable: **ni un `:root`, ni una clase sin prefijo**.

```css
/* app/(b2b)/three60.css — NO poner @import "tailwindcss": ya está en globals.css
   y duplicarlo duplica preflight. Las utilidades Tailwind v4 se generan
   escaneando todo el proyecto, así que se pueden usar en /360 sin importar nada. */

.s360 {
  /* tokens propios, aislados: viven en el div, no en :root */
  --s360-bg: #ffffff;
  --s360-ink: #0d1117;
  --s360-primary: #1a4fd6;
  --s360-display: var(--font-360-display), system-ui, sans-serif;
  --s360-body: var(--font-360-body), system-ui, sans-serif;

  /* corta la herencia del body B2C */
  background: var(--s360-bg);
  color: var(--s360-ink);
  font-family: var(--s360-body);
  min-height: 100dvh;
  isolation: isolate;
}

/* alcanza html/body sin tocar app/layout.tsx: sólo aplica cuando /360 está montado.
   Necesario para el overscroll de iOS, la scrollbar y los controles nativos
   (globals.css fija html{color-scheme:dark}). */
html:has(#s360) { color-scheme: light; background: var(--s360-bg); }
html:has(#s360) body { background: var(--s360-bg); }

/* neutraliza reglas globales que llegan por el root layout */
.s360 :focus-visible { outline: 2px solid var(--s360-primary); }
.s360 ::selection    { background: var(--s360-primary); color: #fff; }
.s360 [id]           { scroll-margin-top: 24px; }   /* globals.css impone 96px a todo [id] */

/* TODAS las clases con prefijo: hay 236 clases globales, muchas genéricas */
.s360-hero { … }
.s360-section { … }
.s360-btn { … }
```

**Metadata/canonical**: `app/(b2b)/360/page.tsx` debe exportar su propia `metadata` (el root layout no define `title.template`, así que sin `title` propio heredaría "Discoolver — Guías de viaje curadas de creadores"). Si el host canónico es el mismo, `buildMetadata({..., path:"/360"})` sirve; si no, un `lib/seo-360.ts` clon con su base URL — no toques `site.url`, lo consumen sitemap, robots, jsonld y los canonicals del B2C.

### Riesgos concretos en ESTE proyecto

1. **`:root` en el CSS de `/360` contamina el B2C de forma persistente.** Es el riesgo nº1. El CSS de un segmento se carga al entrar en `/360`, pero en navegación cliente (SPA) **no se descarga** al volver a `/`; unos tokens redefinidos en `:root` se quedarían pegados y la home se vería con la paleta B2B hasta un hard reload. Con scope en `.s360` esto es imposible.
2. **Colisión de nombres**: 236 clases globales, muchas genéricas (`.container`, `.section`, `.btn`, `.hero`, `.nav`, `.foot`, `.eyebrow`, `.cta`, `.map`, `.step`, `.flow`). Sin prefijo `s360-`, `/360` heredaría estilos B2C aleatorios y —peor— cualquier clase que añadas a globals.css afectaría al B2C.
3. **No confíes en el orden de la cascada.** globals.css entra por el root layout y el CSS del grupo después, pero el orden de chunks con Turbopack no es un contrato. Gana siempre por **especificidad** (`.s360 x`), no por posición.
4. **Regla de oro del CLAUDE.md**: `app/globals.css` es CSS recuperado 1:1 del bundle de producción original; sólo se permiten capas aditivas al final y ya hubo una regresión real (los `clamp()` del hero). Para `/360`, **fichero CSS aparte**, no capa nueva en globals.css.
5. **`[id]{scroll-margin-top:96px}` y `html{color-scheme:dark}`** llegan a `/360` sí o sí y son de las que más despistan (anclas desplazadas, inputs y scrollbar oscuros sobre fondo claro). Están cubiertas arriba.
6. **El skip-link y los 2 JSON-LD del root layout se renderizan también en `/360`**: el skip-link apunta a `#main-content` (pon ese id en el `<main>` de `/360` o queda muerto) y los JSON-LD declaran Organization/WebSite de la marca B2C. Quitarlos exige tocar `app/layout.tsx` → no lo hagas; si `/360` necesita su propio schema, añádelo dentro del grupo.
7. **`<html lang="es">` es del root layout**: si `/360` va en otro idioma, no se puede cambiar sin tocar B2C (o sin partir en dos root layouts, ver punto 10).
8. **No importes `components/layout/Nav|Footer`** en `/360`: son `"use client"`, dependen de `usePathname`, tienen los links del B2C hardcodeados y usan `.nav__*`/`.foot__*` de globals.css. Nav propio.
9. **Deploy: el proyecto es git-connected a `main`** — cualquier push publica `/360` en producción junto con el B2C, y dispara además builds en salsaburgers, startupsfactory, ncglobalassets y adrian-grooves. Verifica con `node scripts/verify-project-links.mjs clients/discoolver/web` (PASS) antes de cualquier `vercel --prod` manual.
10. **Si necesitas aislamiento total** (`<html>`/`<body>` propios, sin globals.css, sin preflight compartido) la única vía en App Router son **dos root layouts**: borrar `app/layout.tsx` y crear `app/(b2c)/layout.tsx` + `app/(b2b)/layout.tsx`, moviendo `page.tsx`, `influencers/`, `privacidad/`, `not-found.tsx` dentro de `(b2c)`. Eso **sí toca el B2C** (mueve ficheros, y la navegación entre grupos pasa a ser full page reload). Con la receta de `.s360` no hace falta.
11. **SEO**: `app/sitemap.ts` tiene las rutas hardcodeadas; `/360` no aparecerá hasta añadirla ahí (edición aditiva de 1 línea, sin efecto en B2C).
12. **CMS**: si `/360` va a ser editable, amplía la unión de slugs en `/Users/carlosjacoste/Developer/Claude/clients/discoolver/web/lib/cms-pages.ts` y `PAGE_SLUGS` en `scripts/fetch-cms-content.mjs`, y **siembra la página en sf-cms con el set de campos nuevo ANTES de desplegar** (proyecto Supabase `dmzecrlkclocqaywkjtc`, proyecto discoolver `674dda33-f0dd-4d2f-8433-92aa86941caf`) — en local no verás las colisiones porque sin envs sólo renderizan los fallbacks.
13. **Formulario**: si `/360` capta leads, reutiliza `app/api/waitlist/route.ts` añadiendo una clave a `SUBJECTS` (p. ej. `"b2b-360"`) y los campos nuevos a la whitelist `EXTRA_FIELDS` — **un campo que no esté en la whitelist se pierde en silencio**. Y `WAITLIST_FORWARD_EMAIL` sigue sin definir en Vercel (fallback `carlos@discoolver.com`, el único buzón ya activado en formsubmit).
14. **`public/assets/` pesa ~550MB sin comprimir**; no añadas más imágenes pesadas para `/360` sin pasar por `sips`.