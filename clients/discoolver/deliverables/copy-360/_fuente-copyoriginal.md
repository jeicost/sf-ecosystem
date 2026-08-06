# Copy B2B original discoolver.com — `/es/destinos` y `/es/alojamientos`

Fuentes leídas:
- `/Users/carlosjacoste/Developer/Claude/clients/discoolver/_snapshot/discoolver-com/COPY_B2B_ORIGINAL.md`
- `/Users/carlosjacoste/Developer/Claude/clients/discoolver/_snapshot/discoolver-com/destinos-es.html`
- `/Users/carlosjacoste/Developer/Claude/clients/discoolver/_snapshot/discoolver-com/alojamientos-es.html`

Ambas páginas son la **misma plantilla** (Next 12, clases `content-body-title` / `blue-card` / `list-cards` / `content-solutions-card`), con los bloques rellenados de forma distinta. El HTML es estático: no hay `<form>`, ni `<title>`, ni `meta description`, ni canonical, ni OG en ninguna de las dos.

---

## 1. Estructura de secciones (orden real en el DOM)

### `/es/destinos`

| # | Bloque | Clase | Contenido |
|---|---|---|---|
| 1 | Nav | `nav` | Logo 360 + Home / Destinos (activo) / Influencers / Alojamientos + `es` / Sing up / Login |
| 2 | Hero | `header-discoolver-360` | Título + subtítulo entrecomillado + 2 badges de app store |
| 3 | Titular + tags | `content-body-title` | H1 + tarjeta "highlighted city" con H5 + 7 tags `#` |
| 4 | Módulos destino | `content-body-title` | H4 "Herramientas para los destinos" + 3 cards |
| 5 | Doble blue-card | `list-content-blue-card` | 2 tarjetas azules, cada una con título + 1 card dentro |
| 6 | Titular huérfano | `content-body-title not-bottom-padding` | H1 solo, sin cuerpo ni CTA |
| 7 | Módulos turista | `content-body-title` | H4 "Herramientas para el turista" + 3 cards |
| 8 | Señalética | `content-blue-card` | Título + 2 "solution cards" con botón-etiqueta |
| 9 | Social proof | `section-row` | "Ya confían en nosotros..." + 4 logos (segitur, destino-turistico, ronda, tourism-hub) |
| 10 | CTA final | `content-want-us-in-your-city` | H5 + botón "Agendar una cita" |
| 11 | Footer | `footer-discoolver-360` | Logo + frase + botón "¿Te ayudamos?" + bloque Contacto (H1) + 3 redes |

### `/es/alojamientos`

| # | Bloque | Clase | Contenido |
|---|---|---|---|
| 1 | Nav | `nav` | Idéntico, con Alojamientos activo |
| 2 | Hero | `header-discoolver-360` | Título + subtítulo entrecomillado + 2 badges de app store |
| 3 | Titular | `content-body-title` | H1 + imagen `mobile_360.png`. **Sin tags** (aquí sí falta el bloque de tags que tiene destinos) |
| 4 | Módulos | `content-body-title` | H4 "Convierte a tu establecimiento en el alma del viaje" + 3 cards |
| 5 | Doble blue-card | `list-content-blue-card` | 2 tarjetas azules, cada una con título + 1 card dentro |
| 6 | **Segmentos** | `content-body-title` | H4 "Diseñamos soluciones a medida para" + 3 cards (Hoteles / Hostales / Property Managers) |
| 7 | Señalética | `content-blue-card` | Título + 2 "solution cards" con botón-etiqueta |
| 8 | Social proof | `section-row` | "Ya confían en nosotros..." + 5 logos (segitur, destino-turistico, vocces, tetuan-valley, tourism-hub) |
| 9 | CTA final | `content-want-us-in-your-city` | H5 + botón "Agendar una demo" |
| 10 | Footer | `footer-discoolver-360` | Idéntico a destinos (salvo un punto final) |

**Diferencia estructural clave:** destinos tiene un H1 huérfano extra (bloque 6) y el bloque de tags de la app B2C; alojamientos tiene en su lugar el bloque de segmentación, que es lo único genuinamente B2B de las dos páginas.

---

## 2. Transcripción literal

> Se respetan erratas, acentos ausentes y dobles espacios del original. Los `␣␣` marcan dobles espacios reales en el HTML.

### `/es/destinos`

**Nav**
```
Home
Destinos
Influencers
Alojamientos
es
Sing up
Login
```

**Hero**
```
Soluciones Tecnológicas para destinos turísticos
“ La plataforma de promoción turística y venta de productos y servicios locales ”
[badge App Store]  [badge Google Play]
```

**H1 + highlighted + tags**
```
H1:  La plataforma con todo lo que necesita el turista.
H5:  La plataforma con todo lo que buscan tus turistas.
tags: # Alojamientos · # Party · # Restaurantes · # Comercios · # Sorpréndeme · # Eventos · # Actividades
```

**H4 — Herramientas para los destinos** (3 cards)
```
Recomendador y market place local
  Sistema de promoción y venta de todos los activis turisticos de la ciudad.

Sistema de ventas Oficina y Monumentos (POS)
  Vende todo tipo de productos y servicios en tus oficinas de turismo y monumentos.

Web y gestor de contenidos
  Genera ingresos con todas las ventas y reservas de tus recomendaciones a través de nuestro market place.
```

**Blue cards**
```
Entiende al turista
  Informes
    Gracias a la interacción del público con el sistema discoolver 360 proporcionamos al destino
    una informacion actualizada de las tendencias locales.

Comercializa productos y actividades locales
  Sistema de ventas
    Comercializamos no solo los activos turisticos propios del destino sino aquellos comercios,
    productos y actividades interesantes de la región.
```

**H1 huérfano**
```
Convierte tu ciudad en un destino atractivo para turístas digitales.
```

**H4 — Herramientas para el turista** (3 cards)
```
Asistente de voz
  Un asistente de voz basado en IA que se entrena con␣␣los contenidos del destino para convertirse
  en tu nueva atención al turista 24/7.

Calendario y mapas inteligentes
  Publica todos los eventos importantes para tu comunidad y ofrece un mapa claro con las zonas
  y puntos destacados de la ciudad.

Planificador de rutas
  Permite a los usuarios generar rutas para descurbir la ciudad a su ritmo y en base a sus intereses.
```

**Señalética**
```
Soluciones de señalética digital para destinos
  [botón] Totems y dispositivos digitales      (clase de la tarjeta: solutions-card-destino-qr)
  [botón] Sistemas de QR                       (clase de la tarjeta: solutions-card-destino-totem)
```

**Social proof + CTA**
```
Ya confían en nosotros...
Conoce que podemos hacer por tu destino
[botón] Agendar una cita
```

**Footer**
```
Contacta con nosotros y un miembro del equipo resolverá tus dudas.
[botón] ¿Te ayudamos?
Contacto                       ← marcado como <h1>
info@discoolver.com            ← ofuscado por Cloudflare, decodificado
(+34) 681 291 571
C/ María de Molina 39, 28006
Madrid
[Facebook] [X/Twitter] [Instagram]
```

---

### `/es/alojamientos`

**Nav** — idéntico (incluida la errata `Sing up`).

**Hero**
```
Bienvenido a tu nuevo servicio de concierge digital
“ La plataforma definitiva para interactuar con tus clientes ”
[badge App Store]  [badge Google Play]
```

**H1**
```
Un ecosistema diseñado para acompañar al turista en su visita.
```

**H4 — Convierte a tu establecimiento en el alma del viaje** (3 cards)
```
Asistente de voz
  Permite a los usuarios encontrar tus recomendaciones a hacer de nuestro mapa interactivo y crear rutas.

Calendario y mapas
  Publica todos los eventos importantes para tu comodidad.

Planificador de rutas
  Genera ingresos con todas las ventas y reservas de tus recomendaciones a través de nuestro market place.
```

**Blue cards**
```
Aprende de tus clientes
  Aporta valor y data a tu negocio
    Recopilamos toda la informacion disponible de nuestros usuarios de forma segura para ofrecer
    los análisis y reportes de negocio.

Genera una nueva fuente de ingresos
  Monetiza tus recomendaciones
    Recomienda y vende los planes y actividades que mejor se adapten a tus clientes.
```

**H4 — Diseñamos soluciones a medida para** (los 3 segmentos)
```
Hoteles
  Desde grandes cadenas a hoteles boutique nuestra solución se ajusta a las necesidades de tu␣␣hotel.

Hostales
  La nueva forma de aportar valor al turista joven cliente de los hostels para que aprovechen
  su estancia al máximo.

Property Managers
  Una nueva forma de presentar la ciudad a los huespedes de tu ciudad. Generamos modelos propios
  para redes de apartamentos.
```

**Señalética**
```
Soluciones de señalética digital para alojamientos:
  [botón] Totems y dispositivos digitales      (solutions-card-totem)
  [botón] Sistema de QR                        (solutions-card-qr)
```

**Social proof + CTA**
```
Ya confían en nosotros...
¿Quieres probar nuestras herramientas en tu negocio?
[botón] Agendar una demo
```

**Footer** — idéntico a destinos salvo que la frase va **sin punto final**: `Contacta con nosotros y un miembro del equipo resolverá tus dudas`

---

## 3. Qué merece la pena SALVAR

**Titulares que ya funcionan**

| Frase | Por qué |
|---|---|
| **"Convierte a tu establecimiento en el alma del viaje"** | La mejor línea de las dos páginas. Verbo + promesa emocional + sujeto correcto (el establecimiento, no el turista). Es propietaria: nadie más en el sector dice esto. Candidata a H1 de alojamientos. |
| **"Bienvenido a tu nuevo servicio de concierge digital"** | Define la categoría en una palabra que el hotelero ya entiende ("concierge"). Reduce el coste cognitivo de explicar qué es Discoolver. |
| **"Convierte tu ciudad en un destino atractivo para turistas digitales."** | Promesa clara, verbo de transformación, le habla al gestor del destino. Hoy está huérfana en mitad de la página; merece ser el H1 de destinos. |
| **"Soluciones Tecnológicas para destinos turísticos"** | Aburrida pero necesaria: es literalmente lo que teclea un técnico de turismo o una consultora en un pliego. Vale como H1/title SEO aunque no como titular emocional. |

**Etiquetas de sección verbo-primero** — `Entiende al turista`, `Aprende de tus clientes`, `Comercializa productos y actividades locales`, `Genera una nueva fuente de ingresos`, `Monetiza tus recomendaciones`, `Diseñamos soluciones a medida para`. Son cortas, empiezan por verbo y prometen resultado, no feature. Es el único patrón sano de toda la web y hay que conservarlo como sistema.

**El argumento del dinero** — `Genera una nueva fuente de ingresos` + `Monetiza tus recomendaciones` + `Recomienda y vende los planes y actividades que mejor se adapten a tus clientes.` Es el único argumento realmente B2B de la página y está enterrado abajo. Debe subir.

**La única descripción bien escrita del sitio** — *"Un asistente de voz basado en IA que se entrena con los contenidos del destino para convertirse en tu nueva atención al turista 24/7."* Nombra mecanismo (se entrena con tus contenidos) + resultado (atención al turista 24/7). Es la plantilla que deberían seguir las otras 11 descripciones.

**La lógica del dato** — *"Gracias a la interacción del público con el sistema discoolver 360 proporcionamos al destino una información actualizada de las tendencias locales."* Explica de dónde sale el dato, que es la pregunta nº1 de un ayuntamiento. Está mal redactada pero el argumento es correcto y hay que rescatarlo.

**Reaseguro bajo CTA** — *"Contacta con nosotros y un miembro del equipo resolverá tus dudas"* + *"¿Quieres probar nuestras herramientas en tu negocio?"* / *"Agendar una demo"*. El par pregunta→demo es el ask correcto para alojamientos.

**Datos de contacto reales que hay que preservar** — `info@discoolver.com` · `(+34) 681 291 571` · `C/ María de Molina 39, 28006 Madrid` · FB `discoolvermad` · X `discoolver_mad` · IG `discoolver_mad`.

**Del copy EN del MD (no está en el HTML ES) — rescatar y traducir:** es *muy* superior al ES y no debería perderse en la reescritura.
- *"We don't track traffic. We track desire."*
- *"It's not just where tourists go — it's why they go. That's the data that matters."*
- *"The real luxury isn't information. It's curation."* / *"We turn 1,000 possibilities into 10 unforgettable ones"*
- *"Meet your next customer... before they even arrive."* / *"This is not exposure. This is precision."*
- *"If they're likely to love your place, we'll show it. If not, we won't."*
- *"The End of Pay-to-Play. The Rise of Real Value."* / *"Your visibility isn't for sale — it's earned"*
- *"Set it once, scale forever."* / *"More than bookings. Discoolver is business intelligence."*

---

## 4. Qué está ROTO

### 4.1 Erratas y ortografía

| Dónde | Error | Debería ser |
|---|---|---|
| Nav (ambas) | `Sing up` | `Sign up` / `Regístrate` |
| destinos, card 1 | `activis turisticos` | `activos turísticos` |
| destinos, Planificador | `descurbir` | `descubrir` |
| destinos, H1 huérfano | `turístas` | `turistas` |
| destinos, Informes | `informacion` | `información` |
| destinos, Sistema de ventas | `activos turisticos` | `activos turísticos` |
| alojamientos, Calendario | `para tu comodidad` | `para tu comunidad` (en destinos sí dice "comunidad") |
| alojamientos, Aporta valor | `informacion` | `información` |
| alojamientos, Property Managers | `huespedes` | `huéspedes` |
| destinos, Asistente de voz | doble espacio `con␣␣los` | espacio simple |
| alojamientos, Hoteles | doble espacio `de tu␣␣hotel` | espacio simple |
| Footer | destinos termina en `dudas.` y alojamientos en `dudas` | inconsistente |
| Señalética | destinos `Sistemas de QR` vs alojamientos `Sistema de QR` | inconsistente |

### 4.2 Frases sin sentido

- **alojamientos → Asistente de voz:** *"Permite a los usuarios encontrar tus recomendaciones **a hacer de** nuestro mapa interactivo y crear rutas."* — "a hacer de" no significa nada; se comió "a través de". Y aun corregida, describe un mapa, no un asistente de voz.
- **alojamientos → Calendario y mapas:** *"Publica todos los eventos importantes para tu comodidad."* — el hotelero publica eventos… ¿para su propia comodidad? Es un typo de "comunidad" que además deja la frase gramaticalmente correcta y semánticamente absurda, así que nadie lo detectó. Encima el card se titula "Calendario y mapas" y la descripción no menciona el mapa.
- **alojamientos → Property Managers:** *"Una nueva forma de presentar la ciudad a los huéspedes **de tu ciudad**."* — redundancia circular; debería ser "a los huéspedes de tus apartamentos".
- **alojamientos → Hostales:** *"aportar valor al turista joven **cliente de los hostels**"* — mezcla "hostales" (titular) y "hostels" (cuerpo) en la misma tarjeta y encadena tres sustantivos sin preposición.
- **destinos → Sistema de ventas:** *"Comercializamos no solo los activos turísticos propios del destino sino aquellos comercios, productos y actividades interesantes de la región."* — 27 palabras, "no solo… sino" sin "también", y "interesantes" es un criterio no verificable.

### 4.3 Descripciones cruzadas entre módulos ← **el fallo más grave**

Las clases CSS de los iconos delatan el copy-paste: el texto viajó de un card a otro sin que el título le siguiera.

**destinos — "Herramientas para los destinos":**
- `Web y gestor de contenidos` lleva el icono `card-image-monetize` y el texto *"Genera ingresos con todas las ventas y reservas de tus recomendaciones a través de nuestro market place."* → Es la descripción de un módulo de **monetización**, no de un CMS. El CMS se queda sin describir en toda la página.
- `Sistema de ventas Oficina y Monumentos (POS)` lleva el icono `card-image-calendar-white` (un calendario, para un TPV).
- `Recomendador y market place local` lleva `card-image-geo` (geolocalización).

**alojamientos — el bloque de 3 cards está desplazado una posición:**

| Card | Icono real | Texto que muestra | Texto que le correspondería |
|---|---|---|---|
| Asistente de voz | `card-image-geo` (mapa) | mapa interactivo + rutas | el de voz IA que sí existe en destinos |
| Calendario y mapas | `card-image-calendar-alerts` | solo eventos, sin mapas | el completo de destinos (eventos + mapa de zonas) |
| Planificador de rutas | `card-image-planificador-rutas` | ingresos por marketplace | rutas a su ritmo según intereses |

**Consecuencia cruzada:** la frase *"Genera ingresos con todas las ventas y reservas de tus recomendaciones a través de nuestro market place"* aparece **literalmente en las dos páginas**, bajo dos titulares distintos (`Web y gestor de contenidos` en destinos, `Planificador de rutas` en alojamientos) y ninguno de los dos es un módulo de monetización. Y en alojamientos vuelve a decirse lo mismo 200px más abajo en la blue-card `Genera una nueva fuente de ingresos / Monetiza tus recomendaciones`.

**Señalética en destinos — imágenes invertidas:** la tarjeta con clase `solutions-card-destino-qr` muestra la etiqueta "Totems y dispositivos digitales" y la `solutions-card-destino-totem` muestra "Sistemas de QR". En alojamientos el emparejamiento sí es correcto (`solutions-card-totem`→Totems, `solutions-card-qr`→QR). Es decir: en destinos el usuario ve la foto del QR bajo el botón "Totems" y viceversa.

### 4.4 Titulares duplicados y redundantes

- **destinos, dos titulares casi idénticos pegados:** H1 `La plataforma con todo lo que necesita el turista.` seguido inmediatamente del H5 `La plataforma con todo lo que buscan tus turistas.` No hay diferencia semántica entre "necesita el turista" y "buscan tus turistas"; es el mismo titular escrito dos veces.
- **destinos tiene 3 `<h1>`** (`La plataforma con todo…`, `Convierte tu ciudad…`, y `Contacto` en el footer). **alojamientos tiene 2** (`Un ecosistema diseñado…` y `Contacto`). El "Contacto" del footer marcado como H1 es un error de jerarquía en ambas.
- **Ningún `<title>`, ninguna `meta description`, ningún canonical, ningún OG** en las dos páginas. Cero SEO on-page.
- **`Convierte tu ciudad en un destino atractivo para turístas digitales.`** es un H1 completamente huérfano: sin subtítulo, sin cuerpo, sin CTA, sin imagen. Un titular flotando entre dos secciones.
- **Las dos blue-cards contienen una sola tarjeta cada una** (título de sección + 1 card). Estructura de rejilla de 3 columnas usada para 1 elemento: parece que faltan cards.

### 4.5 Copy que le habla al turista cuando debería hablarle al gestor

Este es el problema de posicionamiento de fondo: son **páginas B2B con hero, taxonomía y CTAs de la app B2C**.

- **`La plataforma con todo lo que necesita el turista.`** — H1 de una página de venta a instituciones que promete valor… al turista. El comprador (concejalía, DMO, patronato) no aparece.
- **`Un ecosistema diseñado para acompañar al turista en su visita.`** — H1 de la página de hoteles. Describe la experiencia del huésped, no el resultado para el hotel (más reviews, upsell, diferenciación). El hotelero tiene que deducir qué gana él.
- **Los 7 tags `# Alojamientos · # Party · # Restaurantes · # Comercios · # Sorpréndeme · # Eventos · # Actividades`** — es literalmente el menú de categorías de la app de consumo, pegado en una landing B2B. `# Sorpréndeme` y `# Party` no le dicen nada a un técnico municipal.
- **Los badges de App Store y Google Play en el hero de las dos páginas B2B** — el primer CTA que ve el gestor le invita a descargarse la app de turista. Además el badge de Google Play apunta a `href="#"` (enlace muerto) y el de Apple a `apps.apple.com/es/app/discoolver/id1529749267`.
- **Mezcla de destinatario dentro de la misma tarjeta:** *"Permite a **los usuarios** generar rutas…"*, *"Publica todos los eventos importantes para **tu** comunidad"*, *"Recopilamos toda la información disponible de **nuestros usuarios**…"*. En tres frases seguidas el sujeto salta entre el turista, el gestor y Discoolver.
- **Toda la sección `Herramientas para el turista`** (destinos) enumera features de la app de consumo sin traducir ni una a beneficio del destino (¿menos cola en la oficina de turismo? ¿desestacionalización? ¿ROI de inversión pública?). El copy EN sí hace esa traducción (*"improve public investment ROI"*); el ES no.
- **`Ya confían en nosotros...`** con logos que incluyen **Tetuán Valley** (aceleradora, no cliente) y SEGITTUR. Sin nombres, sin caso, sin cifra. Además destinos muestra 4 logos y alojamientos 5, con solapes parciales — señal de que la lista es decorativa, no una cartera real.

---

## 5. Los tres segmentos de alojamientos

Aparecen **solo en la versión ES**, en la sección `Diseñamos soluciones a medida para` (bloque 6). Un card por segmento, con icono propio (`card-image-hoteles`, `card-image-hostales`, `card-image-property`).

| Segmento | Copy literal | Lectura |
|---|---|---|
| **Hoteles** | *"Desde grandes cadenas a hoteles boutique nuestra solución se ajusta a las necesidades de tu␣␣hotel."* | Único argumento: escalabilidad del tamaño de la cuenta. No dice **qué** resuelve para un hotel (upsell, reviews, descarga del conserje). Frase de plantilla: se podría copiar a cualquier SaaS. |
| **Hostales** | *"La nueva forma de aportar valor al turista joven cliente de los hostels para que aprovechen su estancia al máximo."* | El único que identifica una audiencia real (**turista joven**) — eso es lo salvable. Pero el beneficio prometido es del huésped, no del hostal; y mezcla "hostales"/"hostels". Falta lo obvio de este segmento: staff mínimo, alta rotación, el asistente sustituye recepción. |
| **Property Managers** | *"Una nueva forma de presentar la ciudad a los huespedes de tu ciudad. Generamos modelos propios para redes de apartamentos."* | El más roto ("huéspedes de tu ciudad") y a la vez el que esconde el mejor argumento: **"modelos propios para redes de apartamentos"** = white-label multi-propiedad. Es exactamente el dolor del property manager (checkin sin recepción, escala a N pisos) y está dicho de pasada al final. |

**Diagnóstico del bloque:** los tres cards repiten la misma estructura vacía ("una nueva forma de…") y ninguno menciona precio, integración, PMS, ni un número. Los tres describen lo que el huésped recibe; ninguno describe lo que el gestor gana. Es la sección con mayor potencial de la web (segmentar por tipo de cuenta) y la peor ejecutada.

**Ojo con la versión EN:** en `discoolver.com/alojamientos` (inglés) los segmentos **no son tres sino cinco y sin descripción**: `Hotels · Resorts · Hostels · Touristic Apartments · Rural Accommodations`, bajo *"PERFECT for all types of accommodations"* + *"We support all types of accommodations, from hotels to hostels, and everything in between."* Es decir, ES y EN no comparten ni la segmentación. Hay que decidir cuál es la taxonomía canónica antes de reescribir.

---

## 6. CTAs y formularios

**Formularios: cero.** No hay ni un `<form>`, ni un `<input>`, ni un `mailto:`, ni un embed de Calendly/HubSpot/Typeform en ninguna de las dos páginas. Las dos landings B2B **no capturan un solo lead**.

**Todos los CTA son `<button>` sin `href` y sin destino visible en el HTML** (dependen de handlers JS del bundle). Para un crawler y para un usuario con JS lento, no van a ninguna parte.

| Ubicación | Elemento | Texto | Estado |
|---|---|---|---|
| Nav (ambas) | `<button>` ×4 | Home · Destinos · Influencers · Alojamientos | Navegación sin `<a href>` → no rastreable |
| Nav (ambas) | `<button>` | `es` (selector idioma) | — |
| Nav (ambas) | `<button>` | **Sing up** | Errata + sin href |
| Nav (ambas) | `<button>` | Login | Sin href |
| Hero (ambas) | `<a href="https://apps.apple.com/es/app/discoolver/id1529749267">` | badge App Store | Funciona, pero **lleva a la app B2C desde una landing B2B** |
| Hero (ambas) | `<a href="#">` | badge Google Play | **Enlace muerto** |
| destinos | `<button>` ×7 | `# Alojamientos`, `# Party`, `# Restaurantes`, `# Comercios`, `# Sorpréndeme`, `# Eventos`, `# Actividades` | Filtros de la app B2C, sin función en esta página |
| Señalética (ambas) | `<button class="btn">` ×2 | destinos: `Totems y dispositivos digitales` / `Sistemas de QR` · alojamientos: `Totems y dispositivos digitales` / `Sistema de QR` | Parecen CTA pero son **etiquetas**: no hay ni ancla ni sección de destino. En destinos, además, están cruzados con sus imágenes |
| CTA final destinos | `<button>` | **Agendar una cita** | Sin href, sin calendario, sin formulario |
| CTA final alojamientos | `<button>` | **Agendar una demo** | Sin href, sin calendario, sin formulario |
| Footer (ambas) | `<button>` | **¿Te ayudamos?** | Sin href, sin formulario |
| Footer (ambas) | `<a>` ofuscado Cloudflare | `info@discoolver.com` | Único canal de contacto realmente clicable |
| Footer (ambas) | texto plano | `(+34) 681 291 571` · `C/ María de Molina 39, 28006 Madrid` | No son `tel:` ni enlace a mapa |
| Footer (ambas) | `<a>` ×3 | Facebook `/discoolvermad/` · X `discoolver_mad` · Instagram `discoolver_mad` | Funcionan |

**Resumen del embudo actual:** el visitante recorre 10-11 secciones, encuentra 2 CTAs de conversión (`Agendar una cita/demo` y `¿Te ayudamos?`) y **ninguno de los dos hace nada verificable en el HTML**. El único camino real a conversión es copiar a mano un email ofuscado del footer. Cualquier reescritura tiene que empezar por esto: un formulario o un embed de agenda real, y un CTA repetido al menos 3 veces (hero, tras los módulos, cierre).

**Notas de i18n:** el `__NEXT_DATA__` de ambas páginas carga el diccionario completo de la app (600 claves: checkout, tickets, plan-my-trip, business.contact…), pero **el copy de estas dos landings está hardcodeado en el JSX**, no viene de claves i18n. Existen claves de formularios B2B sin usar aquí (`business.contact.name/email/phone`, `business.contact.sign.me.up` = "apuntame", `about.form.nombre/ciudad/correo/contacto`, `city.city.contact.info` = "¿Quieres ver Discoolver en tu ciudad?") — es decir, el formulario de contacto **existe en otra parte del producto** y estas landings simplemente no lo montan.