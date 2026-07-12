"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const categories = [
  { slug: "salsa-classics",    name: "SALSA CLASSICS",    count: "5 BURGERS", image: "/images/truffle_flow_640x640.jpg",        accentColor: "#ff0000", imgPos: "center 45%" },
  { slug: "local-flavors",     name: "LOCAL FLAVORS",     count: "3 BURGERS", image: "/images/holy_basil_640x640.jpg",           accentColor: "#ffd23f", imgPos: "center 50%" },
  { slug: "fusion-burgers",    name: "FUSION BURGERS",    count: "3 BURGERS", image: "/images/mala_640x640.jpg",                 accentColor: "#ff6b35", imgPos: "center 42%", imgScale: 1.25 },
  { slug: "salsa-deluxe",      name: "SALSA DELUXE",      count: "3 ITEMS",   image: "/images/foie_640x640.jpg",                 accentColor: "#c8a951", imgPos: "center 48%", imgScale: 1.25 },
  { slug: "appetizers",        name: "APPETIZERS",        count: "6 ITEMS",   image: "/images/tiger_wings_640x640.jpg",          accentColor: "#ff4400", imgPos: "center 45%" },
  { slug: "salsa-fries",       name: "SALSA FRIES",       count: "4 SIDES",   image: "/images/dusted_fries_640x640.jpg",         accentColor: "#888888", imgPos: "center 50%" },
  { slug: "milkshakes",        name: "SHAKES",            count: "9 SHAKES",  image: "/images/Vanilla_milkshake_640x640.jpg",    accentColor: "#e83a5a", imgPos: "center 65%", imgScale: 1.0 },
  { slug: "smoothies",         name: "SMOOTHIES",         count: "3 ITEMS",   image: "/images/watermelon_1200x1200.jpg",         accentColor: "#4caf50", imgPos: "center 65%", imgScale: 1.0 },
  { slug: "desserts",          name: "DESSERTS",          count: "4 ITEMS",   image: "/images/brownie_1200x1200.jpg",            accentColor: "#c8873a", imgPos: "center 50%" },
];

function CategoryCard({
  category,
  index,
  displayName,
}: {
  category: (typeof categories)[number];
  index: number;
  displayName: string;
}) {
  const [imgError, setImgError] = useState(false);
  const accent = category.accentColor;

  return (
    <Link href={`/menu#${category.slug}`} className="flex-none w-[78vw] sm:w-[320px] lg:w-[380px] block">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.55, delay: index * 0.08 }}
        className="rounded-2xl border border-white/[0.08] group/card overflow-hidden cursor-pointer"
        style={{ backgroundColor: "#0f0f0f" }}
        whileHover={{
          borderColor: accent,
          y: -8,
          boxShadow: `0 12px 48px ${accent}35, 0 0 0 1px ${accent}70`,
          transition: { duration: 0.2 },
        }}
      >
        {/* Image — close-up portrait */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.image}
              alt={`${category.name} — Salsa Burgers Bangkok`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700"
              style={{ transform: `scale(${category.imgScale ?? 1.5})`, objectPosition: category.imgPos, transformOrigin: category.imgPos }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `radial-gradient(ellipse at 30% 40%, ${accent}22 0%, #080808 65%)`,
              }}
            >
              <span
                className="font-black uppercase tracking-[-0.04em] text-transparent"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  WebkitTextStroke: `1.5px ${accent}45`,
                }}
              >
                {displayName.split(" ")[0]}
              </span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f0f0f] to-transparent" />
          {/* Count badge */}
          <div
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border"
            style={{
              backgroundColor: "rgba(255,210,63,0.15)",
              borderColor: "rgba(255,210,63,0.5)",
              color: "#ffd23f",
            }}
          >
            {category.count}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight leading-tight">
            {displayName}
          </h3>
          <ChevronRight
            size={18}
            className="text-white/30 group-hover/card:text-white/70 transition-colors flex-none ml-2"
          />
        </div>
      </motion.div>
    </Link>
  );
}

export function MenuSummary() {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxOff, setMaxOff] = useState(999);
  const { t } = useLanguage();
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

  const getStep = () => {
    const firstCard = trackRef.current?.firstElementChild as HTMLElement | null;
    return firstCard ? firstCard.offsetWidth + 16 : 400;
  };

  const scroll = (dir: "left" | "right") => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    const max = track && wrap ? Math.max(0, track.scrollWidth - wrap.clientWidth) : maxOff;
    const step = getStep();
    setOffset((prev) => {
      const next = dir === "right" ? prev + step : prev - step;
      return Math.max(0, Math.min(max, next));
    });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) scroll(delta > 0 ? "right" : "left");
    touchStartX.current = null;
  };

  const canScrollLeft = offset > 0;
  const canScrollRight = offset < maxOff;

  return (
    <section id="menu" className="relative py-10 sm:py-14 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff0000]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-5">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">
              {t.menuSummary.eyebrow}
            </span>
          </div>
          <h2
            className="font-black text-white mb-5 uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(3.5rem, 7vw, 7rem)" }}
          >
            {t.menuSummary.headline} <span style={{ color: "#ff0000" }}>{t.menuSummary.headlineAccent}</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/55 font-medium max-w-xl mx-auto">
            {t.menuSummary.sub}{" "}
            <Link href="/menu" className="text-[#ff0000] hover:underline font-black">
              {t.menuSummary.seeFullMenu}
            </Link>
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="hidden sm:flex absolute left-0 top-[42%] -translate-y-1/2 z-10 -translate-x-4 w-11 h-11 rounded-full items-center justify-center text-white transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:pointer-events-none"
            style={{ background: "linear-gradient(135deg, #f01a00, #af1200)", boxShadow: "0 4px 20px rgba(255,0,0,0.35)" }}
          >
            <ChevronLeft size={18} />
          </button>

          <div ref={wrapRef} className="overflow-hidden pt-3 pb-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              ref={trackRef}
              className="flex gap-4"
              style={{
                transform: `translateX(-${offset}px)`,
                transition: "transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
                willChange: "transform",
                touchAction: "pan-y",
              }}
            >
              {categories.map((cat, i) => (
                <CategoryCard
                  key={cat.slug}
                  category={cat}
                  index={i}
                  displayName={t.menuSummary.cats[cat.slug as keyof typeof t.menuSummary.cats] ?? cat.name}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="hidden sm:flex absolute right-0 top-[42%] -translate-y-1/2 z-10 translate-x-4 w-11 h-11 rounded-full items-center justify-center text-white transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:pointer-events-none"
            style={{ background: "linear-gradient(135deg, #f01a00, #af1200)", boxShadow: "0 4px 20px rgba(255,0,0,0.35)" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
