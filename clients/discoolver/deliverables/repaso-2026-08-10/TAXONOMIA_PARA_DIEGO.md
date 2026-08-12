# La taxonomía de las guías — qué necesitamos en el CMS

Generado el 12-ago-2026 contrastando nuestra taxonomía cerrada contra tu base.
Son **8 categorías y 113 subcategorías**: las secciones de las guías salen de aquí,
así que necesitamos las mismas en todas las ciudades que abramos.

---
## 1. Las 8 categorías

| Nuestra | Cómo se llama en tu CMS | madrid | ronda | barcelona | bangkok |
|---|---|:--:|:--:|:--:|:--:|
| Restaurantes y Cafés | `restaurantes` | ✅ | ✅ | ✅ | ✅ |
| Vida nocturna | `_nightlife` | ✅ | ⚠️ fiesta | ⚠️ fiesta | ⚠️ fiesta |
| Arte y cultura | `_arte_y_cultura` | ✅ | ⚠️ museos | ⚠️ museos | ⚠️ museos |
| Experiencias y eventos | `_experiencias_unicas` | ✅ | ❌ | ⚠️ experiencias_y_actividades | ⚠️ experiencias_y_actividades |
| Compras y moda | `compras` | ✅ | ❌ | ✅ | ✅ |
| Alojamiento | `alojamiento` | ✅ | ✅ | ✅ | ✅ |
| Bienestar, salud y belleza | `_wellness` | ✅ | ❌ | ❌ | ❌ |
| Naturaleza y aire libre | `_naturaleza` | ✅ | ⚠️ parques | ⚠️ naturaleza | ⚠️ parques |

✅ = está · ⚠️ = hay otra más estrecha · ❌ = no existe en esa ciudad

### Lo que hay que añadir, ciudad a ciudad

- **ronda**: `_arte_y_cultura`, `_experiencias_unicas`, `_naturaleza`, `_nightlife`, `_wellness`, `compras`
- **barcelona**: `_arte_y_cultura`, `_experiencias_unicas`, `_naturaleza`, `_nightlife`, `_wellness`
- **bangkok**: `_arte_y_cultura`, `_experiencias_unicas`, `_naturaleza`, `_nightlife`, `_wellness`

---
## 2. Las 113 subcategorías

- **83** ya existen en tu catálogo.
- **30** hay que crearlas.
- De las que existen, solo **1** está ligada a Madrid: el resto no saldría en la navegación de ninguna ciudad.

### Las 30 que hay que crear

**Arte y cultura** (2)
`arte-urbano`, `lugares-de-culto`

**Experiencias y eventos** (3)
`boleras-recreativos`, `escape-rooms`, `zoo-acuarios`

**Alojamiento** (1)
`camping-glamping`

**Naturaleza y aire libre** (3)
`deportes-acuaticos`, `espacios-naturales`, `miradores`

**Vida nocturna** (1)
`clubes-cannabis`

**Restaurantes y Cafés** (4)
`book-cafe`, `cerveceria-artesana`, `heladerias`, `pastelerias`

**Compras y moda** (15)
`antiguedades-coleccionismo`, `belleza-perfumeria`, `calzado-sneakers`, `deporte-outdoor`, `discos-musica`, `gourmet-alimentacion`, `hogar-decoracion`, `joyeria-accesorios`, `juguetes-juegos`, `mascotas`, `moda`, `papeleria-manualidades`, `tecnologia-videojuegos`, `vinos-licores`, `vintage-segunda-mano`

**Bienestar, salud y belleza** (1)
`barberias`

---
## 3. Lo que te pedimos

1. **Crear las 30 subcategorías** de arriba. La de Compras es la más grande (15):
   hoy tu catálogo tiene `compras` y `tiendas` como macro, pero sin desglose.
2. **Ligar las 8 categorías y las 113 subcategorías a cada ciudad** que abramos
   —hoy Madrid, Ronda, Barcelona y Bangkok— para que salgan en su navegación.
3. Si alguna no te encaja con cómo tenéis montada la app, dínoslo y la quitamos
   de la taxonomía: es mejor no tener una sección que tenerla vacía.

El listado completo de las 113, con su nombre en español y su RAW_ID, te lo
pasamos en el formato que prefieras (SQL, CSV o Excel).
