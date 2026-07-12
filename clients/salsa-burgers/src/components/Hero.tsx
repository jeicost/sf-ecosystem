"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

function HeroBurgerImage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState("");

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setSrc(mobile ? "/Videos/burger-hero-mobile.mp4" : "/Videos/burger-hero.mp4");
  }, []);

  useEffect(() => {
    if (src && videoRef.current) videoRef.current.play().catch(() => {});
  }, [src]);

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        preload={src ? "auto" : "none"}
        className="w-full h-full object-cover"
        style={{ transform: "scale(0.9)" }}
      />
    </div>
  );
}

type CmsData = Record<string, unknown> | null

function cmsText(data: CmsData, key: string, lang: string): string | undefined {
  if (!data) return undefined
  return (data[`${key}_${lang}`] ?? data[`${key}_en`]) as string | undefined
}

export function Hero({ cmsData = null }: { cmsData?: CmsData }) {
  const { t, lang } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

      {/* Red glow animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0000]/12 via-black to-black" />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/3 w-[700px] h-[700px] bg-[#ff0000] rounded-full blur-[180px]"
        />
      </div>

      {/* SALSABURGERS repeating background */}
      <div className="absolute inset-0 flex flex-col justify-center overflow-hidden select-none pointer-events-none">
        {["SALSABURGERS S", "SALSABURGERS", "SALSABURGERS S", "SALSABURGERS"].map((text, i) => (
          <div
            key={i}
            className="font-black uppercase leading-[0.87] tracking-[-0.04em] whitespace-nowrap"
            style={{
              fontSize: "13.5vw",
              color: "rgba(255,255,255,0.06)",
              transform: `translateX(${i % 2 === 0 ? "-5%" : "5%"})`,
            }}
          >
            {text}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-28 sm:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left space-y-7">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em] inline-block px-5 py-2 border-2 border-[#ff0000] rounded-full">
                {cmsText(cmsData, 'badge', lang) ?? t.hero.badge}
              </span>
            </motion.div>

            {/* sr-only H1 for SEO — keyword signal without changing visual design */}
            <h1 className="sr-only">Premium Wagyu Burgers Bangkok — Delivery in 30 min via Grab &amp; LINE MAN | Salsa Burgers</h1>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              aria-hidden="true"
              className="font-black uppercase leading-[0.85] tracking-tighter"
              style={{ fontSize: "clamp(3.4rem, 7.5vw, 8.25rem)" }}
            >
              <span style={{ color: "#ff0000" }}>{cmsText(cmsData, 'headline1', lang) ?? t.hero.headline1}</span>
              <br />
              <span className="text-white">{cmsText(cmsData, 'headline2', lang) ?? t.hero.headline2}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-lg text-white/60 font-semibold max-w-md"
            >
              {cmsText(cmsData, 'sub', lang) ?? t.hero.sub}
            </motion.p>

          </div>

          {/* Right — Burger circle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="order-1 lg:order-2 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-[740px] mx-auto" style={{ aspectRatio: "1/1" }}>
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.28, 0.12] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute rounded-full border border-[#ff0000]/40"
                style={{ inset: "-8%" }}
              />
              <div className="absolute inset-0 bg-[#ff0000] opacity-[0.16] blur-[90px] rounded-full scale-90" />
              <div className="absolute inset-0 bg-[#ff0000] opacity-[0.07] blur-[60px] rounded-full scale-75" />
              <div className="relative w-full h-full rounded-full overflow-hidden border border-white/10 bg-black/50">
                <HeroBurgerImage />
              </div>
              <motion.div
                initial={{ opacity: 0, x: -30, rotate: -15 }}
                animate={{ opacity: 1, x: 0, rotate: -15 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="absolute top-[12%] -left-[6%] bg-[#ff0000] text-white px-5 py-2.5 rounded-full font-black text-sm shadow-2xl border-2 border-black hidden lg:flex items-center gap-2"
              >
                {t.hero.badge1}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30, rotate: 15 }}
                animate={{ opacity: 1, x: 0, rotate: 15 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="absolute bottom-[12%] -right-[6%] bg-[#ff0000] text-white px-5 py-2.5 rounded-full font-black text-sm shadow-2xl border-2 border-white/20 hidden lg:flex items-center gap-2"
              >
                {t.hero.badge2}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.35em]">{t.hero.scroll}</span>
          <div className="w-5 h-9 border border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 bg-[#ff0000] rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
