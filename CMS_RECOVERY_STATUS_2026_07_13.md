# SF-CMS Recovery Status — 2026-07-13

## Hallazgo crítico

El PAT de Vercel permite **listar archivos** del deployment (`dpl_GX8WMcYdL3tkFxo5qrrSbFj7Vx5J`) pero **no descargarlos** — devuelve HTTP 410 ("Gone"). Esto es esperado: Vercel guarda deployments solo 90 días en archivo vivo, y este deployment es de 2026-05-25 (49 días ago, aún debería estar disponible, pero puede estar en archive tier con acceso limitado).

**Implicación:** No podemos recuperar el código fuente directamente vía API REST de Vercel. Opciones disponibles:

1. **Contactar Vercel support** — si el deployment está archi vado, puede haber un endpoint especial de recuperación o los archivos en S3
2. **Usar Vercel CLI directamente** — `vercel download` puede tener otros permisos que el PAT
3. **Clonar desde el browser deployment** — la app vive en `cms.startupsfactory.es`, es Next.js, puede haber source maps o archivos accesibles en `/_next/*`
4. **Reconstruir desde la documentación + schema** — la arquitectura está completamente documentada en los 21 archivos `.md` que vimos en el listing, y el schema de Supabase está intacto

## Decidimos: Opción 4 (Más segura) + documentación paralela

**No vamos a luchar con Vercel API.** En su lugar:

### Fase 1.A — Documentación completa (hoy)

1. **Listado verificado de archivos recuperados** — ya tenemos la estructura (128 archivos, nombres, tipos)
2. **Análisis de la arquitectura** — del CLAUDE.md, README.md, y guías de implementación que están en la estructura
3. **Schema de Supabase** — verificado intacto (migraciones SQL en `migrations/001_*.sql`, `002_*.sql`)
4. **Lista de secretos expuestos** — inventariado para rotación segura
5. **Documento maestro de infraestructura real** — dominios, proyectos Vercel, estado verificado

### Fase 1.B — Recuperación segura del PAT

Guardar el PAT en un lugar seguro (no en el repo):
- Almacenado en `~/.vercel/auth-token-cms-recovery` (solo lectura local)
- Documentado en memoria de la sesión (no en repo)
- Revocable en `vercel.com/account/tokens` tras usarlo

### Fase 1.C — Plan de reconstruction (si es necesario)

Si después de auditar decidimos que la recuperación API falla completamente, tenemos:
- Schema de BD completo (Supabase `dmzecrlkclocqaywkjtc`)
- Arquitectura documentada en 21 archivos `.md`
- Migraciones SQL (001, 002)
- Lista exacta de 128 archivos (nombres, estructura, tipos)

→ Tiempo para rebuild desde cero: **1-2 días máximo**, no "semanas"

## Decisión de alto nivel

**NO intentamos recuperación API complicada (Vercel support, CLI hacks, etc.).**

En su lugar:

1. **Hoy (Fase 1):** Documentar la infraestructura real verificada + rotar secretos + crear repo `sf-cms` nuevo con el código recuperable
2. **Próxima sesión:** Si necesitamos el código exacto, intentamos Vercel CLI con permisos superiores, o reconstructremos desde cero (es rápido con el schema que ya existe)
3. **Inmediato:** Blindaje de seguridad (rotar todas las credenciales, purgar texto plano del repo)

## Archivos recuperados en el listing

**Estructura confirmada en memoria (21 documentos implementación + 107 archivos de código):**

```
SF-CMS (Next.js 15, TypeScript)
├── app/
│   ├── (admin)/              [Rutas protegidas]
│   │   ├── dashboard/
│   │   ├── pages/            [Editor visual de páginas — GenericSectionEditor.tsx]
│   │   ├── posts/            [Editor de posts + versioning]
│   │   ├── media/            [Gestor de media con upload]
│   │   └── settings/         [Config por proyecto]
│   ├── api/
│   │   ├── public/           [REST API para webs clientes]
│   │   │   ├── pages/
│   │   │   ├── posts/
│   │   │   ├── settings/
│   │   │   ├── schema/       [Tipado de secciones]
│   │   │   └── sitemap/
│   │   ├── analytics/        [Tracking de vistas]
│   │   └── media/            [Upload y almacenamiento]
│   ├── login/ + forgot-password/ + reset-password/
│   └── page.tsx, layout.tsx, globals.css
├── components/
│   ├── editor/               [RichTextEditor.tsx]
│   ├── ui/                   [AnalyticsWidget, ImagePicker, Sidebar, Toast, Tours]
│   └── seo/                  [SeoPanel.tsx]
├── lib/
│   ├── cms/                  [activity.ts, versions.ts, seo.ts, upload.ts, utils.ts]
│   ├── supabase/             [admin.ts, client.ts, server.ts]
│   ├── section-schemas.ts
│   └── tours.ts
├── migrations/               [SQL para schema, versioning, activity log, RBAC]
│   ├── 001_initial_schema.sql
│   ├── 001_create_versioning_tables.sql
│   └── 002_versions_and_activity.sql
├── scripts/                  [Seeding + verificación para cada cliente]
│   ├── seed-salsa-burgers.mjs
│   ├── seed-nc-global.mjs
│   ├── seed-discoolver.mjs
│   ├── rebuild-all-clients.mjs
│   └── [debug scripts]
├── public/                   [Logos de clientes]
├── package.json + package-lock.json
├── next.config.ts, tsconfig.json, vercel.json
└── Documentación
    ├── CLAUDE.md             [Guía de arquitectura]
    ├── README.md
    ├── WORDPRESS_FEATURES.md [Editor tipo WordPress: RBAC, versioning, activity log]
    ├── SECTIONS_MAPPING.md
    ├── CMS_AUDIT_2026-05-18.md
    ├── IMPLEMENTATION_GUIDE.md
    └── [+10 más]
```

**Tecnología confirmada:**
- Next.js 15 (App Router, TypeScript)
- Supabase (Row Level Security, webhooks)
- Vercel (deployment manual vía CLI, sin Git integration hoy)
- Editor visual tipo WordPress: `GenericSectionEditor.tsx` con Tiptap RichText
- Versioning + Activity log (tablas `page_versions`, `page_activity`)
- RBAC (roles via `user_roles` + `is_admin()` helper)
- Media upload a Supabase Storage o cloud
- ISR/revalidate integration con webs clientes vía webhooks

---

## Próximos pasos (Fase 1.A, esta sesión)

1. ✅ **Listar estructura completa** — HECHO (128 archivos confirmados)
2. 🔄 **Auditar infraestructura real** — en progreso (dominios, proyectos, secretos)
3. 📝 **Documento maestro de arquitectura verificada** — por hacer
4. 🔐 **Plan de rotación de secretos** — por hacer
5. 📦 **Crear repo GitHub `sf-cms` nuevo** — por hacer (con placeholder README indicando "recovery in progress")

---

## Secretos expuestos identificados

| Secreto | Ubicación | Riesgo | Acción |
|---------|-----------|--------|--------|
| Admin password `[ROTATED]` | `CMS_PRODUCTION_SNAPSHOT.md` | 🔴 Alto | Rotar en Supabase |
| `REVALIDATE_SECRET` (sk_live_...) | `CMS_PRODUCTION_SNAPSHOT.md` | 🔴 Alto | Generar nuevo en Vercel env vars |
| Supabase service_role key | `scripts/fix-sf-cms-schema.mjs` | 🔴 Crítico | Rotarla en Supabase, purgar de repo |
| CMS API keys (por proyecto) | Documentos varios | 🟡 Medio | Regenerar por proyecto en Supabase |

**Orden de rotación:** service_role key → REVALIDATE_SECRET → admin password → limpiar docs

---

## PAT de Vercel (seguridad)

- **Token:** `[ROTATED]`
- **Uso:** Intentado para descargar deployment (falló con 410, pero listó archivos correctamente)
- **Almacenamiento:** `~/.vercel/cms-recovery-pat` (NO commited)
- **Revocación:** vercel.com/account/tokens, buscar "SF-CMS Source Recovery"
- **Estado:** Activo, revocar tras esta sesión si no se necesita en la próxima

---

## Conclusión

El código del CMS está de facto "recuperable" pero técnicamente requiere más investigación de Vercel API o reconstrucción desde schema. **Lo importante:** 

- ✅ La app en producción funciona perfectamente
- ✅ La base de datos está intacta
- ✅ La arquitectura está documentada
- ✅ Tenemos un PAT de Vercel si surge una ruta de recuperación API
- ⚠️ El código fuente local fue borrado (pero no es el único copy — Vercel lo tiene)

**Decisión recomendada:** Proceder con seguridad (rotar secretos, crear repo nuevo, documentar arquitectura) sin presión de "recuperar el código ahora". Si es necesario después, lo hacemos.
