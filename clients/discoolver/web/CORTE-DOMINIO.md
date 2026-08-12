# Corte de discoolver.com — LISTO PARA EJECUTAR

Estado verificado el 12-ago-2026. Ya no falta nada de Diego: con acceso a
Cloudflare se hace entero.

## Lo que hay hoy

| | |
|---|---|
| Registrador | IONOS (**no se toca**) |
| Zona DNS | **Cloudflare** (`kayden` / `leia.ns.cloudflare.com`) |
| Apex y www | Proxy de Cloudflare → web antigua (SPA de 2024, "Sing up", "Confían en nosotros") |
| `app` · `api` · `images` | **LA PLATAFORMA. No se tocan.** |
| MX | `mx00/mx01.ionos.es` — **el correo. No se tocan.** |
| `/portal`, `/es`, `/en` | Rutas de la misma SPA (todas devuelven el mismo HTML). Nada que preservar |

## ⛔ La regla

**Nunca cambiar los nameservers en IONOS.** Tumbaría plataforma y correo: los
orígenes reales están tras el proxy de Cloudflare y no se pueden replicar a
ciegas. El corte se hace DENTRO de Cloudflare tocando **solo 3 registros**.

## Paso 0 — el rollback, antes de nada

Cloudflare → DNS → **Export** (descarga el fichero de zona). Es el seguro.

## Paso 1 — verificar la propiedad (1 registro)

Los dominios ya están añadidos a nuestro proyecto `discoolver-landing` y Vercel
pide un TXT. En Cloudflare, DNS → Add record:

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| TXT | `_vercel` | `vc-domain-verify=discoolver.com,09cc5bc752d38d33fe75` | — |
| TXT | `_vercel` | `vc-domain-verify=www.discoolver.com,9944aa5b01b1429e6481` | — |

(Sí, dos TXT con el mismo nombre `_vercel`: Cloudflare admite varios.)

Verificar con: `vercel domains inspect discoolver.com` o el dashboard.

## Paso 2 — apuntar el dominio (2 registros)

Solo estos. **El resto de la zona no se toca.**

| Tipo | Nombre | Contenido | Proxy |
|---|---|---|---|
| A | `discoolver.com` (@) | `76.76.21.21` | **OFF — nube gris** |
| CNAME | `www` | `cname.vercel-dns.com` | **OFF — nube gris** |

⚠️ El proxy en gris es obligatorio: con la nube naranja, Vercel no puede emitir
el certificado y el sitio queda en bucle de redirección.

## Paso 3 — el canónico

Vercel → discoolver-landing → Settings → Environment Variables (Production):

```
NEXT_PUBLIC_SITE_URL = https://discoolver.com
```

Redeploy. Con eso, canonical, sitemap, hreflang y OG saltan al dominio bueno
(el código ya lo lee de esa variable).

## Paso 4 — verificar, en este orden

```bash
curl -sI https://discoolver.com | head -3                   # 200, la tienda nueva
curl -s https://discoolver.com | grep -o '<title>[^<]*'     # "Discoolver — Guías…"
curl -sI https://discoolver.com/es/destinos | grep -i loc   # 308 → /360/destinos
curl -so /dev/null -w '%{http_code}\n' https://app.discoolver.com/    # 200 ← LA PLATAFORMA
curl -so /dev/null -w '%{http_code}\n' https://api.discoolver.com/v3/countries/es  # 200
dig +short MX discoolver.com                                 # mx00/mx01.ionos.es
```

Y **enviar y recibir un correo de prueba** a una dirección @discoolver.com.

## Paso 5 — la cola

- app-landing: los enlaces "Para empresas" pasan de
  `discoolver-landing.vercel.app/360` a `https://discoolver.com/360`.
- Search Console: añadir la propiedad y mandar el sitemap.
- Avisar a Diego: el dominio ya sirve la web nueva (su CMS y la plataforma
  siguen intactos en sus subdominios).

## Rollback

Restaurar los 2 registros del export del paso 0. La web vieja vuelve en minutos.
Nada más se ha tocado.
