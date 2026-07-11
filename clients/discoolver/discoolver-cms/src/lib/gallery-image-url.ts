/** Canonical public origin for gallery assets, e.g. https://images.discoolver.com/.../<image-id> */
export const DISCOOLVER_IMAGES_ORIGIN = "https://images.discoolver.com";

/**
 * Preset delivery sizes only — maps to `width` / `height` query params on the CDN (no path suffixes like `/card`).
 */
export const GALLERY_IMAGE_VARIANTS = [
  "thumbnail",
  "card",
  "detail",
  "picture",
] as const;

export type GalleryImageVariant = (typeof GALLERY_IMAGE_VARIANTS)[number];

/** Fixed dimensions per preset; must match what the image CDN accepts for `width` & `height`. */
export const GALLERY_IMAGE_VARIANT_DIMENSIONS: Record<
  GalleryImageVariant,
  { width: number; height: number }
> = {
  thumbnail: { width: 320, height: 240 },
  card: { width: 800, height: 450 },
  detail: { width: 1600, height: 900 },
  picture: { width: 1920, height: 1080 },
};

/** Tail segments stripped when saving / normalizing canonical base URLs (legacy path-based variants). */
const KNOWN_VARIANT_STRIP_TAIL = [...GALLERY_IMAGE_VARIANTS, "public"];

function pathSegmentsFromHrefOrRelative(fullUrlOrPath: string): string[] {
  const trimmed = fullUrlOrPath.trim();
  if (!trimmed) return [];
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed)
        .pathname.replace(/\/+$/, "")
        .split("/")
        .filter(Boolean);
    } catch {
      return [];
    }
  }
  return trimmed.replace(/^\/+/, "").split("/").filter(Boolean);
}

/**
 * Drops a trailing delivery variant from path segments when present (`public`, `thumbnail`, etc.).
 */
function stripTrailingVariantSegments(segments: string[]): string[] {
  const out = [...segments];
  const tail = out[out.length - 1]?.toLowerCase();
  if (tail && KNOWN_VARIANT_STRIP_TAIL.includes(tail)) out.pop();
  return out;
}

/**
 * Returns `https`-absolute base URL (path only, no query): same asset id, ready for `discoolverGalleryDeliveryUrl`.
 */
export function toDiscoolverGalleryCanonicalBaseUrl(parts: {
  publicUrl?: string | null;
  key: string;
}): string {
  const trimmedPublic = parts.publicUrl?.trim();
  const key = parts.key.trim();
  const resolved =
    trimmedPublic ||
    (/^https?:\/\//i.test(key)
      ? key
      : `${DISCOOLVER_IMAGES_ORIGIN}/${key.replace(/^\/+/, "")}`);
  try {
    const u = new URL(resolved.replace(/^(?!https?:)/i, "https:"));
    const segs = stripTrailingVariantSegments(
      pathSegmentsFromHrefOrRelative(u.href),
    );
    u.pathname = "/" + segs.join("/");
    u.search = "";
    u.hash = "";
    let out = u.toString();
    if (out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
    const joined = trimmedPublic ?? key.replace(/^\/+/, "");
    const segs = stripTrailingVariantSegments(pathSegmentsFromHrefOrRelative(joined));
    return `${DISCOOLVER_IMAGES_ORIGIN}/${segs.join("/")}`;
  }
}

/**
 * Builds the full public canonical base URL saved as `cloudUrl` (no arbitrary transforms in the stored string).
 */
export function toDiscoolverGalleryCloudUrl(parts: {
  publicUrl?: string | null;
  key: string;
}): string {
  return toDiscoolverGalleryCanonicalBaseUrl(parts);
}

/**
 * Resolves canonical `cloudUrl` (or legacy key/path) into a delivery URL with preset `width` & `height` query params.
 */
export function discoolverGalleryDeliveryUrl(
  cloudUrlOrKey: string,
  variant: GalleryImageVariant,
): string {
  const trimmed = cloudUrlOrKey.trim();
  const { width, height } = GALLERY_IMAGE_VARIANT_DIMENSIONS[variant];
  let base: URL;
  if (/^https?:\/\//i.test(trimmed)) {
    base = new URL(trimmed.replace(/^(?!https?:)/i, "https:"));
  } else {
    base = new URL(
      `${DISCOOLVER_IMAGES_ORIGIN}/${trimmed.replace(/^\/+/, "")}`,
    );
  }
  const segs = stripTrailingVariantSegments(
    base.pathname.replace(/\/+$/, "").split("/").filter(Boolean),
  );
  base.pathname = "/" + segs.join("/");
  base.searchParams.set("width", String(width));
  base.searchParams.set("height", String(height));
  let out = base.toString();
  if (out.endsWith("/")) out = out.slice(0, -1);
  return out;
}
