# Taxonomía de Discoolver — lo que necesitamos en el CMS

**12 de agosto de 2026.** Generado cruzando nuestra taxonomía cerrada
contra tu base de producción, con el usuario `curator` que nos diste.

Son **8 categorías y 113 subcategorías**. De aquí salen las secciones de las
guías, las de la app y las del curador: es la misma estructura para todo, así
que necesitamos las mismas en cada ciudad que abramos.

> Si una ciudad no tiene material para una sección, el editor la apaga al montar
> la guía y desaparece del índice. Que exista en el CMS no obliga a usarla.

---

## 1. Las 8 categorías

| Categoría | RAW_ID | madrid | ronda | barcelona | bangkok |
|---|---|:--:|:--:|:--:|:--:|
| Restaurantes y Cafés | `restaurantes` | sí | sí | sí | sí |
| Vida nocturna | `_nightlife` | sí | `fiesta` | `fiesta` | `fiesta` |
| Arte y cultura | `_arte_y_cultura` | sí | `museos` | `museos` | `museos` |
| Experiencias y eventos | `_experiencias_unicas` | sí | **NO** | `experiencias_y_actividades` | `experiencias_y_actividades` |
| Compras y moda | `compras` | sí | **NO** | sí | sí |
| Alojamiento | `alojamiento` | sí | sí | sí | sí |
| Bienestar, salud y belleza | `_wellness` | sí | **NO** | **NO** | **NO** |
| Naturaleza y aire libre | `_naturaleza` | sí | `parques` | `naturaleza` | `parques` |

Donde pone un nombre en vez de «sí», esa ciudad tiene una categoría más estrecha
(p. ej. `museos` en lugar de arte y cultura entera) y las fichas caen ahí.

### Categorías a añadir por ciudad

- **madrid**: ninguna, está completa
- **ronda**: `_arte_y_cultura`, `_experiencias_unicas`, `_naturaleza`, `_nightlife`, `_wellness`, `compras`
- **barcelona**: `_arte_y_cultura`, `_experiencias_unicas`, `_naturaleza`, `_nightlife`, `_wellness`
- **bangkok**: `_arte_y_cultura`, `_experiencias_unicas`, `_naturaleza`, `_nightlife`, `_wellness`

---

## 2. Las 113 subcategorías

`nueva` = hay que crearla · el resto ya existen en tu catálogo.


### Restaurantes y Cafés (17)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Book cafés y cafés concepto | `book-cafe` | **nueva** |
| Brunch | `_brunch_restaurantes` | existe |
| Cafés y Bares | `_cafes_&_bars` | existe |
| Cervecerías artesanas | `cerveceria-artesana` | **nueva** |
| Cocina local | `_local_cuisine` | existe |
| Especial delivery | `_especial_delivery` | existe |
| Exclusivo | `_exclusivo` | existe |
| Experiencias gastronómicas | `_experiencias_gastronómicas` | existe |
| Heladerías | `heladerias` | **nueva** |
| Low Cost | `_low_cost` | existe |
| Michelin | `_michelin` | existe |
| Pastelerías y obradores | `pastelerias` | **nueva** |
| Rooftops | `_rooftops_restaurantes` | existe |
| Streetfood y Foodtrucks | `_streetfood_&_foodtrucks_restaurantes` | existe |
| Especial teletrabajo | `_especial_teletrabajo_restaurantes` | existe |
| Tradicional | `_tradicional` | existe |
| Trendy | `_trendy` | existe |

### Vida nocturna (15)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Afterhours | `_afterhours_nightlife` | existe |
| Bares y Pubs | `_bares_y_pubs` | existe |
| Beachclubs | `_beachclubs` | existe |
| Asociaciones cannábicas | `clubes-cannabis` | **nueva** |
| Coctelerías | `_coctelerías` | existe |
| Conciertos | `_conciertos` | existe |
| Discotecas y Clubs | `_discotecas_&_clubs` | existe |
| Festivales | `_festivales` | existe |
| Fiestas populares locales | `_fiestas_populares_locales` | existe |
| Karaoke | `_karaoke_nightlife` | existe |
| Música en directo | `_conciertos_y_live_music` | existe |
| Salas de baile | `_salas_de_baile` | existe |
| Salas de conciertos | `_salas_de_concierto` | existe |
| Fiestas y sesiones de música | `_fiestas_y_sesiones_de_musica` | existe |
| Zonas de fiesta | `_zonas_de_fiesta` | existe |

### Arte y cultura (10)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Arquitectura | `_arquitectura` | existe |
| Arte urbano | `arte-urbano` | **nueva** |
| Barrios | `_barrios` | existe |
| Cool Places | `_cool_places` | existe |
| Escapadas | `_escapadas` | existe |
| Exposiciones | `_exposiciones` | existe |
| Librerías | `_librerías` | existe |
| Lugares de culto | `lugares-de-culto` | **nueva** |
| Museos y galerías de arte | `_museos_y_galerías_de_arte` | existe |
| Plazas y monumentos | `_plazas_y_monumentos` | existe |

### Experiencias y eventos (16)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Actividades de aventura | `_actividades_de_aventura` | existe |
| Boleras y salas recreativas | `boleras-recreativos` | **nueva** |
| Cines y teatros | `_cines_y_teatros` | existe |
| Clases y talleres | `_clases_y_talleres` | existe |
| Escape rooms | `escape-rooms` | **nueva** |
| Espectáculos | `_espectáculos` | existe |
| Eventos deportivos | `_eventos_deportivos_sports` | existe |
| Excursiones y tours | `_excursiones_y_tours` | existe |
| Ferias y tradeshows | `_ferias_y_tradeshows` | existe |
| Más de 18 | `_más_de_18` | existe |
| Mercadillos de temporada | `_mercados` | existe |
| Motor y karting | `_motor_sports` | existe |
| Parques temáticos y atracciones | `_parques_temáticos_y_atracciones` | existe |
| Polideportivos y pistas | `_polideportivos_sports` | existe |
| Deportes de raqueta | `_raqueta_sports` | existe |
| Zoos y acuarios | `zoo-acuarios` | **nueva** |

### Compras y moda (22)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Antigüedades y coleccionismo | `antiguedades-coleccionismo` | **nueva** |
| Cosmética y perfumería | `belleza-perfumeria` | **nueva** |
| Calzado y sneakers | `calzado-sneakers` | **nueva** |
| Centros comerciales y outlets | `_centros_comerciales` | existe |
| Concept Stores | `_concept_stores` | existe |
| Coworkings | `_coworkings_shopping` | existe |
| Deporte y outdoor | `deporte-outdoor` | **nueva** |
| Discos e instrumentos | `discos-musica` | **nueva** |
| Eventos de moda | `_eventos_de_moda` | existe |
| Gourmet y alimentación | `gourmet-alimentacion` | **nueva** |
| Hogar, decoración y plantas | `hogar-decoracion` | **nueva** |
| Joyería, gafas y accesorios | `joyeria-accesorios` | **nueva** |
| Jugueterías y juegos de mesa | `juguetes-juegos` | **nueva** |
| Mascotas y animales | `mascotas` | **nueva** |
| Mercados | `_mercados_(callejeros_y_de_abastos)` | existe |
| Moda y complementos | `moda` | **nueva** |
| Papelería y manualidades | `papeleria-manualidades` | **nueva** |
| Productos locales y artesanía | `_productos_y_marcas_locales` | existe |
| Tecnología y videojuegos | `tecnologia-videojuegos` | **nueva** |
| Vinos y licorerías | `vinos-licores` | **nueva** |
| Vintage y segunda mano | `vintage-segunda-mano` | **nueva** |
| Zonas de compras | `_zonas_de_compras` | existe |

### Alojamiento (11)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Naturaleza y rural | `_naturaleza_y_rural` | existe |
| Apartamentos | `_apartamentos` | existe |
| Camping y glamping | `camping-glamping` | **nueva** |
| 5 estrellas | `_5_estrellas` | existe |
| Coliving | `_coliving_alojamientos` | existe |
| Hostal | `_hostal` | existe |
| Hotel | `_hotel` | existe |
| Hotel Boutique | `_hotel_boutique` | existe |
| Resorts | `_resorts` | existe |
| Villas | `_villas` | existe |
| Viviendas singulares | `_viviendas_singulares` | existe |

### Bienestar, salud y belleza (9)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Barberías | `barberias` | **nueva** |
| Centros de belleza y peluquerías | `_centros_belleza_y_peluquerías` | existe |
| Gimnasios y fitness | `_gimnasios_sports` | existe |
| Masajes | `_masajes` | existe |
| Piscinas | `_piscinas_sports` | existe |
| Spas y centros de bienestar | `_spas_and_wellness_centers` | existe |
| Talleres y retiros | `_talleres_y_retiros` | existe |
| Estudios de tatuaje | `_estudios_de_tatuaje` | existe |
| Yoga, pilates y meditación | `_gyms_and_yoga_studios` | existe |

### Naturaleza y aire libre (13)

| Subcategoría | RAW_ID | estado |
|---|---|---|
| Actividades al aire libre | `_actividades_y_deportes_al_aire_libre` | existe |
| Deportes acuáticos | `deportes-acuaticos` | **nueva** |
| Escalada y rocódromos | `_escalada_y_rocodromos_sports` | existe |
| Espacios naturales | `espacios-naturales` | **nueva** |
| Miradores | `miradores` | **nueva** |
| Montaña | `_montania_sports` | existe |
| Deportes de nieve | `_deportes_de_nieve_sports` | existe |
| Parques y jardines | `_parques_y_jardines` | existe |
| Playas y zonas de costa | `_playas_y_zonas_de_costa` | existe |
| Running | `_running_sports` | existe |
| Rutas de senderismo y ciclismo | `_rutas_para_senderismo_y_ciclismo` | existe |
| Skate | `_skate_sports` | existe |
| Surf y olas | `_surf_y_olas_sports` | existe |

---

## 3. Lo que te pedimos

**1. Crear 30 subcategorías nuevas** (las marcadas arriba).
   Por categoría: Compras y moda 15 · Restaurantes y Cafés 4 · Experiencias y eventos 3 · Naturaleza y aire libre 3 · Arte y cultura 2 · Vida nocturna 1 · Alojamiento 1 · Bienestar, salud y belleza 1.
   La de Compras es la más grande: hoy tienes `compras` y `tiendas` como macro,
   pero sin ningún desglose por tipo de tienda.

**2. Ligar categorías y subcategorías a cada ciudad.** Es lo que nos dijiste:
   que una ciudad no la tenga solo significa que no se le ha añadido. Ahora mismo
   de las 83 subcategorías que ya existen, **solo una está ligada a alguna ciudad**,
   así que no saldrían en la navegación de ninguna.

**3. Dinos si alguna no encaja** con cómo tenéis montada la app y la quitamos de
   la taxonomía. Preferimos no tener una sección a tenerla vacía.

Si te viene mejor un `.sql` con los INSERT ya escritos, o un CSV, dínoslo y te lo
mandamos en un rato: lo tenemos en un YAML del que sale cualquier formato.

