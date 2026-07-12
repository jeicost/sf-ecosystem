"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { Package, Hand, Droplets, Utensils, Share2, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const icons = [Package, Hand, Droplets, Utensils, Share2];

export function RitualSteps() {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section id="experience" ref={sectionRef} className="relative bg-[#0a0a0a] py-16 sm:py-20 overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(90deg, #ff0000 0px, transparent 1px, transparent 50px),
                           repeating-linear-gradient(0deg, #ff0000 0px, transparent 1px, transparent 50px)`
        }} />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-none tracking-tighter">
            {t.ritual.title} <span className="text-[#ff0000]">{t.ritual.titleAccent}</span>{t.ritual.title2 ? ` ${t.ritual.title2}` : ""}
          </h2>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl text-[#ffd23f] font-black uppercase tracking-wide">{t.ritual.sub1}</p>
            <p className="text-xl sm:text-2xl text-white/90 font-bold">{t.ritual.sub2}</p>
            <p className="text-xl sm:text-2xl text-[#ff0000] font-black uppercase tracking-wider">{t.ritual.sub3}</p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 relative">
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-[#ff0000] opacity-20" style={{ marginLeft: '10%', marginRight: '10%' }} />

          {t.ritual.steps.map((step, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="relative"
              >
                <div className="relative bg-black/40 border-2 border-white/10 rounded-2xl p-8 hover:border-[#ff0000] transition-all duration-300 hover:scale-105 group h-full flex flex-col">
                  <div className="absolute -top-6 -left-4 w-16 h-16 bg-[#ff0000] rounded-full flex items-center justify-center border-4 border-[#0a0a0a] group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-black text-white">0{index + 1}</span>
                  </div>
                  <div className="mb-6 mt-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: "rgba(255,0,0,0.12)", border: "3px solid #ff0000" }}>
                      <Icon size={36} style={{ color: "#ff0000" }} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="text-center flex-grow flex flex-col justify-center">
                    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">{step.title}</h3>
                    <p className="text-base text-white/70 font-medium leading-relaxed">{step.desc}</p>
                  </div>
                  {index < t.ritual.steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 z-10">
                      <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ArrowRight size={32} className="text-[#ff0000]" strokeWidth={3} />
                      </motion.div>
                    </div>
                  )}
                </div>
                {index < t.ritual.steps.length - 1 && (
                  <div className="lg:hidden flex justify-center my-4">
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                      <ArrowRight size={32} className="text-[#ff0000] rotate-90" strokeWidth={3} />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA — single row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16 pt-10 border-t border-white/[0.06]"
        >
          <p className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            {t.ritual.ctaText} <span className="text-[#ff0000]">{t.ritual.ctaAccent}</span>?
          </p>
          <button
            onClick={() => document.getElementById("order")?.scrollIntoView({ behavior: "smooth" })}
            className="text-white px-10 py-4 text-base font-black rounded-full hover:scale-105 transition-all uppercase tracking-wider whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #f01a00, #af1200)",
              boxShadow: "0 4px 20px rgba(255,0,0,0.35)",
            }}
          >
            {t.ritual.ctaBtn}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
