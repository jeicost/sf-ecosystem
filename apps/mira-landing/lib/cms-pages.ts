/**
 * Contenido editable desde SF-CMS — mismo patrón que clients/discoolver/web y
 * clients/adrian-grooves: el copy se descarga en build-time
 * (scripts/fetch-cms-content.mjs, encadenado antes de `next build`) y se hornea en
 * content/pages.json. Un cambio en el CMS se ve en el SIGUIENTE deploy, no al
 * instante — esta landing es `output: 'export'` y no hay servidor que consultar.
 *
 * A diferencia de discoolver aquí NO hay Draft Mode: `draftMode()` necesita
 * cookies en request-time y un export estático no las tiene, así que
 * `pageContent` es síncrona. Si algún día la landing deja de ser estática, el
 * hueco para `loadCmsSectionsLive` es este.
 *
 * Sin envs, con el CMS caído o con la página en draft, la web renderiza los
 * fallbacks de lib/content/**. Nunca revienta el build.
 */

type SectionData = Record<string, unknown>;
type CmsSections = Record<string, { type: string; data: SectionData }>;

/** Slugs de esta landing en el proyecto `mira` de SF-CMS. */
export type PageSlug = "home" | "home-en";

export function loadCmsSections(pageSlug: PageSlug): CmsSections {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require("../content/pages.json");
    return pages?.[pageSlug]?.sections ?? {};
  } catch {
    return {};
  }
}

/** Cada página tiene una única sección flat-fields con id "content". */
export function section(cms: CmsSections, id = "content"): SectionData {
  return cms[id]?.data ?? {};
}

/**
 * Mezcla el fallback con lo que venga del CMS. El CMS gana, pero solo en las
 * claves que existen en el fallback y solo si traen texto: así un campo vacío
 * en el editor no borra la web, y un campo viejo que ya no existe en el código
 * queda inerte en vez de colarse.
 *
 * El corolario incómodo, que en Discoolver costó 40 colisiones reales: si se
 * reescribe el copy de lib/content/** hay que RE-SEMBRAR el CMS antes de
 * desplegar (`scripts/seed-cms-mira.ts`) o se publica el texto anterior.
 */
export function mergeContent<T extends Record<string, unknown>>(
  fallback: T,
  cmsData: SectionData,
): T {
  const merged: Record<string, unknown> = { ...fallback };
  for (const key of Object.keys(fallback)) {
    const v = cmsData[key];
    if (typeof v === "string" && v.trim() !== "") merged[key] = v;
  }
  return merged as T;
}

/** Atajo para páginas flat-fields: carga el bake y mezcla de una vez. */
export function pageContent<T extends Record<string, unknown>>(slug: PageSlug, fallback: T): T {
  return mergeContent(fallback, section(loadCmsSections(slug), "content"));
}
