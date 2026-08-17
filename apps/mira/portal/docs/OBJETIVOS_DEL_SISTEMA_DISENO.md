# Objetivos del sistema — diseño para decidir (17-ago-2026)

> «Esta semana nuestro objetivo son 3 posts y 2 newsletters con sus dos
> playbooks, y que todo el proceso vaya corriendo con la sola supervisión del
> cliente. Pensemos esto bien para hacerlo súper operativo.» — CEO
>
> Este documento existe para decidir ANTES de tocar código. Es la pieza más
> grande de la lista de prelanzamiento y la más fácil de construir mal.

## 1. Lo que ya existe (y no hay que reinventar)

| Pieza | Dónde | Estado |
|---|---|---|
| Generar una pieza de contenido | `lib/quick-actions/generate.ts` → `generateQuickAction()` | Sólido: Brand Brain completo, contratos, feedback |
| 19 acciones tipadas (post, newsletter, carrusel, brief de vídeo…) | `lib/quick-actions/registry.ts` | Sólido |
| Materializar piezas en la cola de aprobación | `lib/content-engine/materialize.ts` → `materializePosts()` | Sólido |
| La cola donde el cliente aprueba/rechaza | `approval_queue` + `/approvals` + `/calendar` (visor) | Sólido |
| Plan mensual con pilares y tablero semanal | `monthly-content-system` + `monthly-to-queue` | Sólido; es lo más parecido a «objetivo» que hay |
| Documentos (playbooks) | `app/api/documents/generate` | Sólido tras M1 |
| Cron | `vercel.json`: drive-sync diario, brain-lint semanal, email-ops cada 10 min | Existe el mecanismo |
| Techo de gasto | `MAX_MONTHLY_GENERATIONS` (construido, apagado) | Hay que encenderlo ANTES de esto |

**Lo que NO existe:** una tabla de objetivos, un planificador que los
convierta en trabajo, y un disparador que lo ejecute solo. Es decir: **falta
el cerebro operativo, no las manos.**

## 2. La idea en una frase

Un **objetivo** es una frase del cliente («3 posts + 2 newsletters + sus
playbooks esta semana») que el sistema **descompone en piezas concretas**,
**genera solas** en el momento previsto, y **deja en la cola de aprobación**
para que el cliente solo tenga que aprobar, editar o rechazar. El cliente
supervisa; no dispara.

## 3. Modelo de datos (mínimo)

```
client_goals
  id, client_id, title ("Semana 34"), period_start, period_end,
  status: draft | active | done | paused,
  spec jsonb   -- lo que pidió, estructurado:
               -- { items: [ {kind:'post', count:3, pillar?:'…', platform?:'ig'},
               --            {kind:'newsletter', count:2},
               --            {kind:'playbook', count:2, for:'newsletter'} ] }
  created_by, created_at

goal_tasks              -- el objetivo descompuesto en trabajo atómico
  id, goal_id, client_id,
  kind ('post'|'newsletter'|'playbook'|…),
  action_id (la quick action o el docType que lo genera),
  params jsonb (pilar, plataforma, tema, dependencia…),
  scheduled_for timestamptz,       -- cuándo se genera
  status: pending | generating | queued | approved | rejected | failed,
  depends_on uuid null,            -- «el playbook de la newsletter 2» depende de la newsletter 2
  result_ref (queue_id / approval_queue.id / document id),
  attempts int, last_error text
```

Dos tablas. Nada más. El resultado de cada task **es una fila que ya existe**
(`approval_queue` o un documento): no duplicamos contenido, apuntamos a él.

## 4. El flujo

```
1. El cliente (o la agencia) escribe el objetivo en lenguaje natural
   ─→ el planificador (Claude, con el Brand Brain + los pilares) lo convierte
      en spec estructurada + propone el reparto en el tiempo (qué día cada pieza)
   ─→ el cliente VE el plan y lo confirma (esto es la única decisión que se le
      pide antes de que empiece: aquí se corrige «no, la newsletter el jueves»)

2. Al confirmar: se crean las goal_tasks con su scheduled_for.

3. Un cron (cada hora) coge las tasks con scheduled_for <= now y status pending,
   respeta depends_on, y por cada una llama a lo que YA existe:
     post/newsletter/carrusel  → generateQuickAction() → materializePosts() → approval_queue
     playbook                  → documents/generate
   Marca queued y guarda result_ref. Si falla: attempts++, last_error, reintenta
   a la hora siguiente hasta 3; luego failed y aviso.

4. El cliente entra a /approvals (o /calendar) y ve las piezas del objetivo
   llegando solas, con la etiqueta «Objetivo: Semana 34 · 3/5 listas». Aprueba,
   edita, rechaza. Rechazar con nota regenera (una vez) con la nota.

5. Al cerrar el periodo: el objetivo pasa a done y genera un resumen
   (producido / aprobado / rechazado / coste) — el WeeklyReportCard que ya
   existe se alimenta de aquí.
```

## 5. Decisiones — TOMADAS con el CEO (17-ago)

1. **¿Quién crea objetivos?** → **El cliente también.** Desde su portal, en
   lenguaje natural. El planificador le devuelve el plan y él confirma.
2. **¿Cuándo se genera?** → **El día anterior a las 06:00.** El cliente abre el
   portal por la mañana con las piezas listas y hay margen si algo falla.
3. **¿Qué pasa con lo rechazado?** → Rechazar es *feedback*, no basura. Al
   rechazar se pide en una línea qué falló («muy largo», «no es nuestro tono»,
   «cambia el tema»). Con esa nota el sistema **regenera UNA vez, solo**, y la
   v2 aparece en la cola marcada «v2 · corregida: muy largo». Si rechaza también
   la v2, se para y avisa a la agencia: dos rechazos seguidos no son un problema
   de la pieza, son del brief o del Cerebro. **La nota se guarda como memoria
   del cliente** (project_memory) para que la semana siguiente no falle por lo
   mismo. Cada rechazo mejora el sistema.
4. **Techo de gasto antes.** → Sí. `MAX_MONTHLY_GENERATIONS` se enciende en M3
   y el planificador rechaza objetivos por encima del cap del plan.
5. **¿Dónde vive?** → **En Marketing (mk).** Sección propia dentro del
   departamento de Marketing: lista de objetivos con barra de progreso, detalle
   con las piezas y su estado. Y etiqueta «Objetivo: Semana 34» en cada item de
   la cola de aprobación que venga de uno.
6. **Coherencia entre piezas — optimizado.** El objetivo NO es una lista de
   generaciones sueltas: es un **árbol**. Hay piezas madre (posts, newsletters)
   y piezas hija (el playbook de una newsletter, el carrusel derivado de un
   post, el brief de vídeo de un post). **Las hijas nacen de la madre YA
   APROBADA**: reciben su texto final como material de partida y hablan de
   *eso*, no de cualquier cosa. Dos consecuencias buenas: la coherencia sale
   gratis, y **aprobar la madre dispara la hija sola** — el cliente aprueba la
   newsletter por la mañana y por la tarde tiene su playbook en la cola sin
   haber pedido nada. Eso es «con la sola supervisión del cliente».

   En datos: `goal_tasks.depends_on` apunta a la madre; el ejecutor solo lanza
   una hija cuando la madre está `approved`, y le pasa `result_ref` de la madre
   como input. Si la madre se rechaza, la hija espera a la v2.

## 6. Estimación honesta

| Bloque | Tiempo |
|---|---|
| Migración (2 tablas + RLS) + planificador (spec + reparto en el tiempo) | 1,5 días |
| Cron + ejecutor con reintentos + dependencias | 1,5 días |
| UI: crear objetivo, confirmar plan, ver progreso, etiqueta en approvals | 2 días |
| Regeneración con nota + cierre y resumen | 1 día |
| Pruebas con Salsa (el único Cerebro completo) + ajuste del planificador | 1-2 días |
| **Total MVP** | **~7-8 días de trabajo** |

Sin la sesión de decisiones antes, se convierten en 12.

## 7. Lo que NO es esto

- No publica en redes (fuera del producto por decisión CEO 28-jul). Deja las
  piezas aprobadas en la cola; publicar sigue siendo del cliente.
- No sustituye al informe mensual: el mensual es *estrategia*, el objetivo es
  *ejecución* de una semana. El mensual puede PROPONER objetivos semanales —
  buena evolución para después.
- No decide temas por su cuenta sin pilares: si el cliente no tiene pilares,
  el planificador se lo dice y le ofrece el proponedor (M1 ya lo cableó).
