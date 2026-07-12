# Plan Opción B — Integración Guías Discoolver

**Estado:** En ejecución
**Estimado:** ~1 día
**Responsable:** Carlos

---

## ☑️ Fase 1: Mock API → endpoints `/cms/v2/guides`

- [x] Mock API existe en `mock-api/server.js`
- [x] Cubre todos los endpoints CRUD
- [ ] Mejorar seeding (más guías de ejemplo)
- [ ] Agregar validación de datos

**Entrada:** `start-dev.sh mock` → Editor + Mock API en :3100 y :5173

---

## ☑️ Fase 2: Adaptar Editor para Token URL

- [ ] `editor/src/lib/auth.js` → Leer `?token=XXX` de URL
- [ ] `editor/src/lib/api.js` → Incluir token en headers
- [ ] Manejar 401 (sesión expirada) → modal de recarga
- [ ] Tests de autenticación con mock API

**Entrada:** `http://localhost:5173/?token=mock-token-123` → Editor funciona sin login

---

## ☑️ Fase 3: Documentación API Contract

- [ ] Crear `API_CONTRACT.md` 
  - Especificar cada endpoint
  - Request/response schema
  - Códigos de error
  - Ejemplos cURL
- [ ] Mapeo de campos: editor ↔ BBDD

**Salida:** Documento para Diego (qué espera, qué devuelve)

---

## ☑️ Fase 4: Build Production

- [ ] `editor/vite.config.js` → optimizar para iFrame
- [ ] `.env.spring` → configurar para `api.discoolver.com/cms`
- [ ] Dockerfile + docker-compose para deploy
- [ ] Env vars para DigitalOcean

**Salida:** Versión deployment-ready

---

## ☑️ Fase 5: Ejemplo iFrame

- [ ] Crear `IFRAME_EXAMPLE.html`
- [ ] Demostración de integración con CMS
- [ ] Manejo de token por URL
- [ ] Ejemplo de Next.js + iFrame

**Salida:** HTML listo para copiar/pegar en CMS

---

## ☑️ Fase 6: Tests de Integración

- [ ] Mock API ↔ Editor (full flow)
- [ ] CRUD guías
- [ ] CRUD items
- [ ] Import desde CMS
- [ ] Export PDF

**Salida:** Workflows validados

