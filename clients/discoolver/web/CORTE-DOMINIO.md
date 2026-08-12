# Corte de discoolver.com — checklist ejecutable

**Estado (verificado 12-ago):** registrador IONOS (acceso Carlos) · zona DNS en
CLOUDFLARE (NS kayden/leia.ns.cloudflare.com) · de esa zona cuelgan
app/api/images.discoolver.com (LA PLATAFORMA) y el correo (MX ionos.es) ·
la web vieja es un Next servido tras el proxy de Cloudflare, y el dominio está
RECLAMADO en otra cuenta de Vercel (la de la web vieja, seguramente de Diego).

## ⛔ Lo que NO se hace

Cambiar los nameservers en IONOS. Tumbaría app, api, images y el correo:
los orígenes reales están ocultos tras el proxy de Cloudflare y no se pueden
replicar a ciegas. El corte se hace DENTRO de Cloudflare, tocando solo 2 hosts.

## Qué falta para poder ejecutar (2 accesos)

1. **Login de Cloudflare** de la zona discoolver.com (¿Carlos o Diego?).
2. Liberar el dominio en la **cuenta de Vercel vieja** (Diego: quitar
   discoolver.com del proyecto viejo), O verificación TXT `_vercel` en
   Cloudflare desde nuestro dashboard (Domains → Add → discoolver.com → copia
   el TXT que pide). Cualquiera de las dos vale.

## Lo que YA está preparado (este repo)

- Redirects de las rutas viejas (`/es/destinos` → `/360/destinos`…): next.config.ts ✓
- `site.url` sale de `NEXT_PUBLIC_SITE_URL` ✓ — el flip de canónicos/sitemap/OG
  es una env, no un deploy de código.
- La web es bilingüe con hreflang y sitemap completos ✓

## El día D (15 min, con acceso a Cloudflare)

0. **Exportar la zona** de Cloudflare (Advanced → Export) — es el rollback.
1. Vercel (nuestro team) → discoolver-landing → Domains → add `discoolver.com`
   y `www.discoolver.com` (con el TXT o tras liberar; apex = primario,
   www → redirect 308 al apex — el apex es lo que hoy sirve, se conserva).
2. En Cloudflare, SOLO estos dos hosts (el resto de la zona NO SE TOCA):
   - `discoolver.com`  → A `76.76.21.21` — **proxy OFF (nube gris)**
   - `www`             → CNAME `cname.vercel-dns.com` — **proxy OFF**
3. Esperar verificación en Vercel (~1-5 min) y SSL.
4. Env en Vercel (production): `NEXT_PUBLIC_SITE_URL=https://discoolver.com`
   → Redeploy.
5. Verificar: apex 200 tienda nueva · /360 · /en · /es/destinos → 308 →
   /360/destinos · app.discoolver.com sigue 200 · api.discoolver.com sigue 200 ·
   enviar/recibir un correo de prueba.
6. Última pasada: en app-landing, cambiar los enlaces "Para empresas"
   (hoy discoolver-landing.vercel.app/360 → https://discoolver.com/360) y su
   propia NEXT_PUBLIC_SITE_URL si aplica. Y avisar a Search Console.

## Rollback (si algo huele mal)

Restaurar los 2 registros del export del paso 0 en Cloudflare. La web vieja
vuelve en minutos. Nada más se ha tocado.
