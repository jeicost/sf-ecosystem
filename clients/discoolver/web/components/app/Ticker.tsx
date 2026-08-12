import type { AppHomeContent } from "@/lib/content/app-home";

export function Ticker({ content }: { content: AppHomeContent }) {
  const items = [
    content.ticker_1,
    content.ticker_2,
    content.ticker_3,
    content.ticker_4,
    content.ticker_5,
    content.ticker_6,
    content.ticker_7,
    content.ticker_8,
    content.ticker_9,
    content.ticker_10,
  ];
  const loop = [...items, ...items];

  return (
    <div className="ticker" aria-hidden="true" role="marquee">
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
