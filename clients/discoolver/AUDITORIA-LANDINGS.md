# Auditoría de landings — camino al lanzamiento

Registro vivo. Una sección por página; cada hallazgo con veredicto, evidencia y propuesta.
Se actualiza **cada vez que tocamos algo**: qué se cambió, por qué, y qué queda.

- Entorno de trabajo: `npx next dev -p 4400` en `clients/discoolver/web` → http://localhost:4400
- Producción: https://discoolver.com
- Fuente de copy: `lib/content/*.ts` (verdad) → SF-CMS (capa de edición, se hornea en build)

## Orden de trabajo acordado

| # | Página | Papel en el embudo | Estado auditoría |
|---|---|---|---|
| 1 | `/` (home ES+EN) | Puerta del dominio. Todo el tráfico de marca | ✅ auditada 19-ago |
| 2 | `/guias` | Único punto de ingreso (Stripe) | ⏳ |
| 3 | `/influencers` | Oferta del contenido: sin creadores no hay catálogo | ⏳ |
| 4 | `/360` + destinos/alojamientos/agencias | Ingreso B2B, ticket alto | ⏳ |
| 5 | `/blog` (55 posts) | Entrada SEO orgánica | ⏳ |

---

# 1. Home `/` — auditoría 19-ago-2026

Medido en local sobre el código de producción, 1440×900 y 390×844, con datos vivos de
`api.discoolver.com`.

## Bloqueantes (antes de mandar tráfico)

### B1 · En móvil la home y el blog no tienen menú
`components/app/Nav.tsx` no monta el botón hamburguesa. El CSS (`globals.css:2620`) esconde
`.nav__links` por debajo de 880 px y solo lo enseña con `.is-open`, clase que nadie pone.
`components/layout/Nav.tsx` **sí** lo tiene (`nav__toggle`, `aria-expanded`) y lo usan `/guias`,
`/influencers` y `/gracias`. Se arregló allí y no se propagó tras la fusión del 12-ago.

Afecta a `/`, `/en` y las 4 rutas de `/blog` (55 artículos): en móvil no hay forma de llegar a
Guías, Mapa, Blog, Creators, Para empresas ni al cambio de idioma. Solo se ve "Entrar".

**Propuesta:** portar el toggle de `layout/Nav.tsx` a `app/Nav.tsx` (mismo markup y clases, el CSS
ya existe). 15 min. Es un arreglo, no un cambio de diseño.

### B2 · 26 MB de vídeo en la primera carga móvil
Dos vídeos en autoplay: `v-hero-owl.mp4` (13,7 MB) y `v-card-accommodations.mp4` (13,0 MB).
Total medido: **25,9 MB en 39 peticiones**. En 4G real son 20-30 s y un pellizco del plan de datos.

**Propuesta:** recomprimir a H.264 720p CRF 28 + AAC 96k (esperable 0,8-1,5 MB cada uno) y servir
poster + `preload="none"` en móvil, o directamente poster estático por debajo de 880 px.
Requiere instalar ffmpeg (`brew install ffmpeg`), no está en la máquina.

### B3 · La home promete Málaga y Málaga está vacía
Los números del hero salen en vivo de la API (bien). El dato real de hoy:
**Madrid 1.099 · Barcelona 218 · Ibiza 51 · Málaga 0**. "3 ciudades con contenido" es correcto,
pero el copy fijo nombra Málaga en 5+ sitios (eyebrow del hero, línea social, `app_soon_desc`,
`cta_sub`, FAQ) y **nunca nombra Ibiza**, que sí tiene 51 sitios. Quien entra por "Málaga ya
abierta" no encuentra nada.

**Propuesta:** las ciudades del copy salen de `applyPlatformStats` como ya salen los números
(`cities[]` ordenado por sitios), no escritas a mano. Mientras tanto: sustituir Málaga por Ibiza
en los 5 sitios.

### B4 · "Bangkok abre en 12 días" con contador en marcha
`LAUNCH_DATE = 2026-09-01` (`components/ui/Countdown.tsx`). Bangkok **no aparece** en la API de
ciudades y no tiene ninguna ficha. Es una promesa pública, fechada y en cuenta atrás en la portada
del dominio.

**Propuesta:** decisión de negocio, no de código. O se confirma que el 1-sep hay catálogo de
Bangkok, o el bloque pasa a "la próxima ciudad" sin fecha y con captación de email por ciudad
(que además da una lista segmentada de valor real).

### B5 · Fotos que no son del sitio que dicen ser
`Experiences.tsx:11` asigna 6 imágenes de personajes a 6 locales **reales** por posición, sin
relación con el sitio — y el `alt` afirma que la foto es de ese local:

| Ficha (real) | Categoría | Foto que se enseña |
|---|---|---|
| La Croquetta | Restaurantes | búho en un museo |
| Cine Doré | Cines | zorro cenando en un restaurante |
| 1862 Dry Bar | Bares de copas | el Coliseo de Roma |
| Barrio de San Francisco (Ronda) | Barrios | oso en un partido de la NBA |
| Acinipo (Málaga) | Arqueología | canguro en el metro |
| A Tu Bola (Barcelona) | Restaurantes | conejo en un aeropuerto |

En un producto cuya promesa es "cada sitio lo revisa una persona", esto es lo que más caro sale:
quien conoce el Cine Doré ve un zorro cenando y deja de creerse el resto. Además `Acinipo` está
etiquetado "MÁLAGA" y está en Ronda.

**Propuesta:** tirar de las fotos reales (18.499 en R2 con la convención `images/{rawId}/main.jpg`
según lo cerrado con Diego). Si una ficha no tiene foto, no sale en la home. Los personajes son
identidad de marca y funcionan de maravilla en Categorías — pero ahí ilustran un concepto, no
suplantan un lugar.

## Sección por sección

**Nav** — bien resuelta en desktop; ver B1 para móvil. "Avísame de mi ciudad" (ghost) compite con
"Entrar" (primario) y ancla a `#hero-email`, un campo opcional; en móvil desaparece.

**Hero** — el mejor bloque de la página. Titular claro, prueba con dato vivo, doble puerta
(entrar sin cuenta / dejar email). Tres cosas:
1. El subrayado lima del H1 (`Hero.tsx:23`, `bottom:0.08em`, `height:0.1em`) cruza los descendentes
   de "elegidas a mano": se lee como tachado. Bajar a `bottom:-0.02em` y subir a `0.14em`.
2. La mini-tarjeta del conejo tapa "Cool Map" del rótulo del vídeo: en 1440 px se lee
   "ap · abre el mapa real".
3. El H1 concatena sin espacio: `"…elegidas a manode las redes sociales."`. Mismo fallo en 5 H2.
   Google y los lectores de pantalla ven "manode". Un `{" "}` en cada uno.

**Ticker** — automático desde datos vivos. Correcto y barato. Nada que tocar.

**Categorías (8)** — visualmente lo mejor de la página. Fallos: la 8ª (Naturaleza) no tiene foto y
sale como bloque verde con el título repetido dentro y debajo; Alojamiento se ilustra con el
Coliseo y Bienestar con un aeropuerto; las tarjetas **no son enlaces** (8 piezas grandes que
invitan al clic y no llevan a ninguna parte).

**TravelBrain (magenta)** — repite el titular del hero ("Recomendaciones…"), no tiene CTA y deja
~200 px de magenta vacío bajo la columna derecha. Es el bloque de mayor peso visual de la página
gastado en repetir. Candidato a reconvertirse en el "cómo se hace" (el proceso de curación: de la
red social → editor → ficha), que es la única razón por la que alguien elige esto y no Google Maps.

**Herramientas de IA (4 pasos)** — el titular ocupa 3 líneas y deja media pantalla vacía; 4
tarjetas de solo texto con "Ábrelo en la plataforma" repetido 4 veces. La plataforma está viva:
aquí van 4 capturas reales. Es la sección con más recorrido de toda la home.

**Sitios publicados** — ver B5.

**Mapa** — es un mapa **falso** (rejilla CSS con pins inventados) mientras el Cool Map real está en
producción. Sustituir por captura real o embed.

**Guías (puente a /guias)** — sólida: precio con IVA, 3 portadas 3D, CTA claro. Ojo: enseña Madrid,
Barcelona y Ronda; Ronda no tiene contenido vivo en la plataforma.

**Creadores** — cambio de interlocutor a mitad del embudo: el titular habla al viajero y las 4
tarjetas (Monetizable, Personalizado, Localizado, Escalable) hablan al creador. En la home debería
quedar una franja fina con CTA a `/influencers`; los 4 argumentos viven allí.

**Próxima ciudad** — ver B4. Además el mockup del teléfono inventa usuaria ("Hola, Lucía") y planes
("Vermut & vinilos", "Kayak al sunset"), justo lo que la regla de la casa prohíbe. Y el formulario
de email tiene por botón "Entrar en la plataforma": el campo pide correo y el botón se va a otro
sitio.

**FAQ** — buen contenido y con JSON-LD. Siete preguntas, todas correctas salvo la de ciudades, que
depende de B3.

**CTA final** — dice "Déjanos tu email y te avisamos cuando abra" y **no hay campo de email**. Tres
botones del mismo peso (plataforma / empresas / creadores) diluyen el cierre.

**Footer** — completo y correcto. WhatsApp con prefijo +66 (Tailandia) en una web ES; comprobar si
es el número que se quiere enseñar.

## Cambios aplicados — 19-ago-2026

Verificado en local contra el código de producción (1440×900 y 390×844) y con `npm run build` en
verde. **Nada desplegado todavía.**

### Arreglos

| # | Qué | Dónde | Resultado medido |
|---|---|---|---|
| B1 | Hamburguesa en la nav de la home y el blog | `components/app/Nav.tsx` | Los 7 enlaces alcanzables en 390 px |
| B2 | Vídeos recomprimidos (960×540, `avconvert`) y `VideoBajoDemanda`: en móvil se sirve el póster y el `<video>` ni se monta | `components/app/VideoBajoDemanda.tsx`, `public/assets/*.mp4` | **25,9 MB → 0,40 MB** en la primera carga móvil |
| B3 | Ninguna ciudad escrita a mano: `{ciudades}` se sustituye con el dato vivo en todo el contenido, incluida la meta description | `lib/platform-stats.ts`, `app/page.tsx`, `app/en/page.tsx` | Málaga (0 sitios) fuera; Ibiza (51) dentro |
| — | H1 partido solo por la coma en todos los anchos, con el cuerpo atado al ancho de su columna (`--hero-fit` en `cqi`) | `Hero.tsx`, `globals.css` | 0 px de desbordamiento en 360/390/768/1024/1440/1920, ES y EN |
| — | Rótulo del vídeo ya no lo tapan las mini-tarjetas (suben a las esquinas de arriba) | `Hero.tsx`, `globals.css` | "Cool Map · el mapa de la ciudad" legible entero |
| — | Barra de datos: 4 ítems sin solaparse; los ítems 1 y 2 salen de BBDD y se esconden si la consulta falla | `Hero.tsx`, `platform-stats.ts` | — |
| — | Separador de millar por idioma | `platform-stats.ts` | EN decía "1.300" (uno coma tres) |
| — | Meta description desde el mismo dato que el hero | `app/page.tsx`, `app/en/page.tsx` | 146 y 145 caracteres (rango SEO 120-160) |
| — | Favicon: la marca ocupaba el 37 % del lienzo → recortada y regenerado el juego (ico + 192 + 512 + apple) para discoolver y para 360 | `public/`, `public/assets/360/`, los dos `360/layout.tsx` | Legible a 16 px |

### Secciones reescritas (copy del CEO)

- **Hero** — "Lo mejor de las redes, elegido por editores." Un solo botón primario, correo como vía
  rápida, secundarios como enlaces de texto y salida plegable para ciudad no abierta.
- **Categorías** — "Los ocho territorios" / "Toda la ciudad, ordenada."
- **Bloque magenta** — estructura intacta (eyebrow + H2 + 4 bullets con check); fuera la cita
  anónima; la bullet 2 enlaza a Plan My Trip.
- **Herramientas** — capturas **reales** de la plataforma (mapa, buscador, calendario), CTA propio
  por tarjeta, descriptor en español junto a cada nombre en inglés, y el mensaje que faltaba:
  gratis con cuenta, sin tarjeta, las guías se venden aparte.
- **Mapa** — se mantiene la previsualización (decisión del CEO); solo cambia el encuadre del copy y
  el CTA lleva al Cool Map.
- **Creadores** — las cuatro tarjetas dejan de hablarle al creador y le hablan al viajero.
- **Cierre** — el campo de email que la sección prometía y no tenía; un primario y dos enlaces.

Vocabulario prohibido purgado de toda la home: `curado/a`, `curación`, `curaduría`, `curamos`,
`curator`, `vibra`, `elegido a mano`, `universos`, `armas secretas`.

**CMS re-sembrado** (`app-home`, `app-home-en`, 197 campos). El script acepta ahora slugs sueltos
—`npx tsx scripts/seed-cms-web.ts app-home`— para no pisar las otras cinco páginas al ir una a una.

### Sección 5 — selector de ciudades (sustituye al carrusel)

Portales en acordeón horizontal: hover en escritorio, tap en tablet, apilados y abiertos en móvil
(en pantalla estrecha esconder el contenido tras un gesto lo entierra). Un solo portal activo.

- **Ciudades, recuentos y los tres nombres salen de la API**, nunca escritos a mano. Los nombres
  vienen de `list_plan` — el mismo listado que sirve la plataforma — con un campo por ciudad en el
  CMS (`ciudad_madrid_destacados`) para elegirlos a mano cuando la API mezcla fiestas o pueblos de
  la provincia, como hacía en Madrid.
- **La tira de "¿y tu ciudad?"** no se abre al pasar por encima, solo al clic, y su formulario
  guarda `city` — la señal para decidir la siguiente apertura.
- Con esto **desaparece el carrusel de seis sitios con fotos que no eran de esos sitios**: el
  problema B5 se resuelve por eliminación, no por parche.

**⚠️ Faltan las ilustraciones.** El diseño pide una por ciudad (la ciudad como jungla habitada, con
su monumento reconocible y su animal, misma luz y mismo trazo en toda la colección). No se pueden
generar desde aquí. Mientras falten, el portal se pinta con degradado de marca y tipografía; en
cuanto exista `public/assets/ciudades/{slug}.webp` se añade a `ILUSTRACIONES` en `Ciudades.tsx` y la
tira la usa sin tocar nada más — el oscurecido, la desaturación y la vuelta al color ya están.

### Sección 6 — el mapa (rol nuevo: demostrar)

Con la sección 5 convertida en portales ilustrados, esta pasa a ser **la única sección de la home
que enseña sitios reales con nombre**. El diseño de la maqueta no se toca (decisión del CEO); lo que
cambia es a qué juega.

- "La ciudad, sin el ruido." sustituye a "La ciudad cabe en tu bolsillo", que vendía una app nativa
  que todavía no existe — y que la propia FAQ dice que llega después.
- **Las categorías de los pines pasan a las ocho canónicas**: "Gastronomía" → "Restaurantes y
  cafés", "Cultura" → "Arte y cultura", "Nightlife" (que además estaba en inglés) → "Vida
  nocturna", "Aire libre" → "Naturaleza y aire libre". Medido: 0 px de desbordamiento en las cinco
  pastillas, en ES, EN y a 390 px, sin tocar el cuerpo de letra.
- **"5 cerca de ti · 2 km" → "5 sitios en este barrio"**, y fuera la distancia. Una distancia solo
  significa algo si ya estás en la ciudad, y la mayoría planifica desde la suya.
- Los cinco sitios se conservan: reales, publicados, verificables y variados de categoría.

**⚠️ La frase de la tarjeta de detalle no puede salir todavía de la BBDD.** La API pública no tiene
búsqueda de sitios por texto ni consulta por id — probados `/recommended/{id}`, `/plan/{id}/es`,
`/plans/search`, `/search/recommended`: 404 o 500 — y ninguno de los cinco sitios aparece en los
feeds por secciones. Hasta que Diego exponga uno, la frase vive como campo editable en el CMS.
Pedido en la nota `PARA-DIEGO_entrada-sin-contrasena.md`.

### Sección 7 — las guías (el único bloque de pago)

- "La selección 2026." sustituye a "Consigue las guías de edición limitada": **"edición limitada"
  era falso** con producción bajo demanda, y con ello se van todos los argumentos de escasez.
- **El precio pasa de aparecer cinco veces a dos sitios**: la línea de apoyo bajo el botón (nunca
  dentro) y cada tarjeta. Fuera del subtítulo. Medido: `14€` ×4 (apoyo + 3 tarjetas), `29€` ×3.
- Tres micro-argumentos que sostienen el valor sin escasez: objeto no archivo · una por año · papel
  con digital dentro.
- **"Las guías son un producto aparte. La plataforma sigue siendo gratis."** cierra el bloque. Sin
  esa línea, quien pasa en scroll rápido asocia los 14€ al acceso, que es la conversión principal.
- Las tarjetas repetían ciudad y año dos veces cada una; queda una.
- "IVA incluido" sale de la home (vive en /guias y en la ficha) y el CTA pasa a primera persona.

**No se pinta "{n} sitios · {n} creadores".** Ese dato es de la guía, no del catálogo, y vive en el
dg-editor, al que esta web no llega. Poner los 1.099 de Madrid habría sido enseñar el catálogo
entero como si fuera el índice de la guía.

**La colección pasa a siete ciudades** (orden del CEO): Madrid · Barcelona · Málaga · Valencia ·
Ibiza · Bangkok · Dubái, en rejilla fija de 4+3 — con `auto-fit` Dubái se quedaba sola en una
segunda fila.

**Ninguna guía está a la venta todavía**, y la home no puede sugerir lo contrario: cada tarjeta
lleva su estado real («A la venta el 1 de septiembre» para Madrid, «Otoño 2026» para Barcelona,
Málaga e Ibiza) y **las que están en preparación —Valencia, Bangkok y Dubái— no llevan precio ni
enlace a ficha**: no hay nada que ver ni que comprar, y una cifra ahí haría creer que sí.

**Resuelto el mismo día en las dos páginas** (decisión del CEO): Ronda sale también de `/guias` —
del catálogo y de las tres frases del cuerpo que la nombraban— y Valencia y Dubái entran allí con
el mismo estado que en la home. Las siete comparten además **paleta de portada**: una guía no puede
verse distinta según por dónde se llegue. Contraste medido en los siete pares fondo/tinta; el más
bajo es Barcelona con 5,02:1 (el set anterior tenía un 2,86:1 que hubo que corregir en su día).

La rejilla de `/guias` vuelve a 4 columnas. Estaba en 3 por una decisión documentada de cuando eran
seis guías más la tarjeta «¿otra ciudad?» —siete ítems dejaban una celda vacía—; ahora son ocho y a
cuatro columnas cuadran dos filas exactas.

### Sección 8 — quién recomienda

Las cuatro tarjetas de pitch ("Monetizable", "Escalable", "Cobras por lo que tus recomendaciones
generan") **se van enteras**: hablaban al creador en una home del viajero y, la de cobrar,
contradecía de frente el "0 recomendaciones patrocinadas" del hero. Ese argumento vive ahora solo
en `/influencers`. La captación baja a una línea de texto al final.

**⚠️ La fila de creadores está construida y vacía a propósito.** No hay ni un creador publicable:
la plataforma los lista como `Influencer 1 … Influencer 10` y las únicas fotos de personas del repo
son de banco — justo lo que el CLAUDE.md prohíbe usar como cara de quien firma algo. Mientras
`CREADORES` esté vacío en `ForCreators.tsx`, la sección sirve el argumento sin fila: **no se enseña
una prueba falsa**. Para encenderla hace falta, por persona: foto propia, arroba real, ciudad,
territorio y **permiso por escrito**; la frase en primera persona es opcional y, si no la ha dicho,
no se escribe por él.

Esto deja una tensión que conviene resolver pronto: el hero promete "los 10 mejores creadores por
ciudad" y esta sección todavía no puede sostenerlo con caras.

## Inventario de cierre — barrido del 19-ago

Medido sobre las 18 rutas públicas en móvil (390 px) + revisión de copy de las cuatro páginas de
contenido. Versión navegable: https://claude.ai/code/artifact/43360062-22ea-4f4f-8bc8-f3974e594d63

**Lo hago yo (9)** · FAQ de la home sin revisar contra el copy nuevo (lleva JSON-LD) · `/guias` dice
«858 sitios» dos veces cuando el catálogo vivo son 1.099 · seis usos de vocabulario prohibido en
`/guias` («Curamos el año», «Curación humana», el H2 que empieza por «Curamos», «vibra» ×3) ·
«badge de curator» en `/influencers` ES+EN · **la nav de `/360` se desborda 149 px en móvil y
«Pedir demo» queda fuera de pantalla** · copy de las 5 páginas de `/360` sin auditar · `/blog` pesa
564 KB por dos imágenes sin optimizar (303 y 184 KB) · título del blog de 17 caracteres ·
descripciones de las legales por debajo del rango.

**Decides tú (5)** · la sección de Bangkok entera (contador a 13 días, usuaria y planes inventados
en el mockup, botón que no hace lo que dice el campo) · el WhatsApp +66 del pie en la web española ·
«La escasez es el producto» en `/guias` · verificar que Stripe cobra · creadores reales con permiso
por escrito e ilustraciones de ciudad-jungla.

**Depende de Diego (3)** · entrada sin contraseña · consulta de sitio por nombre o id · los
creadores llamados `Influencer 1 … 10` en `/search`.

Orden recomendado: `/360` en móvil (es un fallo, no una opinión, y es el ticket más alto) → `/guias`
(por donde entra el dinero, y ya abierta a medias) → FAQ de la home (barata y con datos
estructurados).

## Creadores — listado del CEO integrado (19-ago)

Los 47 candidatos viven en `web/lib/creators.ts`, tipados y con el estado del documento intacto
(5 verificados · 27 por confirmar · 15 aportados). El listado no es copy: es datos, y `esPersona`
marca los estudios, cuentas colectivas y medios.

**Salen los 47**: decisión del CEO de meterlos a todos —son cuentas públicas y lo que se publica es
cobertura de lo que ya publican, no un aval; la firma solo hace falta para comercializar guías. Las
27 arrobas que venían de rankings de terceros las confirmó él mismo. Solo se caen los 8 que no
tienen territorio asignado, porque cada ficha imprime «Ciudad · Territorio».

**Formato: «Top content creators por destinos»**, en tres bloques por PAÍS — España 15 · Tailandia
21 · Emiratos 11, este último con chip de «Próximamente» porque allí no hay catálogo abierto. Cada
creador lleva avatar, nombre, arroba, ciudad y territorio; los ocho sin territorio ya entran porque
esa línea es propia y cuando falta no se pinta.

**El arranque de cada país rota en cada carga**, para que no encabece siempre el mismo. Es una
rotación, no una baraja —el orden relativo se conserva— y se aplica **después de montar**: la home
se prerenderiza, así que sortearlo en el servidor lo congelaría hasta el siguiente build y hacerlo
en el render rompería la hidratación.

**Las fotos necesitan una sesión humana.** Cuatro vías probadas el 19-ago y las cuatro cerradas sin
login: el perfil sirve muro de login y ya no lleva `og:image`; `/api/v1/users/web_profile_info`
responde `status: fail`; `?__a=1` devuelve el mismo muro; y unavatar.io pide plan de pago para el
proveedor de Instagram. Con sesión abierta, esa misma API contesta a la primera — de ahí el camino
en dos pasos:

1. `scripts/urls-fotos-instagram.js` se pega en la consola del navegador con Instagram abierto y
   deja un `fotos.json` (arroba → URL) en el portapapeles. Va de uno en uno con pausa: 47
   peticiones seguidas desde una sesión real es la mejor forma de que la limiten.
2. `node scripts/fotos-creadores.mjs fotos.json` las descarga —las URL del CDN van firmadas y
   caducan, así que hay que bajarlas en el momento—, las recorta a 224 px cuadrados y deja las
   líneas de `foto:` listas para pegar.

Mientras falten, cada creador sale con un avatar de iniciales sobre un tono estable derivado de su
arroba: el mismo creador siempre del mismo color.

Cobertura medida sobre las 8 canónicas × 3 mercados. Sin ninguna persona detrás:

| Mercado | Territorios vacíos |
|---|---|
| España | Compras y moda · Bienestar y belleza |
| Tailandia | Compras y moda · Bienestar y belleza |
| Emiratos | Vida nocturna · Alojamiento · Naturaleza y aire libre |

Ocho candidatos siguen **sin territorio asignado**: `@miriaminiesta`, `@buscandoacere`,
`@sergiocastillo.180`, `@impaullee`, `@gincarb.bkk`, `@goeatgodrink`, `@emilysrichala.blog`,
`@samzacktyler`.

### Sección 9 — la próxima ciudad (contador eliminado)

**Fuera el contador regresivo, y no por copy.** Un reloj que llega a 00:00:00 sin apertura ese día
es un incumplimiento público que cualquiera comprueba, y contradecía el argumento de la casa: «abre
cuando sus sitios están revisados» es una condición de calidad, no una fecha. `Countdown.tsx`
borrado del repo.

Su hueco lo ocupa la **lista de estados**, con la misma fuente que el hero y los portales: Madrid
1.099 · Barcelona 218 · Ibiza 51 abiertas, Bangkok «en revisión editorial», y una fila «Tu ciudad —
pídela». Dice que hay trabajo en marcha sin comprometer un día.

**No se promete voto.** El brief daba dos redacciones según si el orden de apertura lo deciden de
verdad los usuarios. No lo deciden: la colección de guías publica el orden dos secciones más
arriba, así que «la decidís vosotros» se contradiría con solo hacer scroll. Se usa la alternativa
del propio brief.

Fuera también los badges de App Store y Google Play —imitaban a los oficiales, no llevaban a
ninguna parte y su uso está sujeto a las guías de marca de Apple y Google—, sustituidos por un
enlace de texto a la misma lista. Y con el mockup del móvil se va la usuaria inventada («Hola,
Lucía») y sus dos planes falsos.

El campo de ciudad es **libre a propósito**: un desplegable cerrado solo recoge las ciudades que ya
habíamos pensado, y la señal que importa es justo la que no esperábamos.

### Coherencia de ciudades — resuelta y verificada

Medido en la página servida, las cuatro superficies dicen lo mismo y salen del mismo sitio:

| Superficie | Dice |
|---|---|
| Eyebrow del hero | Madrid · Barcelona · Ibiza — ya abiertas |
| Barra de datos | 3 ciudades abiertas |
| Portales de ciudad | Madrid · Barcelona · Ibiza |
| Estados de apertura | Madrid 1.099 · Barcelona 218 · Ibiza 51 |

Ronda: 0 apariciones en toda la home. Málaga, Valencia y Dubái solo aparecen en el catálogo de
guías, que es un producto y no una ciudad abierta — esa distinción ahora se sostiene.

### Parte 0 — las reglas transversales, en el repo y con guardián

Estaban en conversaciones y volvían solas: este repaso encontró «curación humana», «vibra» y
«edición limitada» en páginas ya corregidas meses antes. Ahora:

- **`node scripts/revisar-copy.mjs`** revisa `lib/content/**` y **devuelve 1 si algo incumple**.
  Mira solo los valores entre comillas, nunca los comentarios — el comentario que explica por qué
  una palabra está prohibida tiene que poder nombrarla. Al estrenarlo encontró **9 incumplimientos
  reales** en `/guias` y `/influencers`; los nueve corregidos.
- **Las reglas viven en `web/CLAUDE.md`**: las 15 palabras prohibidas *con su motivo*, los ocho
  territorios canónicos, la prohibición de cifras a mano y la regla de que el inglés no es
  traducción.
- **Un solo número maestro.** `/guias` decía «858 sitios» dos veces mientras la home decía 1.099.
  El copy ahora escribe marcadores —`{sitios}`, `{sitios_ciudad}`, `{ciudades}`— y los sustituye
  `applyPlatformStats` (home) o la nueva `aplicarCifras` (resto). El script bloquea `858`, `1.099`,
  `1.629`, `1.500` y «12 ciudades» escritos literalmente.
- **Territorios canónicos** también en el ticker y en las claves viejas del bento: «Fiesta» → Vida
  nocturna, «Qué ver» → Arte y cultura, «Gastronomía» → Restaurantes y cafés.

### Secciones 10 y 11 — FAQ y cierre

**FAQ: ocho preguntas, no siete.** El precio sube al puesto 02 (es la duda nº1 de quien llega
hasta ahí) y entra la 04, «¿quién decide qué entra y qué no?», que sostiene todo el posicionamiento
y no existía. Fuera la frase «no una promesa de esta página»: desde que hay portales de ciudad, la
home sí lista ciudades y se contradecía. La 08 aclara que **360 no compra posiciones en el catálogo
público** — sin eso, el «0 recomendaciones patrocinadas» del hero deja de sostenerse. Verificado:
8 items en la página y 8 en el JSON-LD de `FAQPage`.

⚠️ La 03 no describe el enlace sin contraseña: hoy no existe. Dice lo que sí ocurre y cambia con el
flag `MAGIC_LINK` cuando Diego lo exponga.

**Cierre: un solo botón.** «Entrar gratis» con su línea de «sin cuenta, sin tarjeta, sin descargar
nada». Empresas y creadores bajan a enlaces de texto al pie —ya tienen su entrada en el menú— y la
salida de ciudad cerrada solo se despliega si alguien la pide. Fuera el párrafo que repetía el hero
palabra por palabra. **La frecuencia sale del eyebrow**: nadie ha comprometido «una ciudad al mes»
y prometerlo en el cierre era justo el tipo de promesa que este repaso ha estado quitando.

## Desplegado — 19-ago-2026, commit `252c462`

52 ficheros, +3.796/−1.056, acotado a `clients/discoolver` con pathspec. `verify-project-links` en
ALL PASS antes de empujar; los tres workflows de CI en verde.

**El CMS ya estaba sembrado** —se hizo tras cada sección—, así que el push solo tenía que hornearlo.
Ojo con una confusión que costó un rato: la web servía el H1 nuevo pero el título y la FAQ viejos.
No era un deploy a medias: era el build de `144b1fd` (un commit de MIRA de otra sesión, de 2,5 h
antes) que ya había horneado el CMS nuevo. **El bake congela el copy en el momento del build**, así
que sembrar sin desplegar deja la web en un estado mixto hasta el siguiente push de cualquiera.

Verificado en producción con navegador: título y descripción nuevos · FAQ **8 preguntas y 8 en el
JSON-LD** · 47 creadores en 3 países · 6 estados de apertura · 7 guías · un solo botón en el cierre
· cero apariciones de «Ronda», «edición limitada», «curad», «vibra» y del contador. En móvil: menú
de 7 enlaces y **0,29 MB** (eran 25,9).

**La fuente única se estrenó sola el primer día.** Diego publicó Málaga entre el commit y el
deploy, y la web la incorporó sin tocar una línea: el hero pasó a «Madrid · Barcelona · Málaga ·
Ibiza — ya abiertas», el total a 1.500 y los estados a cuatro ciudades. Es exactamente lo que antes
había que ir cambiando a mano en cinco sitios.

**Los cuatro proyectos hermanos tras el push**: salsaburgers 200 · startupsfactory 200 ·
ncglobalassets 200 · **adriangrooves.com sin resolver (DNS vacío)**. No lo causa este push —el
commit no toca ni un fichero de ese cliente— y su deploy responde 200 en
`adrian-grooves.vercel.app`: es el dominio, que no apunta a ninguna parte. Anotado, no tocado.

## Lo que sigue abierto

1. **Enlace mágico: el producto no lo tiene.** El brief pedía "Entrar sin contraseña" y "te
   mandamos un enlace". Comprobado contra `app.discoolver.com`: la autenticación es correo +
   contraseña y Google. El copy del enlace mágico está escrito y vive detrás de `MAGIC_LINK` en
   `HeroEntrar.tsx`; el día que Diego exponga el endpoint es cambiar `false` por `true`.
2. **"0 recomendaciones patrocinadas" vs. la API.** El feed `main_post` de `api.discoolver.com`
   devuelve los seis destacados de Madrid con `description: "Sponsored"`. Mientras eso siga así, el
   cuarto dato del hero es rebatible desde la propia plataforma.
3. **"Los 10 mejores creadores por ciudad"**: en `/search` la plataforma los lista como
   `Influencer 1 … Influencer 10`. Quien haga clic ve el relleno.
4. **Bangkok** (excluido a petición del CEO): el contador sigue prometiendo apertura el 1-sep y
   Bangkok no existe en la API.
5. **Fotos de las fichas** (excluido a petición del CEO): las seis de "Sitios publicados" siguen sin
   corresponder al sitio que nombran.
6. **`Plan My Trip` guarda solo con cuenta** y `/wishlist` está detrás de login: la tarjeta 04 ya lo
   dice; la 02 no.
