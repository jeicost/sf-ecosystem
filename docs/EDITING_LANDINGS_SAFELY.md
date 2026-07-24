# Editar las landings sin riesgo

Guía práctica para tocar cualquier web/landing del ecosistema sin romper lo que ya está en producción. Léela antes de editar contenido o diseño de un sitio live.

## TL;DR — el flujo seguro (siempre)

```
1. git checkout -b edit/<sitio>-<que-cambias>      # nunca editar en main directo
2. editar en la carpeta del sitio
3. node scripts/verify-project-links.mjs <carpeta>  # DEBE decir PASS
4. cd <carpeta> && npm run build                    # build local con envs
5. (borra las envs y build otra vez → debe pasar igual: invariante de resiliencia)
6. vercel                                           # PREVIEW deploy (nunca --prod aún)
7. curl las rutas clave del preview (200, contenido correcto)
8. vercel --prod                                    # solo tras verificar el preview
9. curl las rutas en el dominio real + commit por paths explícitos
```

**Reglas de oro:**
- Nunca `vercel`/`vercel --prod` desde la raíz del monorepo (no tiene `.vercel` a propósito).
- `verify-project-links.mjs` en PASS antes de cualquier deploy. Blocklist: `prj_CE4lSOWL...`.
- Commits por paths explícitos (`git add <ruta>`), nunca `git add -A` — hay trabajo de MIRA en paralelo que no se debe mezclar.
- No tocar `apps/mira/portal` (OFF-LIMITS).

## Cómo se edita el CONTENIDO (no el código)

Las webs conectadas al CMS **hornean el contenido en build-time** (`scripts/fetch-cms-content.mjs` corre antes de `next build`, escribe `content/*.json`). Implicación clave:

> **Un cambio en el CMS NO se ve en la web al instante.** Se refleja en el **próximo deploy** de esa web. Publicar en el CMS + disparar el "Deploy Hook" del proyecto (en Projects del admin) redeploya y hornea el contenido nuevo. Es a propósito: así una caída del CMS no puede tumbar la web (el build cae de vuelta al contenido hardcodeado).

Editar contenido vía CMS: `cms.startupsfactory.es/admin` → Pages → elige proyecto → Edit. El panel derecho tiene Settings (SEO/slug/status), Pixels (tracking por página) e History (restaurar versiones).

## Mapa de riesgo por sitio

| Sitio | Live | Riesgo | Notas al editar |
|---|---|---|---|
| `apps/startup-factory-web` | startupsfactory.es | 🟡 | CMS-connected. Canónico = **apex** (no www). Build-time bake protege ante caída del CMS. |
| `clients/salsa-burgers` | salsaburgers.com | 🟡 | CMS-connected. **Incidente previo de mislink** (2026-07-16) → correr verify SIEMPRE. |
| `clients/nc-global-assets` (legacy Vite) | ncglobalassets.com | 🔴 | Se va a reemplazar por `-next`; edits aquí pueden tirarse en el cutover. Ya no hace `exit(1)` en env faltante. |
| `clients/nc-global-assets-next` | sin dominio (WIP) | 🟡 | Riesgo bajo (sin dominio). Deploy solo preview hasta el cutover. |
| `clients/discoolver/*` (x4) | *.vercel.app | 🟢 | Estáticos/Vite, sin CMS, sin dominio de producción. Bajo riesgo. |
| `apps/sf-reports` | interno (noindex) | 🟡 | Estático. Ya en el registry (validado por verify). |
| `apps/mira-landing` | ⚠️ sin confirmar | 🔴 **NO DEPLOYAR** | Sin `.vercel/project.json`, no en registry. Riesgo de deployar al proyecto equivocado (incluso sobre mira-portal). Resolver el proyecto antes de tocar. |
| `apps/sf-links` | — | 🔴 **NO DEPLOYAR** | Carpeta vacía, sin código. |
| `apps/mira/portal` | — | ⛔ OFF-LIMITS | Portal de MIRA, no es marketing. No tocar. |

## Contrato del CMS (env vars) — evita el bug del "blog vacío 69 días"

Los fetch scripts aceptan **ambos** juegos de nombres (unificado 2026-07-23):
- Canónicos: `SF_CMS_API_URL`, `SF_CMS_API_KEY`, `SF_CMS_PROJECT_SLUG`.
- Legacy (siguen funcionando): `CMS_API_URL`, `CMS_API_KEY`, `PROJECT_SLUG` (sf-web también `CMS_PROJECT`).
- **La URL debe incluir `/api/public`** (el script le añade `/posts`, `/pages`, `/settings`).

En Vercel, verifica que las envs existen en **Production _y_ Preview** (si faltan en Preview, el preview hornea vacío — trampa conocida).

## Checklist de verificación post-deploy (curl)

```bash
BASE=https://<dominio-o-preview>
for r in / /es /es/programa /es/blog /sitemap.xml /robots.txt; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -m 20 "$BASE$r") $r"; done
# revalidate debe rechazar sin secret:
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/revalidate" -H 'content-type: application/json' -d '{"type":"all"}'  # espera 401/503
```

## Rollback

- **Contenido**: revertir el override en el CMS + redeploy (o disparar Deploy Hook).
- **Deploy**: Vercel dashboard → Instant Rollback / promover el deployment anterior (cada build es autocontenido gracias al bake).
- **Código**: `git revert` de los commits (scoped por sitio).

## Redirects al cambiar un slug (NEW-4)

Renombrar el slug de una **página o post publicado** en el CMS ya no deja la URL vieja en 404: el CMS registra un redirect (slug viejo → nuevo, 301) en la tabla `redirects`, lo expone en `GET /api/public/redirects?project=<slug>`, y el sitio lo hornea + aplica.

**Para que un sitio aplique los redirects** (referencia implementada en `clients/adrian-grooves`):
1. El fetch script escribe `content/redirects.json` (además de pages/settings).
2. `next.config.ts` lee ese JSON en `async redirects()` y mapea `{from,to}` a la estructura de URL del sitio:
   - Single-locale (adrian-grooves): `source: '/'+from` → `destination: '/'+to`.
   - Sitios con prefijo de locale (sf-web): mapear a `'/:locale/'+from` → `'/:locale/'+to` (Next soporta el param `:locale`). Los redirects de posts vienen con prefijo `blog/` (p.ej. `blog/old`→`blog/new`).
3. Verificar en preview antes de prod. **sf-web/salsa/nc: bake + wiring locale-aware pendiente** (se aplica solo a los deploys, sin riesgo hasta que se cablee).

## Pendiente de limpieza (no urgente)
- sf-web tiene dos fuentes de sitemap (`public/sitemap.xml` del fetch script y `app/sitemap.ts`); ambas ya en **apex** (sin conflicto de dominio), pero conviene consolidar en una sola en una sesión futura, verificando en preview cuál sirve.
- `clients/nc-global-assets` legacy: su `src/content/*.json` está trackeado (no gitignored) — cuidado de no commitear cambios de bake.
