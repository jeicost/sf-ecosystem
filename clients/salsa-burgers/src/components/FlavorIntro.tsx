"use client";

import { useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function FlavorIntro() {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Set mobile or desktop source
    const mobile = window.innerWidth < 768;
    video.src = mobile ? "/Videos/salsaburgers3-mobile.mp4" : "/Videos/salsaburgers3.mp4";
    // Play only when visible
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { video.play().catch(() => {}); } else { video.pause(); } },
      { threshold: 0.2 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-[#0a0a0a] overflow-hidden">

      {/* Top half — dark statement */}
      <div className="relative py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0000]/8 via-transparent to-transparent" />

        <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-center">

            {/* Left — giant headline */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9 }}
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em]">
                  {t.flavorIntro.eyebrow}
                </span>
              </motion.div>

              <h2
                className="font-black uppercase leading-[0.88] tracking-tighter text-white mb-8"
                style={{ fontSize: "clamp(2.8rem, 6vw, 7rem)" }}
              >
                {t.flavorIntro.headline1}
                <br />
                {t.flavorIntro.headline2}
                {t.flavorIntro.headline3 && <><br />{t.flavorIntro.headline3}</>}
                <br />
                <span style={{ color: "#ff0000" }}>{t.flavorIntro.headline4}</span>
              </h2>

              <p className="text-white/60 text-xl font-medium leading-relaxed max-w-lg">
                {t.flavorIntro.body}
              </p>
            </motion.div>

            {/* Right — video */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              viewport={{ once: true, margin: "-80px" }}
              className="relative flex items-center justify-center"
            >
              <div
                className="absolute inset-0 rounded-3xl blur-[80px]"
                style={{ backgroundColor: "rgba(255,0,0,0.12)", transform: "scale(0.9)" }}
              />
              <div className="relative w-full rounded-3xl overflow-hidden border border-white/10" style={{ aspectRatio: "9/16", maxHeight: "520px" }}>
                <video
                  ref={videoRef}
                  src="/Videos/salsaburgers3.mp4"
                  loop
                  muted
                  playsInline
                  preload="none"
                  className="w-full h-full object-cover"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
                viewport={{ once: true }}
                className="absolute top-[8%] -left-4 bg-[#ff0000] text-white px-5 py-2.5 rounded-full font-black text-sm shadow-2xl border-2 border-black"
                style={{ transform: "rotate(-12deg)" }}
              >
                {t.flavorIntro.badgeMade}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 1 }}
                viewport={{ once: true }}
                className="absolute bottom-[8%] -right-4 bg-[#ffd23f] text-black px-5 py-2.5 rounded-full font-black text-sm shadow-2xl border-2 border-black"
                style={{ transform: "rotate(10deg)" }}
              >
                {t.flavorIntro.badgeEvery}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scrolling marquee banner */}
      <div className="relative border-t border-b border-white/10 py-5 overflow-hidden bg-[#ff0000]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[0, 1].map((n) => (
            <span key={n} className="text-white font-black text-xl uppercase tracking-[0.2em] pr-16">
              {t.flavorIntro.marquee}{t.flavorIntro.marquee}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="relative py-12 bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: t.flavorIntro.stat1 },
              { value: "11+", label: t.flavorIntro.stat2 },
              { value: "6+", label: t.flavorIntro.stat3 },
              { value: "BKK", label: t.flavorIntro.stat4 },
            ].map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl sm:text-5xl font-black mb-2" style={{ color: "#ff0000" }}>{stat.value}</div>
                <div className="text-white/50 text-xs font-black uppercase tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}
