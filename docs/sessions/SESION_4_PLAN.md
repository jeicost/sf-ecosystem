# SESIÓN 4 — Plan Detallado de Ejecución

## Objetivo
Activar SESIÓN 3 (estructura) con database + E2E testing. Pasar de "puede hacer" a "está haciendo".

---

## PASO 1️⃣ — Aplicar Migración Supabase (USUARIO DEBE HACER)

### Instrucciones Exactas

1. **Abrir Supabase Dashboard**
   - URL: https://app.supabase.com/
   - Proyecto: `nnevhtfxuawexliwlbmh`

2. **SQL Editor → Nueva Query**
   - Click en "SQL Editor" (left sidebar)
   - Click en "+" (New query)

3. **Copiar SQL y Ejecutar**
   ```bash
   # Copiar contenido completo de:
   # /apps/mira/portal/supabase/migrations/0013_toolkit_generation_system.sql
   
   # Pegar en SQL Editor
   # Click "Run"
   ```

4. **Verificar Tablas Creadas**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('generation_queue', 'deliverables', 'quick_actions_results');
   ```
   Debe devolver 3 filas.

5. **Resultado Esperado**
   - ✅ `generation_queue` creada
   - ✅ `deliverables` creada
   - ✅ `quick_actions_results` creada
   - ✅ Índices creados
   - ✅ RLS policies activas

---

## PASO 2️⃣ — Implementar Centro de Reportes (CÓDIGO)

**Archivo:** `/app/(dashboard)/toolkit/page.tsx`

**Qué hace:**
- Consulta `generation_queue` table
- Muestra lista de generaciones completadas
- Permite acceder a resultados
- Muestra estado de generaciones en progreso

**Implementación:**
```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

interface Generation {
  id: string
  tool_slug: string
  status: string
  created_at: string
  result_data?: Record<string, any>
}

export default function ToolkitHub() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGenerations = async () => {
      const client = createClient()
      const { data, error } = await client
        .from('generation_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        setGenerations(data)
      }
      setLoading(false)
    }

    fetchGenerations()
  }, [])

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Toolkit</h1>
      
      {/* Crear Nuevo Entregable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link href="/toolkit/action-plan" className="card p-6 hover:bg-white/8 cursor-pointer">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Nueva Generación</p>
          <h2 className="text-xl font-semibold">Action Plan 30/60/90</h2>
        </Link>
        <Link href="/toolkit/brand-briefing" className="card p-6 hover:bg-white/8 cursor-pointer">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Nueva Generación</p>
          <h2 className="text-xl font-semibold">Brand Briefing</h2>
        </Link>
      </div>

      {/* Centro de Reportes */}
      <h2 className="text-2xl font-bold mb-4">Centro de Reportes</h2>
      {loading ? (
        <p className="text-gray-400">Cargando generaciones...</p>
      ) : generations.length === 0 ? (
        <p className="text-gray-400">No hay generaciones aún</p>
      ) : (
        <div className="space-y-3">
          {generations.map((gen) => (
            <div key={gen.id} className="card p-4 border-l-4" style={{ borderLeftColor: getToolColor(gen.tool_slug) }}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold capitalize">{gen.tool_slug}</p>
                  <p className="text-xs text-gray-400">{new Date(gen.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(gen.status)}`}>
                    {gen.status}
                  </span>
                  {gen.status === 'completed' && (
                    <Link href={`/toolkit/${gen.tool_slug}?id=${gen.id}`} className="text-purple-400 hover:text-purple-300">
                      Ver Resultado →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getToolColor(slug: string) {
  const colors: Record<string, string> = {
    'action-plan': '#FF6B35',
    'brand-briefing': '#A78BFA',
    'seo-audit': '#F87171',
    'marketing-audit': '#60A5FA',
    'content-pack': '#FBBF24',
    'investor-deck': '#34D399',
    'competitive-analysis': '#EC4899',
    'brandbook-content-system': '#8B5CF6',
  }
  return colors[slug] || '#9CA3AF'
}

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20 text-green-400'
    case 'processing':
      return 'bg-blue-500/20 text-blue-400'
    case 'failed':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}
```

---

## PASO 3️⃣ — Wire Quick Actions Real (CÓDIGO)

**Archivos:**
- `/api/quick-actions/route.ts` (crear si no existe)

**Patrón:**
- Recibe `action_type` + `input_data` + `department`
- Llama a Claude via `quick-action-prompts.ts`
- Guarda en `quick_actions_results` table
- Retorna resultado + queue_id

---

## PASO 4️⃣ — Google Drive Export Real (CÓDIGO)

**Archivo:** `/api/export/google-drive/route.ts` (ya existe, mejorar)

**Qué necesita:**
- Google Drive API credentials en .env
- Convertir resultado JSON a Google Docs
- Retornar shareable link

---

## PASO 5️⃣ — Project Memory Save Real (CÓDIGO)

**Archivo:** `/api/project-memory/route.ts` (ya existe, activar)

**Qué hace:**
- Guarda generación en `project_memory` table
- Permite filtrar por categoría
- Pin/archive funcionalities

---

## PASO 6️⃣ — E2E Testing Local

**Test Flow:**
```
1. Start dev server
   npm run dev

2. Open toolkit tool
   http://localhost:3004/toolkit/action-plan

3. Fill form → Submit
   - ✅ Should show "Generating..."
   - ✅ Should make POST to /api/toolkit/generate

4. Check database
   - ✅ Row appears in generation_queue with status='processing'
   - ✅ After 30 sec, status changes to 'completed'
   - ✅ result_data contains Claude response

5. Check Centro de Reportes
   - ✅ Generation appears in /toolkit dashboard
   - ✅ Status shows as "Completed"
   - ✅ "Ver Resultado" link works

6. Try Save to Memory
   - ✅ Button opens modal
   - ✅ Saves to project_memory table
   - ✅ Appears in Memory dashboard

7. Try Export to Google Drive
   - ✅ Button triggers export
   - ✅ File appears in Google Drive
   - ✅ Link copied to clipboard
```

---

## Timeline SESIÓN 4

| Paso | Tarea | Responsable | Tiempo |
|------|-------|-------------|--------|
| 1 | Aplicar migración Supabase | USUARIO | 5 min |
| 2 | Implementar Centro de Reportes | CLAUDE | 20 min |
| 3 | Wire Quick Actions | CLAUDE | 15 min |
| 4 | Google Drive export | CLAUDE | 20 min |
| 5 | Project Memory save | CLAUDE | 10 min |
| 6 | E2E testing + fixes | USUARIO + CLAUDE | 30 min |
| **TOTAL** | | | **100 min (1.5h)** |

---

## Commits Plan

```
Commit 1: feat(toolkit): Implement Centro de Reportes dashboard
Commit 2: feat(quick-actions): Wire real generation endpoint
Commit 3: feat(exports): Implement Google Drive export
Commit 4: feat(memory): Activate Project Memory save
Commit 5: test(e2e): Full toolkit flow verified end-to-end
```

---

## Success Criteria

- ✅ Migración aplicada en Supabase
- ✅ Centro de Reportes muestra generaciones
- ✅ E2E: fill form → generate → see result → save to memory
- ✅ Generaciones guardadas en database
- ✅ Quick actions funcionan real
- ✅ Exports a Google Drive / Memory funcionan
- ✅ Build limpio
- ✅ No errors en browser console

---

**Status:** Ready to start coding SESIÓN 4

**First step:** User applies migration (5 min), then Claude implements the 4 components above.
