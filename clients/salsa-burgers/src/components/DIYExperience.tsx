"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function DIYExperience() {
  const { t } = useLanguage();

  return (
    <section className="relative py-20 sm:py-28 bg-[#0d0d0d] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffd23f]/4 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] mb-5 block">
              {t.diy.eyebrow}
            </span>
            <h2
              className="font-black uppercase tracking-tighter leading-[0.88] mb-8"
              style={{ fontSize: "clamp(3rem, 7vw, 8rem)" }}
            >
              <span className="text-white">{t.diy.title1}</span>
              <br />
              <span style={{ color: "#ffd23f" }}>{t.diy.title2}</span>
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed mb-10 max-w-lg">
              {t.diy.body}
            </p>

            <div className="space-y-5">
              {t.diy.steps.map((item) => (
                <div key={item.step} className="flex gap-5 items-start">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-none"
                    style={{ backgroundColor: "rgba(255,210,63,0.15)", color: "#ffd23f", border: "1.5px solid rgba(255,210,63,0.3)" }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p className="text-white font-black text-base uppercase tracking-tight">{item.label}</p>
                    <p className="text-white/50 text-sm mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — photos */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/DIY/brand_packaging.jpg"
                alt="Salsa Burgers Packaging"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.85) contrast(1.1)" }}
              />
            </div>
            <div className="rounded-2xl overflow-hidden mt-10" style={{ aspectRatio: "3/4" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/freepik_create-a-stylish-street-photography-image-of-a-person-walking-while-holding-a-black-takeaway-bag-from-salsa-burgers.-focus-black-bag-with-red-salsa-burgers-logo-and-white-doodles.-scene-u_0001.jpg"
                alt="Salsa Burgers Street"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
