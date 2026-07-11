"use client";

import { useEffect, useRef, useState } from "react";

export default function FooterWordmark() {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setDrawn(true); },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = "stroke-white fill-none";
  const dur = (s: number, d: number) =>
    `stroke-dashoffset ${s}s cubic-bezier(0.4,0,0.2,1) ${d}s forwards`;

  return (
    <div className="w-full flex flex-col items-center gap-8 py-12 select-none">
      {/* Icon symbol — animated strokes */}
      <svg
        ref={ref}
        viewBox="0 0 800 850"
        className="w-[120px] md:w-[160px] opacity-60"
        aria-hidden="true"
      >
        {/* Outer large circle — circumference ≈ 2309 */}
        <circle
          cx="404" cy="431" r="367"
          className={base}
          strokeWidth="28"
          strokeDasharray="2309"
          strokeDashoffset={drawn ? "0" : "2309"}
          style={{ transition: drawn ? dur(1.8, 0) : "none" }}
        />
        {/* Inner circle — circumference ≈ 939 */}
        <circle
          cx="404" cy="424" r="149"
          className={base}
          strokeWidth="28"
          strokeDasharray="939"
          strokeDashoffset={drawn ? "0" : "939"}
          style={{ transition: drawn ? dur(1.2, 0.5) : "none" }}
        />
        {/* Vertical line — length ≈ 672 */}
        <line
          x1="38" y1="763" x2="38" y2="91"
          className={base}
          strokeWidth="28"
          strokeLinecap="round"
          strokeDasharray="672"
          strokeDashoffset={drawn ? "0" : "672"}
          style={{ transition: drawn ? dur(0.9, 1.0) : "none" }}
        />
        {/* Diagonal line — length ≈ 937 */}
        <line
          x1="734" y1="756" x2="71" y2="93"
          className={base}
          strokeWidth="28"
          strokeLinecap="round"
          strokeDasharray="937"
          strokeDashoffset={drawn ? "0" : "937"}
          style={{ transition: drawn ? dur(1.1, 1.2) : "none" }}
        />
        {/* Horizontal line — length ≈ 609 */}
        <line
          x1="93" y1="802" x2="702" y2="802"
          className={base}
          strokeWidth="28"
          strokeLinecap="round"
          strokeDasharray="609"
          strokeDashoffset={drawn ? "0" : "609"}
          style={{ transition: drawn ? dur(0.8, 1.5) : "none" }}
        />
        {/* Corner dot circles */}
        {([
          [60, 798, 38],
          [60, 68, 38],
          [734, 791, 38],
        ] as const).map(([cx, cy, r], i) => (
          <circle
            key={`dot-${i}`}
            cx={cx} cy={cy} r={r}
            className={base}
            strokeWidth="28"
            strokeDasharray={String(Math.round(2 * Math.PI * r))}
            strokeDashoffset={drawn ? "0" : String(Math.round(2 * Math.PI * r))}
            style={{ transition: drawn ? dur(0.5, 1.7 + i * 0.1) : "none" }}
          />
        ))}
      </svg>

      {/* Wordmark text */}
      <p
        className="font-[family-name:var(--font-space-grotesk)] font-black text-[clamp(28px,4vw,52px)] tracking-[-0.02em] text-white/20 text-center leading-none"
        style={{
          opacity: drawn ? 1 : 0,
          transform: drawn ? "translateY(0)" : "translateY(8px)",
          transition: drawn ? "opacity 0.8s ease 2s, transform 0.8s ease 2s" : "none",
        }}
      >
        STARTUP FACTORY
      </p>
    </div>
  );
}
