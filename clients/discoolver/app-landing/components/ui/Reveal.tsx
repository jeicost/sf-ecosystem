"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fade+rise-on-scroll wrapper — mirrors the original `.reveal` / `.is-in`
 * pattern (opacity 0 -> 1, translateY 24px -> 0) using IntersectionObserver.
 * Respects prefers-reduced-motion via the CSS media query in globals.css
 * (the .reveal class itself becomes a no-op transition there).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isIn, setIsIn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIn(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${isIn ? "is-in" : ""} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
