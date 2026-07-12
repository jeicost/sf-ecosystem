"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function EveryDetailMatters() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const { t } = useLanguage();

  return (
    <section ref={ref} className="relative py-16 sm:py-20 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10"
        >
          <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em] mb-4 block">
            {t.everyDetail.eyebrow}
          </span>
          <h2
            className="font-black text-white uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(3rem, 7vw, 9rem)" }}
          >
            {t.everyDetail.title} <span style={{ color: "#ffd23f" }}>{t.everyDetail.titleAccent}</span>
          </h2>
        </motion.div>

        {/* Photo grid — asymmetric 3-panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: "60vh" }}>

          {/* Left — tall hero photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="lg:col-span-5 rounded-2xl overflow-hidden relative group"
            style={{ minHeight: "420px" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand_girl_burger.jpg"
              alt="Salsa Burgers Experience"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              style={{ filter: "brightness(0.8) contrast(1.1)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <p className="text-white font-black text-xl uppercase tracking-tight">{t.everyDetail.dineIn}</p>
              <p className="text-white/60 text-sm mt-1">{t.everyDetail.dineInSub}</p>
            </div>
          </motion.div>

          {/* Right — 2 stacked */}
          <div className="lg:col-span-7 grid grid-rows-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="rounded-2xl overflow-hidden relative group"
              style={{ minHeight: "200px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/Beyond%20the%20burger/brand_store.jpg"
                alt="Salsa Burgers Store"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.75) contrast(1.1)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="text-white font-black text-lg uppercase">{t.everyDetail.packaging}</p>
                <p className="text-white/60 text-sm">{t.everyDetail.packagingSub}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="rounded-2xl overflow-hidden relative group"
              style={{ minHeight: "200px" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/DIY/brand_packaging.jpg"
                alt="Salsa Packaging"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.75) contrast(1.1)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="text-white font-black text-lg uppercase">{t.everyDetail.ritual}</p>
                <p className="text-white/60 text-sm">{t.everyDetail.ritualSub}</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 4-photo strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          {[
            { src: "/images/Beyond%20the%20burger/brand_kitchen.jpg", label: t.everyDetail.kitchen },
            { src: "/images/brand_street.jpg", label: t.everyDetail.streets },
            { src: "/images/Beyond%20the%20burger/IMG_1689.JPG", label: t.everyDetail.team },
            { src: "/images/Beyond%20the%20burger/hero_burger.jpg", label: t.everyDetail.burger },
          ].map((photo, i) => (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
              className="rounded-xl overflow-hidden relative group"
              style={{ aspectRatio: "1/1" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.72) contrast(1.1)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-black text-sm uppercase tracking-tight">{photo.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
