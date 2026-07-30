/**
 * CMS pages helper — reads content/pages.json (baked at build time by
 * scripts/fetch-cms-content.mjs) and merges CMS overrides over the hardcoded
 * copy. Single-locale (es) site. Build-time bake only, no workspace imports
 * (isolated npm install on Vercel — see clients/adrian-grooves for the same
 * pattern already in production).
 */

type SectionData = Record<string, unknown>;
type CmsSections = Record<string, { type: string; data: SectionData }>;

export function loadCmsSections(pageSlug: "home" | "influencers"): CmsSections {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages = require("../content/pages.json");
    return pages?.[pageSlug]?.sections ?? {};
  } catch {
    return {};
  }
}

/** Data bag for the page's single flat-fields section (id: "content"). */
export function section(cms: CmsSections, id = "content"): SectionData {
  return cms[id]?.data ?? {};
}

/** Merge a flat fallback object with CMS overrides — CMS wins only when non-empty. */
export function mergeContent<T extends Record<string, unknown>>(fallback: T, cmsData: SectionData): T {
  const merged: Record<string, unknown> = { ...fallback };
  for (const key of Object.keys(fallback)) {
    const v = cmsData[key];
    if (typeof v === "string" && v.trim() !== "") merged[key] = v;
  }
  return merged as T;
}
