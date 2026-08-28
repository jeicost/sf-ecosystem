# DNS — lagrimasdesanchez.com y .es

Estado a 28-ago-2026: los cuatro dominios están **añadidos y verificados** en Vercel.
Lo único que falta son los registros en IONOS. Cinco minutos de panel.

---

## ⛔ Lo primero: NO toques los nameservers

En IONOS te va a salir un botón tentador que dice algo como
«usar servidores de nombres externos». **No lo pulses.**

Dos razones, ambas reales:

1. **Te quedas sin correo.** Los dos dominios tienen correo IONOS activo
   (`mx00.ionos.es`, `mx01.ionos.es`) y su SPF. Mover la zona a Vercel se
   lleva por delante los MX y el correo deja de entrar. Vercel no gestiona correo.
2. **Ya nos pasó.** Es exactamente lo que dejó huérfano a startupsfactory.es
   en mayo: tres caídas en 24 h porque la zona estaba a medias entre IONOS y Vercel.

Los nameservers se quedan como están:
`ns1078.ui-dns.biz` · `ns1084.ui-dns.de` · `ns1067.ui-dns.com` · `ns1121.ui-dns.org`

Solo cambiamos **dos registros por dominio**. Nada más.

---

## Dónde se hace

IONOS → **Dominios y SSL** → clic en el dominio → pestaña **DNS**.

### Antes de nada: quita el aparcamiento

Hoy los dos dominios apuntan a la página de aparcamiento de IONOS
(`217.160.0.55` el .com, `217.160.0.39` el .es). Si en la ficha del dominio
ves activada una **«Redirección»** o **«Página de aparcamiento»**, desactívala
primero: mientras esté puesta, IONOS no te deja editar el registro A.

---

## Los registros

### lagrimasdesanchez.com

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| **A** | `@` | `216.150.1.1` | 1 hora |
| **A** | `@` | `216.150.16.1` | 1 hora |
| **CNAME** | `www` | `cname.vercel-dns.com` | 1 hora |

### lagrimasdesanchez.es

| Tipo | Nombre | Valor | TTL |
|---|---|---|---|
| **A** | `@` | `216.150.1.1` | 1 hora |
| **A** | `@` | `216.150.16.1` | 1 hora |
| **CNAME** | `www` | `cname.vercel-dns.com` | 1 hora |

**Notas de campo:**

- El registro A de `@` **ya existe** (apunta al aparcamiento). Edítalo, no crees uno nuevo.
  Luego añade el segundo como registro nuevo.
- Si IONOS solo te deja **un** registro A: usa `76.76.21.21`. Funciona igual,
  solo pierdes un poco de redundancia.
- El nombre `@` en algunos paneles de IONOS se escribe dejando el campo **vacío**.
- Si ya hay algo en `www`, sustitúyelo.
- **No toques** los MX, ni el TXT del SPF, ni ningún `_dmarc` / `_domainkey`.
  Esos son el correo.

---

## Qué pasará cuando propague

Ya está configurado en Vercel, no hay que hacer nada más:

```
www.lagrimasdesanchez.com  →  308  →  lagrimasdesanchez.com
lagrimasdesanchez.es       →  308  →  lagrimasdesanchez.com
www.lagrimasdesanchez.es   →  308  →  lagrimasdesanchez.com
```

El canónico es el **apex .com**. El certificado SSL lo emite Vercel solo,
en cuanto ve los registros correctos (un par de minutos).

Propagación: normalmente 15–30 min, hasta 4 h en el peor caso.

---

## El último paso lo hago yo

Cuando propague hay que cambiar `NEXT_PUBLIC_SITE_URL` de
`https://lagrimas-de-sanchez.vercel.app` a `https://lagrimasdesanchez.com`
y volver a desplegar — si no, los canonical, los OG y las vueltas de Stripe
seguirán apuntando al dominio viejo.

No hace falta que te acuerdes. Lanza esto y él solo espera, comprueba y cambia:

```bash
node clients/lagrimas-de-sanchez/dns/vigilar.mjs
```

O solo mirar cómo va, sin tocar nada:

```bash
node clients/lagrimas-de-sanchez/dns/vigilar.mjs --solo-mirar
```
