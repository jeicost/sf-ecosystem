# Mensaje para Diego — 13 de agosto de 2026

> Para copiar y pegar. Son dos peticiones independientes: la primera es la que
> corre prisa (bloquea una sección de la home), la segunda es la que ya
> estábamos hablando del acceso único.

---

Diego, buenas. Dos cosas de la web nueva, y las dos dependen de vosotros.

## 1. Nos falta un feed de recomendados de verdad

Queremos poner en la home de `discoolver.com` los mejores sitios de cada
ciudad, con un selector para cambiar de ciudad. Tiramos del endpoint que ya
usamos para las cifras:

```
GET /v3/sections/1/es/41?city=Madrid&interests=&cityid=41
```

y el bloque `main_post` nos devuelve seis sitios por ciudad. El problema es que
**los seis vienen con `"description": "Sponsored"`**, en todas las ciudades y en
todas las secciones que hemos probado (`/sections/1`, `/2`, `/3` y `/4`):

- **Madrid**: Reina Sofía, Thyssen, Real Jardín Botánico, Caixaforum, San
  Jerónimo el Real, Alcalá de Henares.
- **Barcelona**: Santa María del Mar, Catedral, Parc de la Ciutadella, Laberint
  d'Horta, Parc Cervantes, Park Güell.

Todos con `categories: "Qué ver"` y entre 0 y 4 guardados.

No podemos publicar eso como «lo mejor de la ciudad» por dos razones: son
monumentos de guía turística clásica, justo lo contrario de lo que vende la
marca, y sobre todo **la web dice explícitamente que nadie paga por aparecer**.
Enseñar seis fichas marcadas como patrocinadas debajo de esa frase nos deja
vendidos si alguien lo mira.

**Lo que necesitamos:** un endpoint (o un parámetro en el que ya existe) que
devuelva los recomendados **curados**, sin patrocinio, ordenados por lo que sea
que uséis internamente — guardados, recomendaciones, valoración editorial…

Con que nos devuelva esto por ciudad nos vale:

```
título · descripción corta · imagen · categoría · subcategoría · URL de la ficha
```

Y una pregunta suelta: ¿hay forma de saber **cuántos sitios publicados tiene
cada una de las 8 categorías** de la taxonomía en una ciudad? Hoy solo vemos
recuentos por subcategoría (`#hoteles`, `#arquitectura`…) en
`circle_hashtag_plans`, y no sabemos sumarlos a las ocho sin adivinar el mapeo.
Mientras tanto hemos quitado los números de la web, porque los que había
estaban escritos a mano y no los actualizaba nadie.

## 2. Que el correo del visitante lo deje dentro ya identificado

En la home hemos cambiado la puerta: antes había un formulario que pedía ciudad
y correo obligatorios para «avisarte cuando abra tu ciudad». Como la plataforma
ya está abierta, eso era pedir permiso para entrar en algo que está abierto, así
que ahora el correo es **opcional** y el botón entra siempre.

Lo que nos gustaría es que, **si el visitante deja el correo, llegue a
`app.discoolver.com` ya identificado** en vez de entrar como anónimo.

Eso no lo podemos hacer desde la web: hace falta que la plataforma acepte una
entrega de sesión. Nos vale cualquiera de las dos:

- **Enlace mágico**: nosotros te llamamos a un endpoint vuestro con el correo y
  un secreto compartido, vosotros nos devolvéis una URL de un solo uso y
  redirigimos ahí.
- **JWT firmado** (lo que ya habíamos hablado para el acceso único del curador):
  firmamos un token con el correo y la plataforma lo valida. Para esto
  necesitamos de vosotros **JWKS o el secreto, el `iss`, el `aud`, los roles y
  el dominio desde el que se puede embeber**. Es exactamente lo mismo que
  pedíamos para montar el `/sso` del curador, así que si lo resolvemos una vez
  nos sirve para las dos cosas.

Dinos cuál os encaja mejor y lo montamos por nuestro lado. Mientras no exista,
el correo se guarda y la entrada es anónima — no bloquea nada, pero perdemos la
mitad de la gracia.

Gracias.
