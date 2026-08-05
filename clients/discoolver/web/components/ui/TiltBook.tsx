"use client";

import { useEffect, useRef } from "react";

/**
 * Mouse-tilt wrapper for the hero book: writes --tilt-x / --tilt-y CSS vars
 * on the wrapper (consumed by `.book3d--hero` in globals.css) so the book
 * follows the pointer with a soft parallax. No re-renders — direct style
 * writes inside requestAnimationFrame. Does nothing at all under
 * prefers-reduced-motion or on touch-only devices (no mousemove).
 */
export function TiltBook({ children, maxTilt = 8, className = "" }: { children: React.ReactNode; maxTilt?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-y", `${(px * maxTilt * 2).toFixed(2)}deg`);
        el.style.setProperty("--tilt-x", `${(-py * maxTilt).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--tilt-y", "0deg");
        el.style.setProperty("--tilt-x", "0deg");
      });
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [maxTilt]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
