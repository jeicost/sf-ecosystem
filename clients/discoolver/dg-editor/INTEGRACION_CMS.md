# Integración Editor de Guías ↔ CMS Discoolver

**Objetivo:** Integrar el editor de guías en `cms.discoolver.com` sin login doble, usando el token de sesión del CMS.

---

## Opción 1: iFrame (recomendada para MVP rápido)

```
cms.discoolver.com/herramientas/guias
    ↓
<iframe src="https://guias.discoolver.com/?token=XXX&city=madrid" />
    ↓
Editor de guías (React Vite) en servidor separado
    ↓ (fetch con token en header)
api.discoolver.com/cms/v2/guides/...
```

### Ventajas:
- ✅ **Rápido** - No requiere portar código, solo incrustar URL
- ✅ **Desacoplado** - Editor vive en servidor separado (sin dependencias de Next.js)
- ✅ **Token limpio** - Pasa por URL query param `?token=XXX`
- ✅ **Escalable** - Puedes evolucionar editor sin tocar CMS frontend

### Desventajas:
- ⚠️ CORS/cookies entre dominios (resolvible con wildcard)
- ⚠️ Editor en URL separada (menos integrado visualmente)

### Implementación:

**1. En el CMS Next.js** (`/app/herramientas/guias/page.tsx`):
```tsx
export default function GuidesToolPage() {
  const token = getSessionToken(); // Del CMS
  const iframeUrl = `https://guias.discoolver.com/?token=${token}`;
  
  return (
    <main>
      <h1>Editor de Guías</h1>
      <iframe 
        src={iframeUrl}
        style={{width: '100%', height: '90vh', border: 'none'}}
        allowFullScreen
      />
    </main>
  );
}
```

**2. En dg-editor React** (`editor/src/lib/auth.ts`):
```ts
export function getTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

export function getAuthHeader(): {Authorization: string} {
  const token = getTokenFromUrl() || localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
}
```

**3. En las llamadas API** (dg-editor):
```ts
const headers = getAuthHeader();
const response = await fetch(`/api/v1/guides/${id}`, {
  headers: {
    ...headers,
    'Content-Type': 'application/json'
  }
});
```

---

## Opción 2: Embedded (integración profunda)

```
cms.discoolver.com/herramientas/guias
    ↓
React component importado directo (no iFrame)
    ↓
Mismo token del CMS (via Context/props)
    ↓
api.discoolver.com/cms/v2/guides/...
```

### Ventajas:
- ✅ **Integrado** - Mismo diseño/navegación que CMS
- ✅ **Sin CORS** - Todo en mismo dominio Next.js
- ✅ **Compartir estado** - Usar contexto del CMS

### Desventajas:
- ⚠️ **Más trabajo** - Portar editor React a Next.js
- ⚠️ **Dependencias** - Editor acoplado a versión CMS
- ⚠️ **Más lento** - Compila todo en Next.js

### Implementación:

Habría que:
1. Portar `/editor/src` a sección de Next.js (copiar componentes)
2. Reemplazar Vite imports con Next imports
3. Pasar token vía React Context
4. Ajustar rutas API (`/api/v1/...` → `/api/v2/...`)

---

## Recomendación: **Opción 1 (iFrame)** por:

1. **Velocidad** - Lanzas en 2-3 días sin rehacer nada
2. **Flexibilidad** - Editor puede evolucionar independiente
3. **Token simple** - URL param es más seguro que via Context
4. **Separación** - Si Diego quiere cambiar API sin tocar CMS, puede

---

## Flujo de autenticación (iFrame)

```
1. Usuario accede cms.discoolver.com/herramientas/guias
   → CMS verifica sesión y obtiene token

2. CMS genera URL con token:
   → guias.discoolver.com/?token=abc123xyz&city=madrid

3. Editor carga en iFrame:
   → Lee token de URL
   → Guarda en sessionStorage (NO localStorage, solo para sesión)
   → Cada fetch incluye Authorization: Bearer abc123xyz

4. Backend Java valida token:
   → Si válido → 200 OK + datos
   → Si inválido → 401 Unauthorized → Editor redirige a login

5. Token expira:
   → Editor detecta 401 → muestra modal "Sesión expirada"
   → Usuario vuelve a CMS para re-autenticarse
```

---

## Seguridad - Token por URL

**Riesgo:** Token visible en URL (historial, logs)

**Mitigación:**
- ✅ HTTPS obligatorio (ya tenéis)
- ✅ Token corta duración (~1 hora)
- ✅ Refresh token en server-only cookie
- ✅ Logs sanitizados (no loguean query params)
- ✅ CORS restringido a dominios conocidos

---

## Endpoints Java que hay que construir

```
POST   /cms/v2/guides                    Crear guía
GET    /cms/v2/guides                    Listar (filtros: city, status, type)
GET    /cms/v2/guides/{id}               Obtener guía
PUT    /cms/v2/guides/{id}               Actualizar metadata
DELETE /cms/v2/guides/{id}               Eliminar

GET    /cms/v2/guides/{id}/items         Listar recomendados
POST   /cms/v2/guides/{id}/items         Añadir recomendado
PUT    /cms/v2/guides/{id}/items/{id}    Editar recomendado
DELETE /cms/v2/guides/{id}/items/{id}    Eliminar recomendado
POST   /cms/v2/guides/{id}/items/bulk    Reordenar (body: [{id, sort_order}])

GET    /cms/v2/guides/{id}/config        Config JSON para templates HTML
POST   /cms/v2/guides/{id}/export/pdf    Generar y descargar PDF
```

---

## Próximos pasos

1. **Diego:** Crea tablas + endpoints básicos (CRUD)
2. **Carlos:** Adapta dg-editor para usar token URL + endpoints Java
3. **Test:** Integración en iFrame
4. **PDF:** Renderizan templates HTML con datos de BD

Estimado: **2-3 semanas** con ambos equipos en paralelo.
