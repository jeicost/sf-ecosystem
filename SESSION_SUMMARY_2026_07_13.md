# Sesión Auditoría SF-CMS + Infraestructura Webs — Resumen Ejecutivo
**2026-07-13 — Carlos Jacoste + Claude**

---

## 🎯 OBJETIVO DE LA SESIÓN

Revisar el sistema de webs de Startup Factory en Vercel, recuperar el código perdido del SF-CMS, separarlo de MIRA, y establecer un sistema robusto para gestionar todas las webs de clientes sin romper nada que ya está vivo en producción.

---

## ✅ COMPLETADO ESTA SESIÓN

### 1. Auditoría completa de infraestructura
- **Dominios verificados:** 4 dominios custom, todos apuntando al proyecto correcto en Vercel
  - ✅ salsaburgers.com → salsa-burgers-web
  - ✅ startupsfactory.es → startup-factory-web
  - ✅ ncglobalassets.com → nc-global-assets (SPA Vite, legacy)
  - ⚠️ startupsfactory.com → sf-reports (solo reports.startupsfactory.com, DNS raíz mal configurado)
- **Proyectos Vercel:** 20 identificados, 9 con dominio claro, 5 huérfanos/duplicados, 6 sin asignación clara
- **Estructura de repos:** Confirmada — monorepo turborepo/pnpm + clientes excluidos de workspace (problema identificado)

### 2. Investigación del SF-CMS
- **Estado en producción:** ✅ VIVO en cms.startupsfactory.es, proyecto Vercel `sf-cms`, base de datos separada e intacta (dmzecrlkclocqaywkjtc)
- **Código fuente:** PERDIDO localmente (borrado 2026-07-12), pero recuperable:
  - ✅ Estructura de 128 archivos identificada (Next.js 15, TypeScript, editor tipo WordPress)
  - ❌ Descarga vía API falló (HTTP 410 — expected para deployment de 49 días)
  - **Alternativas:** CLI de Vercel, contactar support, o reconstruir desde schema + documentación
- **Integración:** 3 webs consumen CMS vía REST API + ISR webhooks (pipeline construido pero estado actual incierto)

### 3. Documentación producida (4 archivos)

#### a) `CMS_RECOVERY_STATUS_2026_07_13.md`
- Decisión de NO luchar con Vercel API
- Enfoque: documentar bien + recuperar cuando sea posible, reconstruir si es necesario
- Estructura de 128 archivos catalogada

#### b) `INFRASTRUCTURE_MASTER_REGISTRY_2026_07_13.md`
- **Tabla Tier 1:** 9 dominios/proyectos con asignación clara y estado verificado
- **Tabla Tier 2:** 11 proyectos sin dominio (ruido, candidatos a limpieza)
- **Resumen:** Mixed governance — dominios OK, pero proyectos Vercel sin gobernanza
- **Recomendaciones:** 3 tiers (inmediato, próxima sesión, largo plazo)

#### c) `CREDENTIAL_ROTATION_PLAN_2026_07_13.md`
- 3 credenciales críticas en texto plano identificadas (service_role key, REVALIDATE_SECRET, password)
- Plan paso-a-paso seguro (servicio role → REVALIDATE_SECRET → password)
- **Duración:** 50 minutos, **riesgo:** bajo con smoke tests
- Incluye rollback plan si algo se rompe

#### d) `SESSION_SUMMARY_2026_07_13.md` (este archivo)
- Resumen ejecutivo de hallazgos y próximos pasos

### 4. Gestión de credenciales
- ✅ PAT de Vercel generado y guardado de forma segura en `~/.local/sf-cms-recovery/vercel-pat.txt`
- ✅ Documentado: cuándo revocar, cómo usarlo
- ⚠️ Credenciales viejas aún en el repo (purga pendiente tras rotación)

---

## 📊 HALLAZGOS CRÍTICOS

### 🔴 NIVEL CRÍTICO

| Hallazgo | Impacto | Acción |
|----------|---------|--------|
| **3 credenciales en texto plano** (Supabase key, REVALIDATE_SECRET, admin password) | Cualquiera que clone el repo puede comprometer todos los datos del CMS y el pipeline de webs | Rotar antes del próximo push a main |
| **SF-CMS código fuente perdido localmente** | Si Vercel fallara, el CMS estaría irrecuperable | Crear repo GitHub nuevo + vincularlo a Vercel |
| **Clientes SIN `.vercel/project.json`** | Redeploy puede aterrizar en proyecto equivocado (incidente de mayo) | Agregar `.vercel/project.json` a salsa-burgers, nc-global-assets, nc-global-assets-next |

### 🟡 NIVEL MEDIO

| Hallazgo | Impacto | Acción |
|----------|---------|--------|
| **NC Global Assets: 2 webs compitiendo por 1 dominio** | SPA Vite vieja (SEO 46/100) vs Next.js nueva (incompleta) — ambas activas | Completar migración Next.js, mover dominio, archivar SPA |
| **20 proyectos Vercel sin gobernanza clara** | 5 huérfanos/duplicados — ruido, posible confusión en deploys | Listar y decidir: borrar o re-asignar |
| **`clients/*` excluido de pnpm workspace** | `pnpm install` no toca clientes — algunos usan npm en lugar de pnpm | Agregar a workspace, estandarizar |
| **Pipeline ISR (CMS→webs) estado incierto** | Fue construido en mayo, pero último paso (dominio alias) fue un bloqueador | Verificar que funciona tras rotación de REVALIDATE_SECRET |

### ✅ NIVEL BAJO / RESUELTO

| Hallazgo | Estado |
|----------|--------|
| Dominios custom correctamente mapeados | ✅ Todos 4 dominios apuntan al proyecto correcto |
| SF-CMS usa BD separada (no comparte con MIRA) | ✅ Bases de datos ya desacopladas (dmzecrlkclocqaywkjtc vs nnevhtfxuawexliwlbmh) |
| MIRA no es afectado por recovery de SF-CMS | ✅ Completamente independiente |

---

## 📋 PRÓXIMOS PASOS (Confirmados con usuario)

### Fase 2 (Inmediato — 1-2 horas)

- [ ] **Rotar credenciales** siguiendo `CREDENTIAL_ROTATION_PLAN_2026_07_13.md`
  - Paso 1: Service role key (15 min)
  - Paso 2: REVALIDATE_SECRET (30 min) + smoke test
  - Paso 3: Admin password (5 min)
  - Paso 4: Finalizar (10 min)
- [ ] **Agregar `.vercel/project.json` a clientes:**
  - `clients/salsa-burgers/.vercel/project.json`
  - `clients/nc-global-assets/.vercel/project.json`
  - `clients/nc-global-assets-next/.vercel/project.json`
  - (Copiar formato del que existe en `apps/sf-crm/`)
- [ ] **Crear repo GitHub nuevo:** `jeicost/sf-cms` (privado)
  - README placeholder: "Recovery in progress — code structure documented in parent monorepo"
  - Linkar a Vercel vía Git Integration (Settings → Git)

### Fase 3 (Próxima sesión — 2-3 horas)

- [ ] **Recuperar código de SF-CMS**
  - Opción A: Vercel CLI (`vercel download` o similar)
  - Opción B: Contactar Vercel support (deployment archivado)
  - Opción C: Reconstruir desde schema + documentación (fallback)
- [ ] **Completar migración NC Global Assets**
  - Terminar fase 2-3 de `clients/nc-global-assets-next/`
  - Probar end-to-end
  - Mover dominio ncglobalassets.com cuando lista

### Fase 4 (Gobernanza a largo plazo — futuro)

- [ ] **Limpiar proyectos Vercel huérfanos** (después de confirmar que no se usan)
- [ ] **Incluir `clients/*` en pnpm workspace** (estandarizar package manager)
- [ ] **Integración landing-builder ↔ SF-CMS** (webs nuevas auto-registradas en CMS)
- [ ] **Arreglar DNS startupsfactory.com** (decidir: redirect a .es, usar solo .es, o setup correcto)

---

## 📚 DOCUMENTACIÓN PRODUCIDA

| Documento | Propósito | Ubicación |
|-----------|-----------|-----------|
| CMS_RECOVERY_STATUS_2026_07_13.md | Hallazgo de API 410, decisión de estrategia | /repo root |
| INFRASTRUCTURE_MASTER_REGISTRY_2026_07_13.md | Inventario verificado de todos los dominios + proyectos Vercel | /repo root |
| CREDENTIAL_ROTATION_PLAN_2026_07_13.md | Plan seguro paso-a-paso (sin romper webs) | /repo root |
| ~/.local/sf-cms-recovery/vercel-pat.txt | PAT guardado de forma local (NO en repo) | ~/.local (secure) |

---

## 🔒 SEGURIDAD

| Item | Estado |
|------|--------|
| PAT de Vercel | Guardado en `~/.local/sf-cms-recovery/vercel-pat.txt` (no commiteado) |
| Credenciales expuestas | Documentadas para rotación, aún en repo (será purgado tras rotación) |
| Acceso a SF-CMS | No se ha ejecutado ningún cambio en Supabase (read-only audit) |
| Dominios/webs vivos | No se ha tocado nada — solo lectura de Vercel API y curl |
| Git repo | No hay commits nuevos aún — plan y documentación solo para revisión |

---

## 💡 DECISIONES CLAVE

### ✅ Aprobadas

1. **Recuperación de CMS:** Intentar primero vía API/CLI, reconstruir si es necesario (no "perder" el código)
2. **Separación de MIRA:** SF-CMS ya está en BD separada — nada que cambiar aquí
3. **Rotación de secretos:** Necesaria, con plan seguro que verifica ISR pipeline
4. **Repo independiente para SF-CMS:** GitHub nuevo (`jeicost/sf-cms`) + Git integration en Vercel
5. **Completar NC Global Assets:** Terminar migración Next.js antes de mover dominio

### ⏸️ Deferred (para sesiones posteriores)

1. Limpieza de proyectos Vercel huérfanos (requiere confirmación individual)
2. Unificación de workspace (requiere testing en todos los clientes)
3. DNS fix startupsfactory.com (decisión comercial pendiente)

---

## 📞 CONTACTO Y SIGUIENTES PASOS

**User:** Carlos Jacoste (jacostech@gmail.com)

**Próximas acciones:**
1. Revisar documentos producidos hoy
2. Decidir si proceder con rotación de credenciales (Fase 2)
3. Si sí → ejecutar `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` paso a paso
4. Crear repo `sf-cms` nuevo en GitHub
5. Contactar con soporte de Vercel si queremos explorar recovery API

**PAT para referencia future:** `~/.local/sf-cms-recovery/vercel-pat.txt`  
**Revocation cuando termine:** vercel.com/account/tokens → "SF-CMS Source Recovery"

---

## 📈 TIMELINE REALISTA

- **Fase 2 (Rotación + setup):** 1-2 horas (pasos secuenciales, verificables)
- **Fase 3 (Recuperación de código):** 2-8 horas (depende de qué tan complicado es la API de Vercel)
- **Fase 4 (Gobernanza):** Indefinida (low priority, puede hacerse cuando sea)

---

**Auditoría completada: 2026-07-13 23:45 UTC**  
**Estado:** Ready for next phase (rotación de credenciales)  
**Riesgo actual:** 🟡 Medio (credenciales en texto plano, pero repositorio privado y acceso limitado)  
**Riesgo post-Fase 2:** ✅ Bajo (credenciales rotadas, repos blindados)
