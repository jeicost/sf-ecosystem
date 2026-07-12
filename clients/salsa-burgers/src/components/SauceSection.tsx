"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const BASE = "/images/Salsas%20salsa%20Burgers/";

const sauces = [
  { name: "House Sauce",          desc: "Our signature dip. Creamy, tangy, addictive.",              heat: 1, image: `${BASE}House%20Sauce.jpg` },
  { name: "Garlic Mayo",          desc: "Roasted garlic bliss, smooth and bold.",                    heat: 1, image: `${BASE}Garlic%20mayo.jpg` },
  { name: "Katsu Mayo",           desc: "Japanese-style mayo with deep umami richness.",             heat: 1, image: `${BASE}Katsu%20Mayo.jpg` },
  { name: "Truffle Mayo",         desc: "Luxurious truffle mayo, earthy and silky smooth.",          heat: 1, image: `${BASE}Truffle%20Mayo.jpg` },
  { name: "Truffle Sauce",        desc: "Pure truffle intensity — the ultimate indulgence.",         heat: 1, image: `${BASE}Truffle%20Souce.jpg` },
  { name: "Miso",                 desc: "Deep umami soul of Japan, fermented richness.",             heat: 1, image: `${BASE}Miso.jpg` },
  { name: "Blue Cheese",          desc: "Rich, tangy blue cheese — bold and unmistakably creamy.",   heat: 1, image: `${BASE}Blue%20Cheese.jpg` },
  { name: "Cheese Dipping",       desc: "Melted cheddar goodness, smooth and satisfying.",           heat: 1, image: `${BASE}Cheese%20dippind%20Sauce.jpg` },
  { name: "Mustard",              desc: "Classic sharp mustard, bold and tangy.",                    heat: 2, image: `${BASE}Mustard.jpg` },
  { name: "BBQ",                  desc: "American smoky classic, sweet heat perfection.",            heat: 2, image: `${BASE}BBQ.jpg` },
  { name: "Khao Soi",             desc: "Northern Thai curry, creamy coconut and spice.",            heat: 2, image: `${BASE}Khao%20Soi.jpg` },
  { name: "Thai Basil Cheese",    desc: "Fresh Thai basil with cheese — aromatic and creamy.",       heat: 3, image: `${BASE}Thai%20Basil%20Cheese%20Sauce%20(level%201).jpg` },
  { name: "Gochujang",            desc: "Korean chili paste, sweet heat with complex depth.",        heat: 3, image: `${BASE}Gochujang%20(level%201).jpg` },
  { name: "Spicy Thai Basil",     desc: "Thai basil and cheese ignited — bold and fiery.",           heat: 4, image: `${BASE}Spicy%20Thai%20Basil%20Cheese%20Sauce%20(level%202).jpg` },
  { name: "Tom Yum",               desc: "Intense Tom Yum heat, full Thai aromatic punch.",           heat: 4, image: `${BASE}Tom%20Yum%20(level%202).jpg` },
  { name: "Mala",                  desc: "Maximum Sichuan fire — numbing, electric, extreme.",        heat: 5, image: `${BASE}Mala%20(level%202).jpg` },
];

function HeatDrops({ heat }: { heat: number }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path
            d="M4 0C4 0 0 5 0 8C0 10.2 1.8 12 4 12C6.2 12 8 10.2 8 8C8 5 4 0 4 0Z"
            fill={i < heat ? "#ff0000" : "rgba(255,255,255,0.2)"}
          />
        </svg>
      ))}
    </div>
  );
}

// Compute transform based on distance from active
function getCardStyle(dist: number) {
  const absD = Math.abs(dist);
  if (absD > 2) return { scale: 0, opacity: 0, zIndex: 0 };
  const scales =    [1.0,  0.82, 0.65];
  const opacities = [1,    0.65, 0.30];
  const xOffsets =  [0,    290,  545];
  return {
    scale: scales[absD],
    opacity: opacities[absD],
    x: dist < 0 ? -xOffsets[absD] : xOffsets[absD],
    zIndex: 10 - absD,
  };
}

type CmsSauceItem = { name: string; description: string; image: string }
type CmsData = { items?: CmsSauceItem[]; eyebrow?: string; headline?: string; description?: string } | null

// Merge CMS sauce data with local image paths (keyed by sauce name) and add heat rating
function mergeSauces(cmsList: CmsSauceItem[] | undefined) {
  if (!cmsList?.length) return sauces
  return cmsList.map(cms => {
    const local = sauces.find(s => s.name === cms.name)
    return { name: cms.name, desc: cms.description, heat: local?.heat ?? 1, image: local?.image ?? '' }
  })
}

export function SauceSection({ cmsData }: { cmsData?: CmsData }) {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Desktop: horizontal trackpad swipe navigates carousel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        if (e.deltaX > 40) next();
        else if (e.deltaX < -40) prev();
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile: touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartX.current = null;
  };

  const activeSauces = mergeSauces(cmsData?.items)
  const prev = () => setActive((a) => (a - 1 + activeSauces.length) % activeSauces.length);
  const next = () => setActive((a) => (a + 1) % activeSauces.length);

  return (
    <section id="sauces" className="relative py-20 sm:py-28 bg-black overflow-hidden">

      {/* Red spotlight glow behind carousel */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: "#ff0000" }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-block mb-6">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/40 rounded-full">
              {t.sauceSection.eyebrow}
            </span>
          </div>
          <h2
            className="font-black uppercase leading-[0.88] tracking-tighter"
            style={{ fontSize: "clamp(2rem, 5vw, 6rem)" }}
          >
            <span className="text-white">{t.sauceSection.title1}</span>
            <br />
            <span style={{ color: "#ff0000" }}>{t.sauceSection.title2}</span>
          </h2>
          <p className="text-xl font-bold mt-6">
            <span style={{ color: "#ffd23f" }}>{t.sauceSection.count}</span>
            <span className="text-white/80"> {t.sauceSection.countSub}</span>
          </p>
        </motion.div>

        {/* Coverflow carousel */}
        <div
          ref={carouselRef}
          className="relative h-[520px] sm:h-[580px] flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >

          {/* Cards */}
          {activeSauces.map((sauce, i) => {
            // Compute signed distance from active, wrapping
            let dist = i - active;
            if (dist > activeSauces.length / 2) dist -= activeSauces.length;
            if (dist < -activeSauces.length / 2) dist += activeSauces.length;

            const style = getCardStyle(dist);
            const isActive = dist === 0;

            if (Math.abs(dist) > 3) return null;

            return (
              <motion.div
                key={sauce.name}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                onClick={() => !isActive && (dist < 0 ? prev() : next())}
                className="absolute w-[260px] sm:w-[300px] rounded-3xl overflow-hidden cursor-pointer"
                style={{
                  border: isActive ? "1.5px solid rgba(255,255,255,0.2)" : "1.5px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Active glow */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      boxShadow: "0 0 60px 20px rgba(255,0,0,0.35), 0 0 120px 40px rgba(255,0,0,0.15)",
                    }}
                  />
                )}

                {/* Image area */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    height: "340px",
                    background: isActive
                      ? "radial-gradient(ellipse at 50% 65%, rgba(255,0,0,0.25) 0%, #050505 65%)"
                      : "radial-gradient(ellipse at 50% 65%, rgba(255,0,0,0.08) 0%, #050505 65%)",
                  }}
                >
                  {/* Heat rating */}
                  <div className="absolute top-4 right-4">
                    <HeatDrops heat={sauce.heat} />
                  </div>

                  {/* Bottle image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sauce.image}
                    alt={`${sauce.name} — Salsa Burgers artisan sauce Bangkok`}
                    loading="lazy"
                    decoding="async"
                    className="h-[70%] w-auto object-contain"
                    style={{
                      filter: isActive
                        ? "drop-shadow(0 0 25px rgba(255,0,0,0.5))"
                        : "drop-shadow(0 0 8px rgba(255,0,0,0.15)) brightness(0.7)",
                    }}
                  />
                </div>

                {/* Text area — white background like original */}
                <div className="bg-white px-5 py-5">
                  <h3 className="text-xl font-black text-black uppercase tracking-tight mb-1">
                    {sauce.name}
                  </h3>
                  <p className="text-black/55 text-xs leading-relaxed font-medium">
                    {sauce.desc}
                  </p>
                  <div className="mt-3 w-2 h-2 rounded-full bg-[#ff0000]" />
                </div>
              </motion.div>
            );
          })}

          {/* Nav arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/20 bg-black/70 backdrop-blur flex items-center justify-center text-white hover:bg-[#ff0000] hover:border-[#ff0000] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full border border-white/20 bg-black/70 backdrop-blur flex items-center justify-center text-white hover:bg-[#ff0000] hover:border-[#ff0000] transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Counter + sauce name */}
        <div className="text-center mt-6">
          <p className="text-white/40 text-sm font-black uppercase tracking-widest mb-2">
            {active + 1} / {activeSauces.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.h3
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter"
            >
              {activeSauces[active].name}
            </motion.h3>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
