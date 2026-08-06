# _snapshot — copia de seguridad previa a la reescritura (2026-08-06)

Estado congelado de todo el contenido de Discoolver **antes** de la reorganización en dos marcas
(`discoolver` B2C + `discoolver 360` B2B). Nada de esta carpeta se sirve ni se despliega: es red
de seguridad.

Existe porque ya se perdió trabajo dos veces: las landings `/alojamientos` y `/destinos` que se
construyeron en una sesión anterior **nunca llegaron a commitearse** y desaparecieron del disco,
y el reposicionamiento de agosto sobrescribió secciones que hubo que rescatar del histórico.

## `cms/` — las 5 páginas de SF-CMS

Volcado del `sections_json` de cada página del proyecto `discoolver`
(`674dda33-f0dd-4d2f-8433-92aa86941caf`, Supabase `dmzecrlkclocqaywkjtc`).

| Fichero | Web que la consume | Campos | Última edición en CMS |
|---|---|---|---|
| `home.json` | `web` → `/` (tienda de guías) | 103 | 2026-07-29 |
| `influencers.json` | `web` → `/influencers` | 87 | 2026-07-29 |
| `app-home.json` | `app-landing` → `/` | 206 | 2026-08-05 |
| `app-influencers.json` | `app-landing` → `/influencers` | 107 | 2026-08-05 |
| `creators-landing.json` | `creators-landing` → `index.html` | 82 | 2026-07-19 |

Este copy **solo vivía en Supabase**. El CMS no guarda historial de versiones: al editar un
campo, el valor anterior desaparece sin rastro. Y como `mergeContent()` hace que el CMS pise al
fallback del código, lo que hay aquí es **lo que se sirve en producción**, que no siempre
coincide con `lib/content/*.ts` (por ejemplo, el CMS pone "Madrid" en `guide_3_city` donde el
código dice "Barcelona").

## `discoolver-com/` — la web antigua del dominio de marca

HTML servido por `discoolver.com` el 2026-08-06 (Next 12 sobre Cloudflare, **fuera del
monorepo**, sin acceso a su código fuente).

Ocho páginas: home, destinos, alojamientos e influencers, en sus dos idiomas.
`COPY_B2B_ORIGINAL.md` extrae el texto legible de las cuatro páginas B2B.

Es la **única copia existente** del copy B2B de destinos y alojamientos, y el punto de partida
para reescribir `/360/destinos` y `/360/alojamientos`. Cuando la web antigua se retire tras el
corte de dominio, esto será lo único que quede.
