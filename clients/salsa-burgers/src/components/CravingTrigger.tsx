"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function CravingTrigger() {
  const { t } = useLanguage();

  return (
    <section className="relative py-24 sm:py-32 bg-black overflow-hidden">
      {/* Red glow background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#ff0000] rounded-full blur-[180px]"
        />
      </div>

      {/* SALSABURGERS BG text */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none pointer-events-none">
        <div
          className="font-black uppercase whitespace-nowrap"
          style={{ fontSize: "20vw", color: "rgba(255,255,255,0.03)", letterSpacing: "-0.05em" }}
        >
          SALSABURGERS
        </div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2
            className="font-black uppercase leading-[0.85] tracking-tighter"
            style={{ fontSize: "clamp(2rem, 4.5vw, 5.5rem)" }}
          >
            <span style={{ color: "#ff0000" }}>DIP</span>
            <br />
            <span className="text-white">HAPPENS</span>
          </h2>

          <p className="text-white/60 text-xl font-bold mx-auto whitespace-nowrap">
            {t.craving.sub}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
