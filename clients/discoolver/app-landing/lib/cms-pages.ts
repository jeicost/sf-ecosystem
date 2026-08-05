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

function normalizeSections(sectionsJson: unknown): CmsSections {
  const sections: CmsSections = {};
  if (!Array.isArray(sectionsJson)) return sections;
  for (const raw of sectionsJson) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const key = (rec.id ?? rec.type) as string | undefined;
    if (!key) continue;
    sections[key] = { type: (rec.type as string) ?? "", data: (rec.data as SectionData) ?? {} };
  }
  return sections;
}

/**
 * Draft Mode (EDUX-N4): request-time fetch of the live (possibly-draft) page
 * from sf-cms, bypassing the build-time bake. Used only while
 * draftMode().isEnabled — normal reads always go through loadCmsSections.
 * Returns null on any failure so the caller falls back to the static bake.
 */
export async function loadCmsSectionsLive(pageSlug: "home" | "influencers"): Promise<CmsSections | null> {
  const apiUrl = process.env.SF_CMS_API_URL || process.env.CMS_API_URL;
  const apiKey = process.env.SF_CMS_API_KEY || process.env.CMS_API_KEY;
  const projectSlug = process.env.SF_CMS_PROJECT_SLUG || process.env.CMS_PROJECT_SLUG || "discoolver";
  const previewSecret = process.env.SF_CMS_PREVIEW_SECRET;

  if (!apiUrl || !apiKey || !previewSecret) return null;

  try {
    const res = await fetch(
      // Mismo mapeo de slugs que scripts/fetch-cms-content.mjs: esta web usa
      // `app-home`/`app-influencers`, porque `home`/`influencers` sirven a la
      // web de guías (clients/discoolver/web) dentro del mismo proyecto CMS.
      `${apiUrl}/pages?project=${projectSlug}&slug=${
        pageSlug === "home"
          ? process.env.SF_CMS_SLUG_HOME || "app-home"
          : process.env.SF_CMS_SLUG_INFLUENCERS || "app-influencers"
      }&preview=true`,
      { headers: { "x-api-key": apiKey, "x-preview-secret": previewSecret }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const page = await res.json();
    return normalizeSections(page?.sections_json);
  } catch {
    return null;
  }
}
