# Next Session Checklist — Comenzar Etapa 3 (2026-07-18 o después)

**Preparado:** 2026-07-17 04:40 UTC  
**Estado:** Listo para ejecución inmediata

---

## ✅ ANTES DE EMPEZAR (5 minutos)

### 1. Lectura obligatoria:
```
Orden de lectura:
1. Este documento (2 min)
2. SESSION_CLOSURE_2026_07_17_SF_CMS.md (5 min) — estado actual
3. ETAPA_3_PLAN_DETALLADO_2026_07_17.md (10 min) — plan completo
→ Total: 15 minutos de contexto
```

### 2. Verificación técnica rápida:
```bash
# En terminal:
cd /Users/carlosjacoste/Desktop/Claude

# 1. Verificar que estamos en el commit correcto
git log --oneline -1
# Esperado: e767700 docs: Etapa 2 complete...

# 2. Ver diferencia con origin
git status
# Esperado: (working tree clean) — sin cambios pendientes

# 3. Verificar que MIRA no tiene cambios pendientes
git diff HEAD -- apps/mira/ | wc -l
# Esperado: 0 (cero líneas de diff)
```

**Si alguno falla:**
- ❌ Commit no es e767700: `git pull origin main` para sincronizar
- ❌ Working tree no clean: `git status` para ver qué hay, y actuar según corresponda
- ❌ MIRA tiene diffs: contactar con sesión MIRA, coordinar merge/push antes de continuar

### 3. Verificación de seguridad:
```bash
# ⚠️ CRÍTICA para Bloque 3 (Startup Factory):
grep -r "service_role\|SUPABASE_SERVICE_ROLE" apps/sf-cms/ scripts/ --include="*.mjs" --include="*.ts" --include="*.tsx" | head -5

# Si devuelve resultados: la key vieja aún está expuesta
# Action: Ver "Pre-requisito de seguridad" en ETAPA_3_PLAN_DETALLADO_2026_07_17.md
```

---

## 🎯 RESUMEN RÁPIDO — QUÉ SE LOGRÓ, QUÉ FALTA

### Completado (Etapas 1-2):
✅ QA Harness — isolated test harness (`apps/cms-qa-harness/`)  
✅ Undo Button — endpoint real + page_versions snapshots  
✅ Test Data — proyecto qa-harness en Supabase con página + post  
✅ Recovery Closed — WYSIWYG editor investigación completada (no recuperable)  
✅ Conversational Editor — solución real, producción-ready  
✅ Plans Documented — Etapa 3 con todos los pasos  

### Pendiente (Etapa 3 — esta sesión):
🟡 Conectar 3 webs reales al SF-CMS:
   1. NC Global Assets (30m)
   2. Salsa Burgers Web (30m)
   3. Startup Factory (45m+ con producción)

### Prerequisito de seguridad (antes de Bloque 3):
🔴 Rotar service_role key (CREDENTIAL_ROTATION_PLAN_2026_07_13.md PASO 1)
   - No es bloqueante para Bloques 1-2 (dev/staging)
   - RECOMENDADO antes de Bloque 3 (producción)
   - Duración: ~15 minutos

---

## 📋 RUTA DE EJECUCIÓN (Etapa 3)

### Fase 0 — Pre-requisitos (5 min)
```bash
# De ETAPA_3_PLAN_DETALLADO_2026_07_17.md, Fase 0
# Verificaciones técnicas + seguridad
```

### Fase 1 — Exploratory (15 min)
```bash
# Levanta harness local, valida que funciona
cd apps/cms-qa-harness && npm run dev
# En otra terminal: curl tests (ver plan)
```

### Bloque 1 — NC Global Assets (30 min)
```bash
# cd clients/nc-global-assets
# - Inspeccionar configuración actual
# - Conectar a harness local para testing
# - Deploy a staging (si existe)
```

### Bloque 2 — Salsa Burgers (30 min)
```bash
# cd clients/salsa-burgers/web
# - Idem Bloque 1
```

### Bloque 3 — Startup Factory (45+ min)
```bash
# cd apps/startup-factory-web
# - ⚠️ PRE-REQUISITO: rotar service_role key
# - Dev local + staging + production con rollback plan
```

---

## 🔄 DURANTE LA SESIÓN

### Logging:
- Documenta cualquier error/incidente en nuevo archivo: `ETAPA_3_INCIDENT_2026_07_17.md`
- Si hay algo bloqueante: documentar y parar (no forzar)

### Commits:
Patrón de commits por bloque:
```bash
git commit -m "feat: Etapa 3 Bloque 1 — NC Global Assets connected to SF-CMS

- Updated .env variables for NC Global Assets
- Validated local dev against QA Harness data
- Deployed to staging environment
- ISR pipeline tested and verified

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Testing:
- Después de cada bloque: test ISR revalidate
  - Cambiar contenido en CMS
  - Refrescar web < 3 segundos
  - Verificar que cambio aparece

### Rollback (Bloque 3 only):
- Documentado en ETAPA_3_PLAN_DETALLADO_2026_07_17.md sección 3.1
- Tiempo estimado: 15 minutos
- No intentes forzar si algo se rompe: rollback + documentar

---

## 📊 SEÑALES DE ÉXITO (Final outcome)

**Etapa 3 Completa cuando:**
- ✅ NC Global Assets conectada, ISR funciona
- ✅ Salsa Burgers conectada, ISR funciona
- ✅ Startup Factory conectada, ISR funciona, producción live
- ✅ Todos los commits pusheados a origin/main
- ✅ Documentación actualizada (SESSION_CLOSURE_2026_07_18_ETAPA_3.md)

**Tiempo total estimado:** 2-3 horas (sin incidents)

---

## 📚 REFERENCIAS RÁPIDAS

**Documentos clave a tener abiertos:**
1. `ETAPA_3_PLAN_DETALLADO_2026_07_17.md` — plan paso a paso
2. `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` — si necesitas rotar key
3. `PROJECT_REGISTRY.md` — para verificar dominios + proyectos Vercel
4. `SESSION_CLOSURE_2026_07_17_SF_CMS.md` — contexto de dónde estamos

**Archivos de configuración:**
- `apps/cms-qa-harness/.env.local` — API keys para harness
- `apps/sf-cms/.env.local` — credenciales de Supabase
- `docs/PROJECT_REGISTRY.md` — registry de proyectos + dominios

**Scripts útiles:**
```bash
# Verificar que harness está corriendo
pgrep -f "next dev.*3003"

# Ver logs de harness si falla
tail -f /tmp/harness.log

# Kill harness si necesitas reiniciar
pkill -f "next dev.*3003"
```

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Service_role key expuesta | 🔴 CRÍTICO | Rotar PASO 1 antes de Bloque 3 |
| ISR pipeline se rompe | 🔴 ALTO | Rollback plan documentado (15 min) |
| MIRA cambios interfieren | 🟡 MEDIO | Coordinar con sesión MIRA antes |
| NC Global / Salsa Burgers no tienen CMS integration | 🟡 MEDIO | Skip ese bloque, no es bloqueante |
| Startup Factory producción se cae | 🔴 CRÍTICO | Rollback plan, revert en < 30 min |

---

## ✨ NOTAS FINALES

- **Duerme bien:** Esta sesión fue larga (Etapas 0-2 completas + Etapa 3 planificada)
- **Próxima sesión es sustancial:** Etapa 3 requiere ~3 horas continuas sin interrupciones
- **Todo está documentado:** Si algo no está claro, busca en los documentos antes de llamarme
- **Seguridad primero:** Antes de tocar Bloque 3 (producción), rota la key de seguridad

---

**Listo. Nos vemos en la próxima sesión. 🚀**

Commit: `e767700`  
Estado: ✅ Etapas 1-2 completas, Etapa 3 lista para ejecución  
Próxima: Etapa 3 — conectar 3 webs reales al SF-CMS
