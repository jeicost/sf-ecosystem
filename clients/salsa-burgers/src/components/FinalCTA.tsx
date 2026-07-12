"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function FinalCTA() {
  const { t } = useLanguage();
  const handleGrab = () => window.open("https://r.grab.com/o/UJnMJVre", "_blank");
  const handleLineMAN = () => window.open("https://lin.ee/rIpXvGI?openExternalBrowser=1", "_blank");

  return (
    <section className="relative py-20 sm:py-28 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Brand photo background */}
      <div className="absolute inset-0 opacity-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand_girl_burger.jpg" alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="inline-block mb-2">
            <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border-2 border-[#ff0000] rounded-full">
              {t.finalCta.badge}
            </span>
          </div>

          <h2
            className="font-black text-white uppercase tracking-tighter leading-[0.85]"
            style={{ fontSize: "clamp(3.5rem, 9vw, 10rem)" }}
          >
            {t.finalCta.headline1}
            <br />
            {t.finalCta.headline2}
            <br />
            <span style={{ color: "#ff0000" }}>{t.finalCta.headline3}</span>
            <br />
            {t.finalCta.headline4}
          </h2>

          <p className="text-white/60 text-xl font-semibold">
            {t.finalCta.sub}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <motion.button
              onClick={handleGrab}
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center gap-3 px-10 py-5 rounded-full font-black text-base uppercase tracking-wider text-white"
              style={{ backgroundColor: "#00B14F" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              {t.finalCta.orderGrab}
            </motion.button>
            <motion.button
              onClick={handleLineMAN}
              whileHover={{ scale: 1.05 }}
              className="flex items-center justify-center gap-3 px-10 py-5 rounded-full font-black text-base uppercase tracking-wider text-white"
              style={{ backgroundColor: "#00B900" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              {t.finalCta.orderLine}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
