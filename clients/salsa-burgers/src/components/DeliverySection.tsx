"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Clock, MapPin, ShoppingBag, Bike } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const featureIcons = [Clock, MapPin, ShoppingBag, Bike];
const featureColors = ["#ff0000", "#ffd23f", "#00B900", "#00B900"];

export function DeliverySection() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section id="order" ref={sectionRef} className="relative py-20 sm:py-28 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00B900]/3 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 text-center">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <span className="text-[#00B900] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#00B900]/40 rounded-full">
            {t.delivery.eyebrow}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-black uppercase tracking-tighter leading-none mb-4"
          style={{ fontSize: "clamp(4rem, 10vw, 11rem)" }}
        >
          <span className="text-white">{t.delivery.title1} </span>
          <span style={{ color: "#ffd23f" }}>{t.delivery.title2}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-white/55 text-xl font-medium mb-14 max-w-lg mx-auto"
        >
          {t.delivery.sub}
        </motion.p>

        {/* Feature cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
          {t.delivery.features.map((feature, i) => {
            const Icon = featureIcons[i];
            const color = featureColors[i];
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                className="rounded-2xl p-6 border border-white/[0.08] hover:border-white/20 transition-colors"
                style={{ backgroundColor: "#141414" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}40` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <p className="text-white font-black text-sm uppercase tracking-wider mb-1">{feature.label}</p>
                <p className="text-white/50 text-xs font-medium">{feature.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Order buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-5 justify-center max-w-2xl mx-auto"
        >
          <motion.a
            href="https://r.grab.com/o/UJnMJVre" target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-4 py-5 px-8 rounded-full font-black text-base uppercase tracking-wider text-white"
            style={{ backgroundColor: "#00B14F", boxShadow: "0 0 30px rgba(0,177,79,0.25)" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            {t.delivery.orderGrab}
          </motion.a>
          <motion.a
            href="https://lin.ee/rIpXvGI?openExternalBrowser=1" target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex-1 flex items-center justify-center gap-4 py-5 px-8 rounded-full font-black text-base uppercase tracking-wider text-white"
            style={{ backgroundColor: "#00B900", boxShadow: "0 0 30px rgba(0,185,0,0.25)" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            {t.delivery.orderLine}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
