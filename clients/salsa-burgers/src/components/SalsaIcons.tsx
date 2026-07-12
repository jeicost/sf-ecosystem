"use client";

import { motion } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const reviews = [
  { text: "The flavor explosion is real. Every bite is packed with pure delight. Total satisfaction!", author: "Ignacio Sanchez", platform: "Google" },
  { text: "For me, the best burgers in Bangkok. Super tasty and the meat… INCREDIBLE! 100% Wagyu.", author: "Eric M.", platform: "Grab" },
  { text: "The best burger I've had in Bangkok. The meat was super juicy and full of flavor, the bun incredibly soft and the sauces amazing. The Miso blew me away — I'll definitely be back.", author: "Daniel Barranco", platform: "Google" },
  { text: "The best burgers in Bangkok. The packaging is awesome too.", author: "Alberto García Mandarina", platform: "Grab" },
  { text: "These burgers are amazing! Perfect in every detail, from the packaging to the eating experience. I'll definitely order again.", author: "Anders Olofsson", platform: "Google" },
  { text: "Incredible flavor and spectacular meat. Easily one of the best burgers in Bangkok. The packaging is some of the best I've seen.", author: "Javi", platform: "Grab" },
  { text: "Juicy burgers, intense flavors and incredible sauces. One of the best burgers I've ever tried!", author: "Nirada Kritsanaseranee", platform: "Google" },
  { text: "I love this burger, it's my favorite right now.", author: "Gorka S.", platform: "Grab" },
  { text: "I've tried many burgers in Bangkok, but this is the best. Highly recommend the Mala — it was delicious. I'll definitely try more from here.", author: "Aitor González", platform: "Google" },
  { text: "We ordered burgers and nachos. Everything was amazing and the portions are very generous. You can tell they care about every detail — and the packaging is beautiful.", author: "Tometam B.", platform: "Grab" },
  { text: "One of the best burgers I've tried in Bangkok. Very juicy meat, quality bun and combinations worth every bite. If you're looking for a great burger in Bangkok, this place doesn't disappoint.", author: "Daniel Ch", platform: "Google" },
  { text: "The burger was incredible, I finished the whole thing. The size is generous and the meat quality is among the best I've tried in Bangkok.", author: "Álvaro", platform: "Grab" },
  { text: "Impressive burgers. Easily one of the best flavor combinations I've tried in the country.", author: "Carlos Jacoste", platform: "Google" },
  { text: "What a surprise! Unique and intense flavors. Top quality meat, fresh ingredients and very generous portions. We'll definitely be back.", author: "Néstor", platform: "Grab" },
  { text: "One of the best burgers I've tried in Bangkok. Top quality meat and generous portions. Highly recommended.", author: "Jordi Bellido Cuenca", platform: "Google" },
  { text: "I tried the Holy Basil burger and the Khao Soi — both were delicious! The meat was incredibly tender. Great variety on the menu, both classic and fusion.", author: "Luxuri bonny", platform: "Google" },
  { text: "Unbeatable flavor, five-star service. Fresh ingredients and a truly delicious taste.", author: "Javier MS", platform: "Google" },
  { text: "The best burger I've had in Thailand! This place is going to be my new favorite spot.", author: "Monetric Boom", platform: "Google" },
  { text: "The best burgers in Bangkok.", author: "sasin sawangsri", platform: "Google" },
  { text: "Great burgers for the price.", author: "Alberto García Mandarina", platform: "Google" },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className="w-4 h-4" viewBox="0 0 20 20" fill="#ffd23f">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Google</span>
    </div>
  );
}

function GrabBadge() {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#00B14F"/>
        <text x="3" y="17" fontSize="13" fontWeight="900" fill="white" fontFamily="Arial">G</text>
      </svg>
      <span className="text-white/40 text-[11px] font-bold uppercase tracking-wider">Grab</span>
    </div>
  );
}

export function SalsaIcons() {
  const { t } = useLanguage();
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [maxOff, setMaxOff] = useState(9999);

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
    return firstCard ? firstCard.offsetWidth + 16 : 376;
  };

  const prev = () => {
    const step = getStep();
    setOffset((o) => Math.max(0, o - step));
  };
  const next = () => {
    const step = getStep();
    setOffset((o) => Math.min(maxOff, o + step));
  };

  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <section id="salsa-icons" className="relative py-20 sm:py-32 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10 select-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#ff0000] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#ff0000] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "7s", animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full bg-white/5">
              {t.moments.eyebrow}
            </span>
          </div>
          <h2
            className="font-black text-white uppercase tracking-tighter leading-none mb-4"
            style={{ fontSize: "clamp(2rem, 4vw, 4.5rem)" }}
          >
            {t.moments.title1} <span style={{ color: "#ff0000" }}>{t.moments.title2}</span>
          </h2>
          <p className="text-white/50 text-lg font-medium max-w-lg mx-auto">
            {t.moments.subtitle}
          </p>
        </motion.div>

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Left arrow — desktop only */}
          <button
            onClick={prev}
            disabled={offset === 0}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 w-11 h-11 rounded-full items-center justify-center text-white transition-all hover:scale-110 disabled:opacity-30 disabled:pointer-events-none"
            style={{ background: "linear-gradient(135deg, #f01a00, #af1200)", boxShadow: "0 4px 20px rgba(255,0,0,0.4)" }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Track */}
          <div ref={wrapRef} className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
              {reviews.map((review, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: i * 0.07 }}
                  className="flex-none w-[85vw] sm:w-[360px] rounded-2xl border border-white/10 p-7 flex flex-col justify-between gap-5"
                  style={{ backgroundColor: "#111111" }}
                >
                  {/* Quote mark */}
                  <div
                    className="text-[4rem] font-black leading-none select-none"
                    style={{ color: "#ff0000", lineHeight: "0.8", marginBottom: "-8px" }}
                  >
                    &ldquo;
                  </div>

                  {/* Review text */}
                  <p className="text-white/85 text-base font-medium leading-relaxed flex-1">
                    {review.text}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="space-y-1.5">
                      <StarRating />
                      <p className="text-white font-black text-sm tracking-tight">— {review.author}</p>
                    </div>
                    {review.platform === "Grab" ? <GrabBadge /> : <GoogleBadge />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right arrow — desktop only */}
          <button
            onClick={next}
            disabled={offset >= maxOff}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 w-11 h-11 rounded-full items-center justify-center text-white transition-all hover:scale-110 disabled:opacity-30 disabled:pointer-events-none"
            style={{ background: "linear-gradient(135deg, #f01a00, #af1200)", boxShadow: "0 4px 20px rgba(255,0,0,0.4)" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Pagination — dots on desktop, progress bar on mobile */}
        <div className="flex justify-center items-center gap-2 mt-10">
          {/* Mobile: progress bar */}
          <div className="flex sm:hidden items-center gap-3">
            <div className="w-40 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-400"
                style={{
                  width: maxOff > 0 ? `${Math.round((offset / maxOff) * 100)}%` : "0%",
                  backgroundColor: "#ff0000",
                }}
              />
            </div>
            <span className="text-white/30 text-xs font-bold tabular-nums">
              {Math.min(reviews.length, Math.round(offset / (getStep() || 1)) + 1)}/{reviews.length}
            </span>
          </div>
          {/* Desktop: individual dots */}
          {Array.from({ length: reviews.length }).map((_, i) => {
            const step = 376;
            const isActive = Math.round(offset / step) === i;
            return (
              <button
                key={i}
                onClick={() => setOffset(Math.min(i * step, maxOff))}
                className="hidden sm:block rounded-full transition-all duration-300"
                style={{
                  width: isActive ? "2rem" : "0.5rem",
                  height: "0.5rem",
                  backgroundColor: isActive ? "#ff0000" : "rgba(255,255,255,0.2)",
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
