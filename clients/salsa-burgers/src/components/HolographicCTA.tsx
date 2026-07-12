"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useOrder } from "@/context/OrderContext";
import { useLanguage } from "@/context/LanguageContext";

export function HolographicCTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { openOrder } = useOrder();
  const { t } = useLanguage();

  return (
    <section
      ref={ref}
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{ backgroundColor: "#ff0000" }}
    >
      {/* Animated noise/texture overlay */}
      <motion.div
        animate={{ opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px",
        }}
      />

      {/* Bright glow blobs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#ff6600] rounded-full blur-[120px] opacity-30 -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#ffcc00] rounded-full blur-[120px] opacity-20 -translate-y-1/2" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9 }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-black uppercase tracking-tighter leading-[0.85] text-white mb-6"
              style={{ fontSize: "clamp(3rem, 7vw, 8rem)" }}
            >
              {t.holographicCta.line1}
              <br />
              {t.holographicCta.line2}
              <br />
              <span style={{ color: "rgba(0,0,0,0.8)" }}>{t.holographicCta.line3}</span>{" "}
              <span className="text-white">{t.holographicCta.line4}</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-white/80 text-xl font-semibold leading-relaxed mb-8 max-w-md"
            >
              {t.holographicCta.body}
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.5 }}
              onClick={openOrder}
              whileHover={{ scale: 1.05, backgroundColor: "#000" }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-5 rounded-full font-black text-base uppercase tracking-wider text-white transition-colors"
              style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
            >
              {t.holographicCta.btn}
            </motion.button>
          </motion.div>

          {/* Right — packaging image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/freepik_create-a-premium-singlesided-packaging-artwork-for-a-burger-box-dieline.-packaging-specs-product-burger-box-unfolded-size-45.2-x-68-cm-material-mpet-film-12u-silver-paper-300-gsm-print-1-_0001.jpg"
                alt="Salsa Burgers Holographic Packaging"
                className="w-full max-w-md mx-auto drop-shadow-2xl"
                style={{ filter: "drop-shadow(0 20px 60px rgba(0,0,0,0.4)) brightness(1.05)" }}
              />
            </motion.div>

            {/* Holographic shimmer badge */}
            <motion.div
              initial={{ opacity: 0, rotate: -15 }}
              animate={isInView ? { opacity: 1, rotate: -15 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute top-4 -right-4 bg-black text-white px-5 py-2.5 rounded-full font-black text-sm shadow-2xl hidden lg:flex items-center gap-2"
            >
              {t.holographicCta.badge}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
