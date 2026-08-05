import type { HomeContent } from "@/lib/content/home";

/** Horizontal marquee of brand claims (decorative — hidden from AT). */
export function Ticker({ content }: { content: HomeContent }) {
  const items = [content.marquee_1, content.marquee_2, content.marquee_3, content.marquee_4, content.marquee_5];
  const loop = [...items, ...items, ...items, ...items];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__row">
        {loop.map((item, i) => (
          <span className="ticker__item" key={i}>
            <span className="ticker__dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
