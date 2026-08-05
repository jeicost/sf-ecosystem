import Image from "next/image";

/**
 * CSS-only 3D book mockup (perspective + preserve-3d). Rendered with the
 * spine facing the viewer (positive rotateY on `.book3d`), a front cover,
 * and a darker back cover for thickness. The parent (`.book-scene`, or
 * `.bookcard` for grid cards) drives the hover/tilt rotation via CSS.
 *
 * Cover art is either a real image (the Madrid/Pablo cover) or a
 * typographic magazine-style cover built with CSS only — no invented
 * photos. Typographic covers size their type with container-query units.
 */

export type CoverArt =
  | { kind: "image"; src: string; alt: string }
  | { kind: "typo"; city: string; sub: string; bg: string; ink: string; accent: string };

/** "BANGKOK" -> ["BANG", "KOK"], "MADRID" -> ["MAD", "RID"], "SAN SEBASTIÁN" -> words. */
function splitCityLines(city: string): string[] {
  const clean = city.trim();
  if (clean.includes(" ")) return clean.split(/\s+/);
  if (clean.length <= 5) return [clean];
  const cut = Math.ceil(clean.length / 2);
  return [clean.slice(0, cut), clean.slice(cut)];
}

export function Book3D({
  cover,
  spineText,
  spineColor,
  priority = false,
  sizes = "(max-width: 700px) 70vw, (max-width: 1100px) 36vw, 420px",
}: {
  cover: CoverArt;
  spineText: string;
  spineColor: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className="book3d" style={{ "--book-color": spineColor } as React.CSSProperties}>
      <div className="book3d__back" aria-hidden="true" />
      <div className="book3d__spine" aria-hidden="true">
        <span>{spineText}</span>
      </div>
      <div className="book3d__front">
        {cover.kind === "image" ? (
          <Image src={cover.src} alt={cover.alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
        ) : (
          <div
            className="cover-typo"
            style={{ "--cover-bg": cover.bg, "--cover-ink": cover.ink, "--cover-accent": cover.accent } as React.CSSProperties}
          >
            <div>
              <p className="cover-typo__brand" aria-hidden="true">
                dis<em>cool</em>ver
              </p>
              <p className="cover-typo__chip">Guía discoolver · 2026</p>
            </div>
            <p className="cover-typo__city">
              {splitCityLines(cover.city).map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <div className="cover-typo__foot">
              <span className="cover-typo__sub">{cover.sub}</span>
              <span className="cover-typo__mark" aria-hidden="true">
                2◗26
              </span>
            </div>
          </div>
        )}
        <span className="book3d__gloss" aria-hidden="true" />
      </div>
    </div>
  );
}
