# Sistema Drive ↔ Brain por proyecto — Diseño para próxima sesión

> Petición del usuario (2026-07-19): "que el sistema lea la carpeta de cada cliente para que tenga ahí todo lo necesario a nivel de referencias, que se puedan añadir carpetas pasando el enlace, que el brain acceda y guarde en memoria dónde están las cosas importantes para referencias y entrenamiento — de forma profesional y ágil, como parte del servicio de puesta a punto de los portales MIRA".

## Qué existe ya (no partir de cero)

- **OAuth Drive completo por cliente**: `app/api/brand-brain/drive/{authorize,callback,ingest}` + tabla `drive_connections` (access/refresh token, folder_id). Solo faltan `GOOGLE_OAUTH_CLIENT_ID/SECRET`.
- **Ingesta con extracción de texto** (pdf-parse + mammoth) → `agent_documents` con `source_metadata` (folder_id, file_id, webViewLink) y ahora **summary con Claude** (mejorado hoy).
- **Memoria por cliente** (`project_memory`) y desde hoy **por proyecto** (`project_memory.project_id`).
- **Contexto en agentes**: `/api/agent` ya inyecta `getAgentDocumentContext` + `getClientMemoryContext` en cada chat.
- **Carpetas Drive del usuario ya organizadas**: `MIRA BRAND BRAIN INGESTION/0X_CLIENTE/` con subcarpetas (Logos, Post References, memorias de proyecto…). IDs raíz conocidos: carpeta madre `1GZ41hpqsjScLK-QHVeeHBx4_gVG5dj-f`.

## Diseño propuesto

### 1. Modelo de datos (migración nueva)
```
drive_folders (
  id uuid PK,
  client_id uuid REFERENCES clients NOT NULL,
  project_id uuid REFERENCES mira_projects NULL,   -- carpeta general del cliente o de un proyecto concreto
  folder_id text NOT NULL,                          -- ID de Drive extraído del enlace
  folder_name text,
  purpose text CHECK (purpose IN ('references','brand','logos','deliverables','training','other')),
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending',
  UNIQUE (client_id, folder_id)
)
```
`agent_documents` ya guarda file-level metadata; añadir `drive_folder_id uuid REFERENCES drive_folders`.

### 2. UX "pegar enlace" (en Brand Brain, tab Documents, y en la página de cada Proyecto)
- Campo "Añadir carpeta de Drive" → pega URL → regex extrae folder_id → POST `/api/brand-brain/drive/folders` → fila en `drive_folders` + sync inicial en background.
- Selector de `purpose` (Referencias / Marca / Logos / Entregables / Entrenamiento) — esto es lo que hace el sistema "profesional": el Brain sabe PARA QUÉ sirve cada carpeta.
- Lista de carpetas conectadas con estado de sync y botón "Re-sincronizar".

### 3. Sync inteligente (evolución del ingest actual)
- Recorrer recursivamente la carpeta (el ingest actual es plano) con profundidad máx 3.
- Por archivo: extraer texto (ya existe) → summary Claude (ya existe) → guardar en `agent_documents` con `drive_folder_id`.
- Por imagen/asset (logos, referencias visuales): NO extraer texto; registrar como asset con webViewLink + descripción corta generada (Claude vision opcional, fase 2).
- **Índice de carpeta**: tras cada sync, generar UNA entrada en `project_memory` categoría `insight`, título "Mapa de carpeta: {nombre}", con el resumen de qué hay y dónde ("Los logos están en X, el brand book en Y, las referencias de posts en Z"). Esto es el "guardar en memoria dónde están las cosas importantes".

### 4. Acceso desde el Brain / agentes
- `getAgentDocumentContext` ya inyecta agent_documents; añadir el "mapa de carpetas" (las entradas índice) siempre al contexto para que cualquier agente sepa dónde buscar.
- Nueva tool ligera para el chatbot del Brand Brain: "buscar en documentos del cliente" (query sobre agent_documents por título/summary; pgvector como fase 2 si hace falta semántica).

### 5. Servicio de puesta a punto (playbook operativo interno)
Checklist por cliente nuevo: (1) crear carpeta `0X_CLIENTE` con subcarpetas estándar (Logos, Brand, Referencias, Entregables, Entrenamiento); (2) pegar los 5 enlaces en MIRA con su purpose; (3) sync inicial; (4) revisar el mapa generado en project_memory; (5) validar con el cliente. Documentarlo como plantilla reutilizable — es parte del servicio facturable.

### 6. Orden de ejecución propuesto (1 sesión)
1. Env vars OAuth + probar flujo existente (30 min, bloqueante).
2. Migración `drive_folders` + endpoint folders + UI pegar-enlace (1h).
3. Sync recursivo + índice de carpeta en memoria (1h).
4. Inyección del mapa en agentes + búsqueda simple (45 min).
5. Puesta a punto de los 5 clientes actuales con sus carpetas reales (45 min).
