# Editor de Guías Discoolver — Manual de uso
**Versión:** 2.0 · Mayo 2026
**Acceso:** http://localhost:8000/editor (dev local)
**Credenciales:** editor@discoolver.com / discoolver2026

---

## Índice

1. [Qué es el editor](#1-qué-es-el-editor)
2. [Acceder al sistema](#2-acceder-al-sistema)
3. [Dashboard — gestión de guías](#3-dashboard--gestión-de-guías)
4. [Crear una guía nueva](#4-crear-una-guía-nueva)
5. [Tabs del editor](#5-tabs-del-editor)
   - [📋 Portada — Metadata](#tab-portada--metadata)
   - [📄 Secciones](#tab-secciones)
   - [🗂 Fichas — Recomendados](#tab-fichas--recomendados)
   - [🔗 CMS — Importar desde Discoolver](#tab-cms--importar-desde-discoolver)
   - [🖼 Media](#tab-media)
   - [👁 Preview](#tab-preview)
   - [✦ IA — Generación editorial](#tab-ia--generación-editorial)
   - [⬇ Exportar](#tab-exportar)
6. [Flujo de trabajo recomendado](#6-flujo-de-trabajo-recomendado)
7. [Sistema de badges](#7-sistema-de-badges)
8. [Secciones de la guía](#8-secciones-de-la-guía)
9. [Preguntas frecuentes](#9-preguntas-frecuentes)

---

## 1. Qué es el editor

El Editor de Guías Discoolver es la herramienta interna para producir las guías de viaje en formato PDF. El equipo editorial introduce los recomendados, asigna badges, ordena el contenido y genera el PDF final listo para publicar.

**Qué produce:** PDFs de 20 páginas con diseño Discoolver (portada, índice, secciones por categoría, contraportada).

**No es necesario saber diseño ni código.** El editor es una interfaz web donde se rellena contenido y se pulsa "Exportar".

---

## 2. Acceder al sistema

1. Abrir en el navegador: **http://localhost:8000/editor**
2. Introducir email y contraseña:
   - `editor@discoolver.com` / `discoolver2026`
   - `admin@discoolver.com` / `admin2026`
3. Click en **Iniciar sesión**

> La sesión dura 7 días. Si el sistema te pide login de nuevo, es que ha caducado.

---

## 3. Dashboard — gestión de guías

Al entrar ves el listado de todas las guías. Cada tarjeta muestra:
- **Ciudad** y **año** de la guía
- **Estado:** draft (borrador) · review (en revisión) · published · archived
- **Colección:** estandar, gastronomía, ocio nocturno, luxury…
- **Fecha** de última modificación

**Acciones desde el dashboard:**
- `+ Nueva guía` — crea una guía en blanco
- Click en una guía — abre el editor
- Icono duplicar — clona una guía existente (útil para reeditar una ciudad)
- Icono eliminar — borra la guía (irreversible)

---

## 4. Crear una guía nueva

1. Click en **`+ Nueva guía`**
2. Rellenar el formulario:

| Campo | Qué poner | Ejemplo |
|---|---|---|
| **Ciudad** | Nombre en mayúsculas | `MADRID` |
| **Año** | 4 dígitos | `2026` |
| **Edición** | Título largo | `Guía Discoolver Madrid 2026` |
| **Colección** | Tipo de guía | `estandar` |

3. Click en **Crear guía**

La guía se abre directamente en el editor, en el tab **Portada**.

---

## 5. Tabs del editor

La guía tiene 7 tabs en la barra superior. Se trabajan de izquierda a derecha.

---

### Tab Portada — Metadata

Datos generales de la guía y configuración de la portada.

**Campos principales:**

| Campo | Descripción |
|---|---|
| Ciudad / Año | Identificador de la guía |
| Edición | Título completo que aparece en la portada |
| Director | Nombre del firmante (por defecto: Carlos Jacoste) |
| Colección | Determina el color de acento de toda la guía |
| Color primario | Magenta `#C8006B` por defecto — cambiar si es colección especial |
| Headline 1 / 2 | Texto grande de portada ("INSPIRING / the World") |
| Tagline | Frase pequeña bajo el headline |
| Foto de portada | URL de la imagen de fondo |
| Alineación | Izquierda / Derecha del texto en portada |

**Nota del director (Template 04):**
Texto editorial del director de la guía. Se puede escribir directamente o generar con IA (ver tab IA).

---

### Tab Secciones

Activa o desactiva las secciones que aparecerán en la guía y asigna el número de página de cada una.

**Secciones disponibles:**
- Restaurantes · Fiesta · Ocio y Eventos · Arte y Exposiciones
- Experiencias · Alojamientos · Shopping · Influencers
- Secciones especiales: 10 Saves, Coollections

**Cómo usarlo:**
1. Activa el toggle de cada sección que quieres incluir
2. Escribe el número de página donde empieza esa sección (para el índice)
3. Guarda

> Si una sección está desactivada, sus fichas no aparecen en el PDF aunque tengan contenido.

---

### Tab Fichas — Recomendados

Aquí se gestiona todo el contenido: los lugares, eventos e influencers que aparecen en la guía.

**Columna izquierda — Selector de sección:**
Lista de todas las secciones. Click en una para ver sus fichas.

**Añadir una ficha manualmente:**
1. Click en **`+ Añadir`**
2. Rellenar los campos:

| Campo | Obligatorio | Descripción |
|---|---|---|
| Nombre | ✅ | Nombre del lugar tal como aparecerá en la guía |
| Tagline | — | Frase corta editorial (5-10 palabras) |
| Descripción | — | Texto del cuerpo (3-4 frases, estilo Discoolver) |
| Badge | — | Etiqueta visual (WOW, ICÓNICO, LOCAL-OWNED…) |
| URL foto | — | Enlace a la imagen de portada de la ficha |
| Web | — | URL del lugar |
| Dirección | — | Dirección física |
| URL Discoolver | — | Enlace a la ficha en discoolver.com |

3. Click en **Guardar**

**Editar una ficha:**
Click sobre la ficha → se expande en modo edición inline → modificar → Guardar.

**Reordenar fichas:**
Botones `↑` `↓` en cada ficha para cambiar el orden dentro de la sección.

**Desactivar sin borrar:**
Toggle "Activado/Desactivado" en el formulario expandido. Las fichas desactivadas no salen en el PDF pero siguen guardadas.

**Eliminar:**
Icono 🗑 en la ficha → confirmar.

---

### Tab CMS — Importar desde Discoolver

Importa recomendados directamente desde la base de datos de **api.discoolver.com** sin introducirlos a mano.

**Paso a paso:**

1. Busca el recomendado en el CMS de Discoolver y anota su **ID numérico**
   - El ID está en la URL del CMS o en el listado de businesses
   - Ejemplo: `69`, `1197`, `3867`

2. En el tab CMS, escribe los IDs en el cuadro de texto
   - Puedes poner varios separados por coma, espacio o uno por línea
   - Ejemplo: `69, 1197, 3867`

3. Click en **"Cargar preview →"**
   - Aparece una tarjeta por cada recomendado con: nombre, descripción, categoría detectada e imágenes de la galería

4. Para cada ficha:
   - **Elige la foto de portada** — click en la miniatura que quieres usar
   - **Ajusta la sección** si la detectada automáticamente no es correcta
   - **Asigna el badge** editorial (WOW, ICÓNICO, etc.)

5. Click en **"Importar X a la guía"**
   - Los recomendados aparecen automáticamente en el tab Fichas con todos los datos

> **Nota:** Los datos que vienen del CMS son: nombre, descripción limpia, web, URL Discoolver y galería de fotos. La descripción editorial y el badge los asigna siempre el equipo de Discoolver.

---

### Tab Media

Gestor de imágenes de la guía (fotos de portada, fotos del director, etc.).

**Subir imagen:**
1. Click en **Subir archivo**
2. Seleccionar imagen (JPG/PNG, máx. recomendado 2MB)
3. La imagen se sube al servidor y aparece con su URL

**Copiar URL:**
Click en la URL de cualquier imagen para copiarla → pegar en el campo "URL foto" de cualquier ficha.

---

### Tab Preview

Vista previa del JSON de configuración que se envía al motor de templates. Útil para debug técnico. El equipo editorial no necesita usar este tab habitualmente.

---

### Tab IA — Generación editorial

Dos modos: **Generar textos** y **Sugerir recomendados**.

#### Modo "Generar textos"

Genera descripción y/o tagline para las fichas que están vacías o que quieres reescribir.

1. Selecciona la sección (Restaurantes, Fiesta…)
2. Elige si generar **descripción**, **tagline** o **ambos**
3. Click en **Generar**
4. Revisa los textos generados → Guardar los que te gusten

> El tono editorial es el estilo Discoolver: directo, sin relleno, datos concretos, como un amigo local.

#### Modo "Sugerir recomendados"

La IA propone nombres de lugares para cada sección basándose en la ciudad de la guía.

1. Ajusta cuántos recomendados quieres por sección
2. Añade un hint opcional ("solo lugares con terraza", "enfoque lujo")
3. Click en **Sugerir**
4. Marca los que te interesan → **Añadir seleccionados**

> Las sugerencias de IA son un punto de partida. Siempre revisar que los lugares existen y están en el CMS.

---

### Tab Exportar

Genera el PDF final y gestiona el historial de versiones.

**Generar PDF:**
1. Click en **Exportar PDF**
2. Esperar (20-40 segundos según el número de fichas)
3. Se descarga automáticamente o aparece el enlace de descarga

**Historial de snapshots:**
Cada export guarda un snapshot. Puedes ver versiones anteriores y descargarlas.

**Crear snapshot manual:**
Útil antes de hacer cambios grandes. Click en **Guardar snapshot** → escribe una etiqueta ("antes de revisión", "v1 aprobada por cliente").

---

## 6. Flujo de trabajo recomendado

### Guía nueva desde cero

```
1. Dashboard → Nueva guía (ciudad + año)
2. Tab Portada → rellenar datos de portada y nota del director
3. Tab Secciones → activar secciones relevantes + números de página
4. Tab CMS → importar recomendados por ID desde el CMS
5. Tab Fichas → revisar fichas importadas, asignar badges, reordenar
6. Tab IA → generar textos para fichas sin descripción editorial
7. Tab Fichas → revisar y ajustar textos de IA
8. Tab Exportar → generar PDF → enviar a revisión
```

### Actualización de una guía existente

```
1. Dashboard → abrir la guía
2. Tab CMS → importar novedades por ID
3. Tab Fichas → revisar, desactivar bajas, reordenar
4. Tab Exportar → crear snapshot manual → generar PDF
```

---

## 7. Sistema de badges

Los badges son etiquetas visuales que aparecen sobre la foto de cada recomendado. Son una **decisión 100% editorial** — no vienen del CMS.

| Badge | Color | Significado |
|---|---|---|
| **WOW** | Magenta | Lo mejor de la guía — máximo 3 por sección |
| **NUEVO 2026** | Magenta | Abierto o muy relevante este año |
| **ICÓNICO** | Navy | Lugar de referencia histórica de la ciudad |
| **LOCAL-OWNED** | Verde | Negocio local independiente (no cadena) |
| **BEST VIEW** | Azul | Vista excepcional |
| **ROMÁNTICO** | Rojo | Para parejas |
| **SOLO OK** | Violeta | Perfecto para ir solo |
| **FAMILY OK** | Ámbar | Apto para familias |
| **DESIGN** | Gris | Interiorismo o arquitectura destacada |
| **WELLNESS** | Verde azulado | Foco en bienestar |
| **AF-FRIENDLY** | Verde claro | Animal friendly |
| **LATE NIGHT** | Índigo | Abre tarde o hasta tarde |
| **VALUE / €** | Gris | Buena relación calidad-precio |
| **SPLURGE / €€€** | Dorado | Experiencia premium, precio alto |
| **LUXURY** | Dorado | Lujo total |

**Reglas de uso:**
- Máximo 1 badge por ficha
- No más de 3 WOW por sección
- NUEVO 2026 caduca con el año — actualizar en cada reedición

---

## 8. Secciones de la guía

| Sección en editor | Template PDF | Tipo de contenido |
|---|---|---|
| Restaurantes | 06 | Bares, restaurantes, cafés |
| Fiesta | 08 | Clubs, bares de copas, rooftops |
| Ocio y Eventos | 09 | Eventos temporales, conciertos, ferias |
| Arte y Exposiciones | 10 | Museos, galerías, espacios culturales |
| Experiencias | 11 | Tours, actividades, experiencias únicas |
| Alojamientos | 12 | Hoteles, apartamentos, hostels cool |
| Shopping | 13 | Tiendas, mercados, concept stores |
| Influencers | 14 | Creadores locales de contenido |
| **10 Saves** | 18 | Selección editorial top 10 transversal |
| **Coollections** | 20 | Agrupaciones por estilo (Foodie, Wellness…) |

---

## 9. Preguntas frecuentes

**¿Puedo tener la misma ficha en varias secciones?**
No directamente. Si un lugar encaja en Restaurantes y en 10 Saves, créalo en Restaurantes y añádelo también a 10 Saves como ficha separada.

**¿Qué pasa si no pongo foto en una ficha?**
La ficha sale en el PDF sin imagen, con un bloque de color de fondo. Siempre mejor poner foto.

**¿Cuántos recomendados por sección?**
Sin límite técnico, pero el template está optimizado para:
- Secciones principales (Restaurantes, Fiesta): 6-12 fichas
- Secciones secundarias (Arte, Shopping): 4-8 fichas
- 10 Saves: exactamente 10
- Coollections: 4-6 por estilo

**¿Cómo sé el ID de un recomendado en el CMS?**
Entra al CMS de Discoolver, busca el lugar y mira la URL. El número al final es el ID. Ejemplo: `/cms/business/1197` → ID es `1197`.

**¿El PDF sale en inglés o en español?**
Por defecto en español. Si la guía es para un mercado anglófono, los textos hay que introducirlos directamente en inglés — el sistema no traduce.

**¿Puedo duplicar una guía de una ciudad para hacer la de otra?**
Puedes duplicarla (icono en el dashboard) pero tendrás que limpiar todos los recomendados y cambiar la ciudad. Es más rápido crear una nueva si son ciudades distintas.

**¿Qué es un snapshot?**
Una copia guardada del estado de la guía en un momento concreto. No es el PDF — es la configuración. Útil para volver a una versión anterior si algo sale mal.

---

*Editor de Guías Discoolver · Uso interno · No compartir fuera del equipo*
