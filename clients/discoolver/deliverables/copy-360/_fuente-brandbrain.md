# EXTRACCIÓN LITERAL — Brand Brain discoolver

**Fuentes leídas íntegras:**
- `/Users/carlosjacoste/Developer/Claude/clients/discoolver/briefing/index.html` (1074 líneas)
- `/Users/carlosjacoste/Developer/Claude/clients/discoolver/brand-brain.json` (118 líneas)

⚠️ **Aviso de nomenclatura:** en ningún punto de los dos documentos la marca se llama "discoolver 360". Se llama **`discoolver`** (siempre minúscula). El único "360" del corpus es el hashtag `#discoolver360` en un post de Instagram. El pack se titula "discoolver — Brand Intelligence Pack · 2025", by Startup Factory.

---

## 1. POSITIONING STATEMENT (palabra por palabra)

Hay **dos versiones aprobadas**, una en cada archivo. No son idénticas.

**A) Versión larga — `briefing/index.html`, sección 03 "Dónde jugamos", card "Positioning Statement"** (en cursiva y entrecomillado en el original):

> "Para gestores de destinos turísticos que quieren digitalizar, personalizar y monetizar la experiencia del viajero, **discoolver** es la única plataforma SaaS todo-en-uno que combina marketplace, POS, planificador de viajes, calendario de eventos e inteligencia de negocio en un único ecosistema pensado desde el primer día para destinos."

(`discoolver` va en `<strong style="color:var(--primary)">`, es decir, en magenta #FF00C8.)

**B) Versión corta — `brand-brain.json`, campo `positioning`:**

> "La plataforma SaaS todo-en-uno para destinos turísticos que quieren digitalizar, personalizar y monetizar la experiencia del viajero sin desarrollar tecnología propia."

**Titular del diferenciador (sección 06, bloque hero centrado, Poppins 900 clamp(22px,4vw,48px)):**

> "La única plataforma SaaS **todo-en-uno** pensada desde el primer día para **destinos turísticos**"

(`todo-en-uno` en magenta `var(--primary)`, `destinos turísticos` en cyan `var(--accent)`.)

**Misión (sección 02 + JSON `mission`):**
- HTML: "Digitalizar y personalizar la experiencia del viajero, conectando turistas con el tejido económico local de cada destino a través de tecnología SaaS que aprende y evoluciona con el destino."
- JSON: "Digitalizar y personalizar la experiencia del viajero, conectando turistas con el tejido local y económico de cada destino a través de tecnología SaaS."

**Modelo de negocio (JSON `business_model`):** "B2B SaaS para destinos turísticos y organismos públicos. Módulos contratables por separado, siempre en modo subscripción. Comisión del 10-15% sobre ventas en marketplace."

---

## 2. LOS 3 DIFERENCIALES

Sección 06 · "Por qué discoolver". Tres `.card` en `grid-3`, cada una con emoji, título (`.pillar-name`) y explicación (13px, `var(--muted)`, line-height 1.6):

| # | Emoji | Título exacto | Explicación literal |
|---|---|---|---|
| 1 | 🔌 | **Integración sin fricción** | "Todos los módulos se integran en la web existente del destino o se despliegan como plataforma nueva. Sin desarrollo propio. Sin app obligatoria." |
| 2 | 📊 | **Datos propios del destino** | "El destino es dueño de sus datos. Cuadro de mando e informes personalizados para tomar decisiones estratégicas sobre el viajero real." |
| 3 | 💰 | **Monetización real** | "Marketplace + POS + comisiones 10-15% sobre ventas. El destino convierte tráfico turístico en ingresos directos para el tejido local." |

**Diferenciador maestro (JSON `differentiator`), texto completo:**
> "La única plataforma que unifica marketplace, POS, planificador de viajes, calendario de eventos y BI en un ecosistema SaaS pensado desde el primer día para destinos turísticos — no una app genérica adaptada."

---

## 3. LOS 7 MÓDULOS (nombre, precio, qué hace, para quién)

Fuente única de precios: `brand-brain.json` → `products[]`. **El briefing HTML no contiene precios**, solo lista los 7 en un carrusel ("Marketplace · POS · Plan My Trip · Calendario · Asistente de Voz · Señalética · Business Intelligence").

| # | Nombre exacto | Precio exacto | Qué hace (literal) | Para quién |
|---|---|---|---|---|
| 1 | **Market Place** | `€750/mes` | "Sistema de venta de servicios turísticos propios y de colaboradores. Hoteles, productos, eventos." | Destino + colaboradores (hoteles, productos, eventos). *No explicitado más allá de esto.* |
| 2 | **Software de Caja** | `€495/mes + €50/POS` | "Sistema de cobros para oficinas turísticas y monumentos. Diseñado a medida." | **Literal: oficinas turísticas y monumentos** |
| 3 | **Plan My Trip** | `€150/mes` | "Planificador de rutas personalizadas por tipología de viajero, duración y presupuesto. Premio Hospitality 2021." | Viajero / turista (front-end del destino) |
| 4 | **Calendario Inteligente** | `€100/mes` | "Agenda cultural y de eventos del destino con venta de entradas integrada." | Destino (agenda cultural) + visitante comprador |
| 5 | **Asistente de Voz Local** | `€250/mes` | "Chatbot IA entrenado con datos del destino. Atención al visitante 24/7." | **Literal: el visitante, 24/7** |
| 6 | **Señalética & Totems** | `€100/mes mantenimiento` | "Displays, totems interactivos y QR en puntos clave del destino." | Destino, puntos físicos clave |
| 7 | **Business Intelligence** | `Incluido con módulos` | "Cuadro de mando e informes personalizados con toda la data del ecosistema." | Gestor del destino (decisor) |

**Notas literales adicionales sobre módulos, dispersas en el HTML (reutilizables tal cual):**
- Software de Caja: *"El Software de Caja de discoolver se integra en 15 días. Sin hardware complejo. Sin meses de desarrollo. Solo conectarlo a tu catálogo de productos locales y listo."*
- Plan My Trip: *"Escoge tipo de compañía → indica intereses → Plan My Trip genera una ruta descargable, reservable y compartible en segundos."*
- Plan My Trip / premio: *"Premio Hospitality 2021 — Plan My Trip (Digital Enterprise Show)"* · *"Reconocido en el Digital Enterprise Show como la mejor herramienta de personalización turística."* · *"el planificador de rutas que convierte a turistas en expertos locales"*
- Asistente de Voz: *"Tu chatbot de destino ahora responde preguntas complejas, crea rutas personalizadas y actualiza su información en tiempo real. Atención al visitante 24/7 sin coste de personal."*
- Frase-resumen del set completo: *"7 módulos. 1 plataforma. Todo lo que tu destino necesita."* / *"Cada uno funciona solo. Juntos, son un ecosistema turístico completo."*

---

## 4. PERSONA — "EL DIRECTOR DE DESTINO" (primaria)

Sección 04 · "Nuestros clientes", `.persona` con barra superior en gradiente magenta→cyan. Cruce HTML + JSON `audience_primary`.

- **Nombre:** El Director de Destino
- **Cargo (HTML `.persona-role`):** "Gestor de patronato · Concejal de turismo · Director DMO"
  **(JSON `role`):** "Gestor de patronato turístico, concejal de turismo, director de DMO"
- **Edad:** `38–55 años` (JSON: `"38-55"`)
- **Dónde:** "España — destinos medianos y grandes con potencial turístico" (JSON: "España, destinos turísticos medianos y grandes")
- **Dolor (literal HTML):** "Turismo masificado en zonas saturadas, falta de datos del viajero, comercio local invisible, nula monetización digital del destino."
  (JSON, sin "del destino" final: "…nula monetización digital")
- **Deseo (literal HTML):** "Digitalizar el destino, redistribuir el flujo de visitantes, atraer turismo de calidad y tener datos para justificar inversiones."
  (JSON: "…tener datos para tomar decisiones")
- **Canales:** LinkedIn (badge), Fitur / WTM, Email directo. JSON añade: "Asociaciones sectoriales".
- **Job titles para segmentación de LinkedIn Ads (sección 17, literal):** "Director de Turismo", "Concejal de Turismo", "Gestor de Destino" — "Segmentación por sector turístico y geografía España."

### Objeciones y "qué le hace decir sí"

⚠️ **NO EXISTE una sección explícita de objeciones ni de triggers de decisión en ninguno de los dos documentos.** No las invento. Lo más cercano — y aprobado — es esto, que funciona como material de manejo de objeciones:

**Insight de decisión (sección 08b, Pilar 2, literal):**
> "Los gestores de destino toman decisiones por referencia. Un caso con datos concretos vale más que diez promesas. Ronda es el anchor case — construir a partir de él."

**Mecánica de conversión aprobada (sección 13, campaña "Temporada Alta 2025") — cada bullet neutraliza una objeción implícita:**
- "Demo gratuita de 30 min sin compromiso" → *objeción: riesgo/tiempo*
- "Onboarding garantizado en 15 días" → *objeción: "esto tarda meses"*
- "Primer mes sin coste para destinos nuevos" → *objeción: presupuesto*
- "Case study Ronda como anchor de conversión" → *objeción: "¿a quién más le funciona?"*
- Timing (literal): "los destinos cierran presupuestos de digitalización en Q2 para implementar en Q3"

**Anti-objeciones producto (de los diferenciales):** "Sin desarrollo propio. Sin app obligatoria." · "Sin hardware complejo. Sin meses de desarrollo." · "El destino es dueño de sus datos."

---

## 5. OTRAS PERSONAS Y SEGMENTOS DEFINIDOS

### 5.1 Persona secundaria — "El Empresario Local"
`.persona` con override `style="--primary:#00D4FF"` (se pinta en cyan, no en magenta).

- **Cargo:** "Restaurante · Hotel boutique · Comercio cultural · Guía turístico" (JSON: "Propietario de restaurante, hotel boutique, comercio cultural, guía turístico")
- **Edad:** `30–50 años`
- **Dónde:** "Fuera de las zonas turísticas principales del destino"
- **Dolor:** "Invisible para turistas, sin presencia digital real, dependencia de TripAdvisor o Google sin control sobre el relato." (JSON: "…dependencia de plataformas genéricas (TripAdvisor, Google)")
- **Deseo:** "Ser descubierto por el turista adecuado, digitalizar ventas y entender a su cliente potencial."
- **Canales:** Instagram (badge), WhatsApp, Asociaciones. JSON añade "Ferias locales", "Asociaciones de comerciantes".

### 5.2 Tres tiers de aliados/creators (sección 16 "Alianzas estratégicas")
| Tier | Nombre | Volumen | Descripción literal | Acción/Budget |
|---|---|---|---|---|
| TIER 1 — SECTOR (magenta) | **Decisores del sector** | 10 (JSON) | "Directores de patronatos, gestores de DMOs, técnicos de SEGITTUR e ITH. No son influencers tradicionales, son prescriptores B2B." | "Acción: co-marketing + aparición mutua en contenido" |
| TIER 2 — TRAVEL CREATORS (cyan) | **50k – 500k seguidores** | 5 | "5 creators especializados en viajes por España. Uso de la app en destinos donde discoolver opera. Cobertura natural de la experiencia." | "Budget: €500–€1.500/colaboración" |
| TIER 3 — MICROINFLUENCERS (#A855F7) | **5k – 50k seguidores** | 15 | "15 creadores de contenido local en destinos donde opera discoolver. Ronda, Costa del Sol, etc. Autenticidad máxima." | "Compensación: experiencias en destino + mención" |

### 5.3 Competidores mapeados (segmentación de mercado)
Ejes del mapa: **"Eje X: Foco Consumer → Foco Destino / Eje Y: Genérico → Especializado"**. Cuadrantes: "GENÉRICO + CONSUMER" = TripAdvisor, Google Maps. "ESPECIALIZADO + DESTINO" = **◑▶ discoolver** (marcado "ZONA LÍDER"). Otro cuadrante: Civitatis, Musement. Otro: "Destino Turístico Inteligente".

- **TripAdvisor:** "Solo B2C. Sin herramientas de monetización ni datos para el destino." (JSON amplía: "…ni integración con el tejido local")
- **Civitatis:** "Solo booking de actividades. No integra el comercio local ni el destino." (JSON: "…sin datos del visitante para el destino ni POS")
- **Google Maps** (solo JSON): "Plataforma genérica sin personalización ni módulos de venta específicos para destinos"
- **Musement (TUI)** (solo JSON): "Foco en grandes operadores, no en el comercio local ni en gestores de destino independientes"

---

## 6. TONO DE VOZ

### 6.1 Atributos ("Voz de Marca — Suena a discoolver", 5 `.voice-pill` con emoji)
`🚀 Innovador` · `🏘️ Local` · `💡 Directo` · `📊 Basado en datos` · `🌍 Con impacto social`

⚠️ **Divergencia:** JSON `brand_voice` = `["innovador", "local", "directo", "tecnológico", "con impacto social"]` — el 4º atributo es **"tecnológico"** en JSON y **"Basado en datos"** en el briefing. El briefing es el documento visual aprobado; recomiendo usar "Basado en datos".

### 6.2 ✅ Sí suena a discoolver (literal, 4 bullets)
1. "Concreto, con datos y casos reales"
2. "Habla al gestor de igual a igual"
3. "Conecta tecnología con impacto humano"
4. "Orgulloso de lo local sin ser folclórico"

### 6.3 ❌ No suena a discoolver (literal, 4 bullets)
1. "Corporativo y frío sin alma"
2. "Promesas vacías sin casos reales"
3. "Lenguaje turístico genérico y tópico"
4. "Tecnicismos sin traducción al beneficio"

### 6.4 Valores de marca (JSON `brand_values`)
"innovación turística", "experiencia local auténtica", "digitalización accesible", "impacto económico local", "datos al servicio del destino"

### 6.5 Ejemplos de aplicación del tono presentes en el doc
- Tono "de igual a igual" con dato duro: *"8:30. El dashboard muestra 340 turistas activos en la ciudad. 67 han usado Plan My Trip esta mañana. 12 están en zonas que nunca visitaban antes. Eso es el futuro del turismo."*
- Tono "local sin folclore": *"No busca el Hard Rock Café. Busca la taberna que solo conocen los locales."*
- Tono directo con guiño: *"La guía definitiva para atraer turismo de calidad (y no de 'selfie y me voy')"*
- Tono impacto humano: *"José lleva 20 años en su taller de artesanía. Siempre fue 'ese sitio que está por ahí cerca del Puente'. Con discoolver, está en las rutas de Plan My Trip. Ahora exporta a 8 países."*

---

## 7. SISTEMA VISUAL EXACTO (tokens reproducibles en Next.js)

### 7.1 Paleta — variables CSS `:root` (copia literal)
```css
:root{
  --primary:   #FF00C8;              /* Magenta — color de marca, acentos, CTA, sec-label */
  --secondary: #4D4D6E;              /* Slate — dots inactivos, bordes tag-muted */
  --accent:    #00D4FF;              /* Cyan — segundo acento, KPI 30d, persona secundaria */
  --bg:        #0A0A16;              /* Dark BG — fondo base body/footer */
  --bg2:       #12121F;              /* Fondo de secciones pares (nth-child(even)) */
  --bg3:       #1A1A2E;              /* Superficie de cards / paneles */
  --text:      #FFFFFF;              /* Texto principal */
  --muted:     #9999BB;              /* Texto secundario / labels */
  --border:    rgba(255,0,200,0.15); /* Borde universal = magenta al 15% */
}
```
Los 4 swatches explícitamente etiquetados en la sección "Brand DNA → Colores": **#FF00C8 Magenta · #4D4D6E Slate · #00D4FF Cyan · #0A0A16 Dark BG**.

### 7.2 Colores funcionales adicionales (no están en `:root` pero se usan)
```
#A855F7  Violeta  — pilar "Tips para Destinos" (20%), semana 3, tier 3
#F97316  Naranja  — pilar "Experiencia Local" (15%)
#22C55E  Verde    — pilar "Producto & Demo" (10%), semana 4
#12002A  Púrpura profundo — solo como paso intermedio del gradiente hero
#E1306C  Instagram badge (fondo rgba(225,48,108,.15))
#5BA4CF  LinkedIn badge (fondo rgba(10,102,194,.15)) — también color de barra "LinkedIn Ads" en el chart
#FF4444  YouTube badge (fondo rgba(255,0,0,.15))
rgba(77,255,150,.15)  — gradiente de la Fase 3 del roadmap (.rp3)
```

### 7.3 Alfas derivadas del magenta/cyan (el patrón real del sistema)
```
rgba(255,0,200,.03)  hover de fila de tabla
rgba(255,0,200,.08)  fondo de .filter-btn activo/hover
rgba(255,0,200,.10)  gradiente del bloque diferenciador (135deg)
rgba(255,0,200,.15)  --border, .tag-primary bg, círculo numerado pilar 1
rgba(255,0,200,.20)  .p1-header bg, .rp1 gradiente
rgba(0,212,255,.05)  segundo stop del gradiente diferenciador
rgba(0,212,255,.15)  .tag-accent bg, .p2-header, .rp2, círculo pilar 2
rgba(77,77,110,.20)  .tag-muted bg, .p3-header
rgba(168,85,247,.15) tag tier 3
rgba(249,115,22,.15) tag Experiencia Local
rgba(34,197,94,.15)  tag Producto & Demo
rgba(255,255,255,.04) border-bottom de celdas de tabla
rgba(255,255,255,.20) borde del swatch oscuro
rgba(10,10,22,0.95)  fondo de nav + backdrop-filter:blur(12px)
```

### 7.4 Gradientes (literales)
```css
/* Hero */               linear-gradient(135deg,#0A0A16 0%,#12002A 50%,#0A0A16 100%)
/* Barra superior persona (3px) e idea-card (2px) */
                         linear-gradient(90deg,var(--primary),var(--accent))
/* Bloque diferenciador */
                         linear-gradient(135deg,rgba(255,0,200,.1),rgba(0,212,255,.05))
/* Cuadrante líder mapa competencia */  idem al anterior
/* Roadmap headers */
.rp1  linear-gradient(90deg,rgba(255,0,200,.2),transparent)
.rp2  linear-gradient(90deg,rgba(0,212,255,.15),transparent)
.rp3  linear-gradient(90deg,rgba(77,255,150,.15),transparent)
```

### 7.5 Tipografía — 3 familias, pesos exactos cargados
```html
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```
| Familia | Pesos cargados | Rol asignado (literal del doc) |
|---|---|---|
| **Poppins** | 300, 400, 600, 700, 900 | "Display — Títulos y hero". Aplicada a `h1,h2,h3,.display`. Uso dominante: **900** (sec-title, hero-logo, stats, pillar-pct, footer-brand) y **700** (persona-name, post-hook, week-title, phase-name, roadmap-header, p-col-header) |
| **Inter** | 300, 400, 500, 600 | "Body — Texto corrido". `body{font-family:'Inter',sans-serif}` |
| **Space Mono** | 400, 700 | Etiquetas, metadatos, badges, KPIs, tooltips, headers de tabla. `code,.mono` |

**Escala tipográfica literal:**
```
.hero-logo    clamp(60px,10vw,120px) / Poppins 900 / line-height:1
.sec-title    clamp(36px,5vw,72px)   / Poppins 900 / uppercase / line-height:1 / margin-bottom:40px
diferenciador clamp(22px,4vw,48px)   / Poppins 900 / line-height:1.2 / max-width:800px
.hero-tagline clamp(16px,2vw,24px)   / muted / line-height:1.6 / max-width:600px
.sec-label    10px Space Mono / letter-spacing:.2em / uppercase / color:var(--primary) / mb:16px
.hero-tag     13px Space Mono / letter-spacing:.2em / uppercase / color:var(--primary)
.stat-val     32px Poppins 900 magenta   |  .stat-label 11px Space Mono muted
.pillar-pct   48px Poppins 900           |  .pillar-name 18px/600  |  .pillar-desc 13px lh1.6
.persona-name 24px Poppins 700 | .persona-role 11px Space Mono magenta | .persona-val 14px lh1.4
.persona-key  10px Space Mono muted uppercase
.post-hook    15px Poppins 700 lh1.3 | .post-copy 12px muted lh1.6 | .post-format 9px Space Mono
.kpi-baseline 22px/700 | .kpi-metric 11px Space Mono uppercase | .kpi-target 11px Space Mono
.cut-time     13px Space Mono 700 magenta | .cut-action 13px lh1.5 | .cut-screen 11px cyan
.month-label  9px Space Mono muted | .month-milestone 10px lh1.3
.tag / badges 10px / 9px Space Mono, uppercase, letter-spacing .1em
body copy general: 13px–16px, line-height 1.6 / 1.7 / 2 (listas)
```
**Letter-spacing del sistema:** `.2em` (sec-label, hero-tag), `.1em` (tags, axis-label), `.05em` (botón CTA).

### 7.6 Radios (border-radius) — inventario completo
```
50%          .dot (8×8px), círculos numerados de pilar (48×48px)
4px          tooltip .dot::after
6px          .month-cell
8px          .comp-badge, .example-post, .p-item, .week-header, .p-col-header (8px 8px 0 0)
12px         .stat-card, .swatch (80×80), .font-spec, .post-card, .kpi-card, .offline-card,
             .phase, .canva-thumb, .offline/idea internos, .month? , panel KPI mes 1
16px         .card, .persona, .comp-map, .pillar-card, .reel-card, .idea-card, .roadmap-phase
20px         .tag (pill), .filter-btn, bloque diferenciador (padding 48px)
30px         .voice-pill (padding 8px 20px)
50px         CTA "Solicitar Demo Gratuita →" (padding 16px 40px)
```

### 7.7 Sombras
**NO HAY NINGUNA.** Verificado por grep: cero declaraciones `box-shadow` en todo el documento. La profundidad se construye **solo** con: capas de fondo (`--bg` / `--bg2` / `--bg3`), borde magenta al 15% y gradientes. **Es un rasgo definitorio del sistema — no añadir sombras al portarlo a Next.js.**

### 7.8 Bordes y acentos estructurales
```
border: 1px solid var(--border)              /* borde por defecto de card/persona/kpi/post */
border-left: 4px solid <color-pilar>         /* .pillar-card */
border-left: 2px solid var(--primary)        /* .example-post */
border-top: 3px solid var(--primary|accent|#A855F7|#22C55E)  /* cards de campaña/semana/tier */
::before height 3px gradiente 90deg          /* .persona */
::before height 2px gradiente 90deg          /* .idea-card */
border: 2px solid var(--primary)             /* cuadrante líder del mapa */
border: 1px dashed var(--border)             /* .canva-thumb (placeholder) */
border-right:1px solid var(--border)         /* nav */
border-top:1px solid var(--border)           /* footer */
```

### 7.9 Layout y espaciado
```
section        min-height:100vh; padding:100px 80px 100px 116px
               section:nth-child(even){background:var(--bg2)}
mobile (≤768)  section{padding:60px 20px}; nav{display:none};
               .grid-2,.grid-3,.hero-stats,.p-matrix → grid-template-columns:1fr
nav            fixed left, width:56px, height:100vh, bg rgba(10,10,22,0.95),
               backdrop-filter:blur(12px), z-index:100, gap:10px
footer         padding:60px 80px 60px 116px
.card          padding:28px      .persona padding:32px     .stat-card padding:24px
.grid-2        1fr 1fr, gap:24px   .grid-3 repeat(3,1fr), gap:20px
.hero-stats    repeat(4,1fr), gap:20px, margin-top:60px, max-width:800px
.kpi-grid      repeat(auto-fill,minmax(200px,1fr)), gap:16px
pilares        repeat(auto-fill,minmax(300px,1fr)), gap:20px
posts grid     repeat(3,1fr), gap:16px
.month-grid    repeat(12,1fr), gap:4px
.phase-bar     repeat(5,1fr), gap:4px  + .phase::after{content:'→'}
html{scroll-behavior:smooth}  body{overflow-x:hidden}
```

### 7.10 Animación / microinteracción
```css
.reveal{opacity:0;transform:translateY(32px);transition:all .6s ease}
.reveal.visible{opacity:1;transform:none}     /* IntersectionObserver threshold 0.1 */
.dot{transition:all .3s} .dot:hover,.dot.active{background:var(--primary);transform:scale(1.4)}
.dot::after{opacity:0 → 1; transition:opacity .2s}   /* tooltip con data-label */
.filter-btn{transition:all .2s}
.canva-thumb{transition:border-color .2s}
.r-item::before{content:'▶';color:var(--primary);font-size:9px}
IntersectionObserver nav: threshold 0.3
```

### 7.11 Charts (Chart.js, doughnut)
```js
Pilares:  labels ['Innovación Turística','Casos de Éxito','Tips Destinos','Experiencia Local','Producto & Demo']
          data [30,25,20,15,10]
          backgroundColor ['#FF00C8','#00D4FF','#A855F7','#F97316','#22C55E'], borderWidth:0, hoverOffset:8
Media:    labels ['LinkedIn Ads','Google Search','Meta Retargeting'], data [60,25,15]
          backgroundColor ['#5BA4CF','#FF00C8','#A855F7']
Legend:   position 'bottom', color '#9999BB', font {family:'Space Mono', size:11}, padding:16
```

### 7.12 Logotipo (patrón tipográfico)
```html
<div class="hero-logo">dis<span>cool</span>ver</div>   /* span en var(--primary) = #FF00C8 */
```
Siempre en minúscula. El fragmento **"cool"** va en magenta, "dis" y "ver" en blanco. Mismo patrón en el footer (`.footer-brand`, 24px Poppins 900). Marca alternativa en el mapa de competencia: `◑▶ discoolver`.

---

## 8. CLAIMS, TITULARES Y FRASES YA APROBADAS (reutilizables tal cual)

### 8.1 Tagline y claims maestros
- **"El futuro del turismo hoy en tu destino"** ← tagline principal (JSON `tagline`)
- **"La nueva forma de conectar con tus visitantes"** ← tagline alternativo (JSON `tagline_alt`)
- Hero del briefing, ambos unidos: *"El futuro del turismo hoy en tu destino — La nueva forma de conectar con tus visitantes"*
- Variante con CTA (reel): *"El futuro del turismo, hoy en tu destino → discoolver.com"*
- **"La única plataforma SaaS todo-en-uno pensada desde el primer día para destinos turísticos"**
- **"7 módulos. 1 plataforma. Todo lo que tu destino necesita."**
- *"Cada uno funciona solo. Juntos, son un ecosistema turístico completo."*
- *"discoolver los pone en el mapa. Literalmente."*
- *"Traditional = Cool. El viajero moderno quiere lo auténtico."*
- *"El reto del destino es hacer visible lo invisible."*

### 8.2 Barra de prueba social (4 stat cards del hero)
| Valor | Label |
|---|---|
| **2019** | Fundación |
| **200+** | Negocios integrados |
| **7** | Módulos SaaS |
| **#1** | Premio Hospitality 2021 |

### 8.3 El dato ancla (el claim más repetido del documento)
- *"El nuevo perfil de viajero gasta el **70% de su presupuesto en servicios locales**, no en transporte ni alojamiento."*
- *"El 70% del presupuesto del viajero 2025 va a servicios locales en destino. No a vuelos ni hoteles. Los destinos que no tienen herramientas para capturar ese gasto están perdiendo millones cada temporada."*
- *"El viajero 2025 gasta el 70% en servicios en destino. Solo el 30% en transporte y alojamiento. ¿Sabes dónde está ese 70% en tu destino?"*
- *"El turista del futuro gasta el 70% en servicios locales — ¿está tu destino preparado?"*
- Infografía aprobada: *"70% servicios locales vs 30% transporte y alojamiento"*

### 8.4 Los 3 insights clave (sección 02, literales)
1. "El turista 2025 es 100% digital, aprecia lo local y comparte experiencias de forma inmediata."
2. "Los destinos pierden el 70% de su potencial de monetización por falta de herramientas digitales propias."
3. "Los negocios locales fuera de zonas turísticas principales son invisibles sin tecnología que los ponga en el mapa del viajero."

### 8.5 Oportunidad / situación actual (literales)
- *"Los destinos que no digitalizan esta oferta pierden ingresos directos y turismo de calidad a manos de plataformas genéricas."*
- *"Proyectos validados en Ronda (200+ negocios) y Costa del Sol. Premio Hospitality 2021. Respaldo de SEGITTUR, ICEX, Tetuan Valley. Listo para escalar a nuevos destinos nacionales e internacionales."*

### 8.6 Headlines de conversión / hooks listos
- *"El turista del futuro ya llegó. ¿Está tu destino preparado para él?"*
- *"Ronda tenía un problema de concentración turística. Lo resolvieron con datos."*
- *"5 señales de que tu destino necesita digitalizarse ya"*
- *"3 pasos para descongestionar tu zona turística saturada (sin perder visitantes)"*
- *"Cómo convertir tu oficina de turismo en un punto de venta digital en 15 días"*
- *"La taberna que nadie conocía. Hoy tiene lista de espera."*
- *"¿Quieres ver discoolver funcionando en tu destino? Demo gratuita esta semana."*
- *"¿Tu destino está preparado para el nuevo viajero?"*
- *"¿Listo para activar este plan?"* + botón **"Solicitar Demo Gratuita →"** (magenta, radius 50px, Poppins 700 16px, padding 16px 40px, letter-spacing .05em, `mailto:info@discoolver.com`)

### 8.7 Case studies aprobados (con cifras)
**Ronda (anchor case):**
- "200+ negocios y propuestas locales integradas. Totems interactivos. Venta cruzada con hoteles."
- *"Antes del proyecto discoolver, el 80% de los turistas se quedaba en la zona del Puente Nuevo. 200+ negocios locales fuera del circuito eran invisibles. Hoy son el destino."*
- *"Antes: turistas concentrados en el Puente Nuevo. Después: ruta viva por toda la ciudad con 200+ propuestas locales activas en la plataforma."*
- Testimonio (pendiente de nombre real): **"Ahora tenemos datos de nuestros visitantes por primera vez" — Director de Turismo de Ronda** / *"'Por primera vez tenemos datos de verdad' — [Nombre], Turismo Ronda"*
- *"Ronda: de masificación a destino vivo"*

**Costa del Sol Tourism Hub:**
- "Señalética QR en puntos clave del destino. Integración marketplace."
- *"Costa del Sol en tu bolsillo. Así funciona el destino digital."* / *"QR en puntos estratégicos, marketplace de experiencias locales y datos en tiempo real para el destino."*
- *"Proyecto Costa del Sol: señalética inteligente que redistribuye el flujo turístico"*

### 8.8 Datos corporativos verificados (para footer/contacto en Next.js)
```
Nombre:     discoolver  (siempre minúscula)
Fundación:  2019
Industria:  Travel Tech / Destination Management SaaS
Web:        www.discoolver.com
Email:      info@discoolver.com
Teléfono:   +34 656 91 43 74
Premio:     Premio Hospitality 2021 — Plan My Trip (Digital Enterprise Show)
Footer literal: "info@discoolver.com · +34 656 91 43 74 · www.discoolver.com"
Crédito:    "Brand Intelligence Pack by Startup Factory · 2025"
```

### 8.9 Partners / logos (JSON `partners`, orden literal — bloque "confían en nosotros")
Tetuan Valley · Costa del Sol Tourism Hub · Digital Enterprise Show · ITH (Instituto Tecnológico Hotelero) · SEGITTUR · ICEX · Destino Turístico Inteligente · VOCCES · Clorian · FareHarbor · ĀTICCO · ZOHO · ByHours · Cover Manager · artiSplendore

### 8.10 Pilares de contenido (por si la landing lleva blog/recursos)
Innovación Turística 30% (#FF00C8) · Casos de Éxito 25% (#00D4FF) · Tips para Destinos 20% (#A855F7) · Experiencia Local 15% (#F97316) · Producto & Demo 10% (#22C55E)

---

## 9. HUECOS DETECTADOS (no inventados — pedir a cliente antes de publicar)
1. **Objeciones formales y triggers de decisión de la persona**: no existen como sección. Solo se pueden derivar de la mecánica de campaña (§4).
2. **Nombre real del Director de Turismo de Ronda** para el testimonio: aparece como `[Nombre]` en el doc.
3. **Precios**: solo viven en `brand-brain.json`, nunca fueron renderizados en el briefing visual → confirmar si son públicos antes de ponerlos en la landing.
4. **KPIs marcados `[ESTIMATE]`** en JSON (baselines de demos, leads, seguidores, tasa de cierre, MRR, budget) — no son datos reales.
5. **Divergencia de atributo de voz**: "tecnológico" (JSON) vs "Basado en datos" (briefing).
6. **Nombre de marca "360"**: no está respaldado por ninguno de los dos documentos.