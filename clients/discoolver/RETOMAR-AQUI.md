# Discoolver — dónde lo dejamos (6 de agosto de 2026)

Punto de entrada para la próxima sesión. Lee esto antes que nada.

---

## Cómo volver a ver las propuestas nuevas

El servidor de desarrollo muere al cerrar la sesión. Para levantarlo otra vez:

```bash
cd ~/Developer/Claude/clients/discoolver/web && npx next dev -p 4360
```

Y abrir:

| Nueva (propuesta) | Actual (para comparar) |
|---|---|
| http://localhost:4360/360 | https://discoolver.com/es/destinos |
| http://localhost:4360/360/destinos | https://discoolver.com/es/alojamientos |
| http://localhost:4360/360/alojamientos | https://discoolver-landing.vercel.app |
| http://localhost:4360/360/agencias | https://discoolver-app-landing.vercel.app |
| http://localhost:4360/360/demo | https://discoolver-creators-landing.vercel.app |

Las páginas nuevas llevan una banda superior que dice **PROPUESTA EN REVISIÓN**.
Se quita cuando Carlos dé el OK.

---

## Estado: los 8 commits de agosto ya están en origin

Aquello se pusheó. Lo del 2026-08-10 (logo de 360 + siembra en el CMS) también.

**Sigue vigente el aviso:** un push a `main` dispara build de producción en cinco
proyectos de Vercel — `discoolver-landing`, `salsa-burgers-web`,
`startup-factory-web`, `nc-global-assets-next` y `adrian-grooves`. No hay
path-filter: se reconstruyen los cinco aunque solo toques uno. Tres de ellos son
webs de cliente **vivas**. Antes de pushear, anotar el `dpl_` de producción de
cada uno y comprobar los cinco después; si uno falla, Vercel mantiene el
deployment anterior sirviendo, pero hay que enterarse igual.

También hay un cambio **sin commitear** en `~/Developer/discoolver-dg-editor/ui/influencers.html`
(quitar la comisión del 50%). Es el repo del cliente, por eso se dejó fuera.

---

## Lo que ya está hecho

**Fase −1 · Preservar** — commit `cda68f1`, tag `discoolver-preauditoria-2026-08-06`.
Snapshot del copy de las 5 páginas del CMS (solo vivía en Supabase, sin historial)
y de las 8 páginas de la web antigua. En `_snapshot/`.

**Fase 0 · Parar la sangría** — sobre las webs existentes:
- Página legal `/privacidad` en app-landing + enlaces desde los formularios.
- Enlaces rotos del footer, countdown coherente (fecha única en `Countdown.tsx`).
- Testimonios sin fotos de stock; fuera el titular de los 120.000 usuarios.
- La comisión del 50% eliminada de las **cinco** superficies donde vivía,
  incluida la copia del dg-editor que no tenía CMS detrás.

**Documentos** — en `deliverables/`:
- `PLAN_LANZAMIENTO_2026-09-01.xlsx` — 115 tareas, 10 hitos, 18 riesgos, las 80
  promesas de la web auditadas, estado por ciudad y playbook.
- `BRAND_BRAIN_DISCOOLVER_2026-08.md` + `.pdf` — para subir a MIRA. Se regenera
  el PDF con `build-brand-brain-pdf.py`; el `.md` es la fuente de verdad.

**Análisis de la BBDD real** — `_snapshot/bbdd/produccion_recomendaciones_2026-08-06.csv`.
La hoja "Estado por ciudad" del Excel está rehecha con estos datos
(`deliverables/rehacer_ciudades.py` la regenera).

**discoolver 360 (NUEVO)** — commit `ffd8d26`. Cinco páginas en `/360`, con
sistema visual propio aislado del B2C. 552 campos de copy en
`web/lib/content/b360/` y el original en `deliverables/copy-360/`.

**Logo de 360 + siembra en el CMS (2026-08-10, SIN COMMITEAR)** — el logo que
faltaba ya existe como asset: Carlos pasó la D y está vectorizada en
`web/components/b360/Logo360.tsx` y `web/public/assets/360/` (el asset original de Carlos, no una reconstrucción), con
favicon, apple-icon y OG propios. Va en el nav y en el footer de /360.

Y las cinco páginas **ya están en SF-CMS**: slugs `360-home`, `360-destinos`,
`360-alojamientos`, `360-agencias`, `360-demo`, 566 campos, publicadas. El copy
de `/360/demo` estaba hardcodeado en el JSX y se extrajo a
`web/lib/content/b360/demo.ts` para que también se pudiera editar. Se re-siembra
con `npx tsx scripts/seed-cms-360.ts` (idempotente). Verificado en vivo que el
CMS pisa al código y que `next build` deja las cinco rutas estáticas.

Mientras el banner "PROPUESTA EN REVISIÓN" siga puesto, las cinco llevan
`noindex` — no tiene sentido que Google indexe una propuesta. Se quitan juntos.

---

## Lo que rompe el plan del 1 de septiembre

Del CSV de producción, y hay que decidirlo antes de seguir:

- **Bangkok tiene CERO fichas.** También Sevilla, Valencia, Bilbao, Granada,
  San Sebastián y Córdoba. Las "7 ciudades de España" del plan no existen.
- Lo que sí hay (tarjetas listas = viva + STATE=4 + foto principal + categoría):
  **Madrid 858 · Barcelona 182 · Ronda 165 · Punta Cana 128 · Málaga 107 ·
  Santo Domingo 75 · Aranjuez 64 · Ibiza 50.**
- El cuello no es recolectar: la IA ha generado 4.605 de las 6.861 fichas vivas.
  Es **revisar**: 3.935 esperando en STATE=3, el 94% de IA y solo el 6% con foto.
- "Filipinas" no es una ciudad: es un cajón con el Burj Al Arab, Ashford Castle
  y Marina Bay Sands. 50 fichas mal asignadas.

**Recomendación:** tres guías el 1-sept (Madrid, Barcelona, Ronda), Málaga y
Aranjuez en octubre, Bangkok como preventa. Aranjuez encaja mejor como capítulo
de Madrid que como edición propia; Ronda vende más como caso de 360 que como
guía. El Caribe está listo y nadie lo ha pedido: decisión de negocio.

---

## Qué toca ahora, en este orden

1. **Que Carlos revise `/360`** y diga qué cambia. Es lo que estaba esperando.
2. **Fase 2 · Copy B2C** — home de la app con el claim nuevo y CTA real a
   `app.discoolver.com`, `/guias` con ficha por ciudad y checkout, `/creators`
   unificando `/influencers` + `creators-landing`.
3. **Fase 1 · Consolidación** — i18n ES/EN con hreflang y absorber `app-landing`
   en un solo proyecto Vercel. Va después del copy: primero se aprueba qué se
   dice, luego se monta la estructura.
4. ~~**Sembrar en SF-CMS**~~ — HECHO el 2026-08-10 (ver arriba). La regla sigue
   viva para lo que venga: **re-sembrar ANTES de desplegar** o las claves viejas
   pisan el copy nuevo. Pasó con 40 colisiones reales en agosto.
5. **Fase 4 · Corte de dominio** — lo último, con el equipo de Discoolver. Es la
   única operación irreversible en caliente.

---

## Bloqueado esperando a Carlos

**Para cerrar 360** (35 campos marcados `[PENDIENTE]` en las páginas, se ven en
magenta al navegarlas):
- Contratación pública: contrato menor o licitación, CPV, pliego, certificaciones.
  Es la primera objeción de un patronato y hoy no hay respuesta escrita.
- Comisión concreta que se lleva el alojamiento por venta de recomendaciones.
- Check-in: ¿producto real hoy o roadmap?
- Precio del hardware de tótems (el mantenimiento son 100 €/mes, el hardware no).
- Plazos de puesta en marcha de los seis módulos que no son el POS.
- Titularidad de datos, permanencia, preaviso de baja y portabilidad.
- Teléfono B2B: circulan dos (+34 656 91 43 74 y +34 681 291 571).
- Cita de Ronda con nombre, cargo y autorización por escrito.
- Agencias: qué se le vende exactamente a una DMC, con qué tarifa y margen.
- ~~**El logo de discoolver 360**~~ — resuelto el 2026-08-10 con el asset original
  que pasó Carlos (`Logo Discoolver 360 D.png`). Está en `web/public/assets/360/`.
  Si algún día aparece el vector (AI/Figma del deck), sustituirlo ahí: hoy es un
  bitmap, suficiente para web pero no para gran formato ni serigrafía.
- Los Keynotes por vertical (Alojamientos ×3, Destinos ×5, DMCs).

**Para el plan de lanzamiento:**
- Horas/día comprometidas de Diego y Yonathan, para pasar los responsables del
  Excel de rol a persona.
- Número real de curators y de guardados en listas.
- Cuál de los dos píxeles de Meta es el canónico y acceso a `GTM-TT97GKS`.
- Si los tres handles de `/influencers` (@viajeraautentica, @exploradorurbano,
  @aventurera_creativa) son reales. Si son de relleno, esa sección se retira.

---

## Cosas que no hay que volver a descubrir

- El CMS **pisa** el código: `mergeContent` solo recorre las claves del fallback,
  y en local no se nota porque sin `.env.local` solo se renderizan los fallbacks.
- Un campo del formulario que no esté en `EXTRA_FIELDS` de
  `app/api/waitlist/route.ts` **se pierde en silencio**.
- `app/globals.css` tiene tokens recuperados 1:1 del bundle de producción. No se
  tocan. Por eso 360 cuelga los suyos de `.b360` y no de `:root`.
- Los assets de `web/public/assets/` pesan ~550 MB. Comprimir antes de un deploy real.
- La contradicción que alguien señalará antes o después: 360 vende visibilidad a
  negocios mientras el B2C promete que no hay rankings de pago. Respuesta: 360
  vende tecnología a un destino o un hotel, no posiciones a un restaurante.
  Conviene tenerla preparada, no improvisarla.
