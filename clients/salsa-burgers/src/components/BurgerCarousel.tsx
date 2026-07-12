"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BurgerItem {
  name: string;
  description: string;
  image?: string;
  emoji?: string;
  accentColor?: string;
}

function BurgerCard({ item, index }: { item: BurgerItem; index: number }) {
  const [imgError, setImgError] = useState(false);
  const accent = item.accentColor || "#ff0000";
  const words = item.name.split(" ");
  const mainWord = words[words.length > 1 ? words.length - 1 : 0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.08 }}
      className="flex-none w-[calc(100vw-3rem)] sm:w-[340px] lg:w-[380px] rounded-2xl border border-white/[0.08] group/card"
      style={{ backgroundColor: "#0f0f0f", overflow: "hidden" }}
      whileHover={{
        borderColor: accent,
        y: -8,
        boxShadow: `0 12px 48px ${accent}35, 0 0 0 1px ${accent}70`,
        transition: { duration: 0.2 },
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "1/1" }}>
        {item.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={`${item.name} — Salsa Burgers Bangkok`}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-end justify-end p-6 relative overflow-hidden"
            style={{ background: `radial-gradient(ellipse at 30% 40%, ${accent}22 0%, #080808 65%)` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[50px]"
              style={{ backgroundColor: `${accent}20` }} />
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <span className="font-black uppercase leading-none tracking-[-0.04em] select-none"
                style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)", color: "transparent",
                  WebkitTextStroke: `1.5px ${accent}45`, whiteSpace: "nowrap", maxWidth: "90%",
                  overflow: "hidden", textOverflow: "clip" }}>
                {mainWord}
              </span>
            </div>
            <span className="relative text-3xl z-10 opacity-70">{item.emoji || "🍔"}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-5">
        <h3 className="text-lg sm:text-2xl font-black text-white mb-2 sm:mb-3 uppercase tracking-tight leading-tight">
          {item.name}
        </h3>
        <p className="text-white/50 text-xs sm:text-base leading-relaxed font-medium line-clamp-3">
          {item.description}
        </p>
      </div>
    </motion.div>
  );
}

interface BurgerCarouselProps {
  items: BurgerItem[];
}

export function BurgerCarousel({ items }: BurgerCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxOff, setMaxOff] = useState(999);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const track = trackRef.current;
      const wrap = wrapRef.current;
      if (track && wrap) setMaxOff(Math.max(0, track.scrollWidth - wrap.clientWidth));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const slide = (dir: "left" | "right") => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    const max = track && wrap ? Math.max(0, track.scrollWidth - wrap.clientWidth) : maxOff;
    const step = wrap ? wrap.clientWidth * 0.75 : 320;
    setOffset((prev) => {
      const next = dir === "right" ? prev + step : prev - step;
      return Math.max(0, Math.min(max, next));
    });
  };

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) slide(delta > 0 ? "right" : "left");
    touchStartX.current = null;
  };

  const canLeft = offset > 0;
  const canRight = offset < maxOff;

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => slide("left")}
        disabled={!canLeft}
        className="absolute left-0 top-[calc(50%-2rem)] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:bg-[#ff0000] hover:border-[#ff0000] disabled:opacity-0 disabled:pointer-events-none"
        style={{ transform: "translateX(-50%) translateY(-50%)", top: "calc(50% - 2rem)" }}
      >
        <ChevronLeft size={18} />
      </button>

      {/* Right arrow */}
      <button
        onClick={() => slide("right")}
        disabled={!canRight}
        className="absolute right-0 top-[calc(50%-2rem)] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/70 border border-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-all duration-200 hover:bg-[#ff0000] hover:border-[#ff0000] disabled:opacity-0 disabled:pointer-events-none"
        style={{ transform: "translateX(50%) translateY(-50%)", top: "calc(50% - 2rem)" }}
      >
        <ChevronRight size={18} />
      </button>

      {/* Track */}
      <div ref={wrapRef} className="overflow-hidden pt-3 pb-6" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          ref={trackRef}
          className="flex gap-3 sm:gap-4"
          style={{
            transform: `translateX(-${offset}px)`,
            transition: "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
            willChange: "transform",
            touchAction: "pan-y",
          }}
        >
          {items.map((item, i) => (
            <BurgerCard key={item.name} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-1 mt-1">
        {items.map((_, i) => {
          const step = wrapRef.current ? wrapRef.current.clientWidth * 0.75 : 320;
          const isActive = Math.round(offset / step) === i;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? "1.5rem" : "0.375rem",
                height: "0.375rem",
                backgroundColor: isActive ? "#ff0000" : "rgba(255,255,255,0.2)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
