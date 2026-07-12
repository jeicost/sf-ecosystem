"use client";

import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";

export function BrandExperience() {
  const { t } = useLanguage();

  return (
    <section id="experience" className="relative py-16 sm:py-20 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10"
        >
          <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em] mb-4 block">
            {t.brandExperience.eyebrow}
          </span>
          <h2
            className="font-black text-white uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(3rem, 6vw, 7rem)" }}
          >
            {t.brandExperience.title}{" "}
            <span style={{ color: "#ffd23f" }}>{t.brandExperience.titleAccent}</span>
          </h2>
        </motion.div>

        {/* Bento grid — row 1: hero left + 2 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-3">

          {/* Left — hero tall (spans 2 rows on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl group"
            style={{ aspectRatio: "4/5" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand_girl_burger.jpg"
              alt="Salsa Burgers"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              style={{ objectPosition: "center 55%", filter: "brightness(0.65) contrast(1.15) saturate(1.1)" }}
            />
            {/* Top-to-center dark gradient to kill white studio background */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.1) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.85) 100%)" }} />
            {/* Red glow accent */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 70%, rgba(255,0,0,0.12) 0%, transparent 70%)" }} />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em] mb-2 block">
                {t.brandExperience.label1sub}
              </span>
              <p className="text-white font-black text-2xl sm:text-3xl uppercase tracking-tight leading-tight">
                {t.brandExperience.label1}
              </p>
            </div>
          </motion.div>

          {/* Right — 2 stacked cells */}
          <div className="grid grid-rows-2 gap-3" style={{ aspectRatio: "4/5" }}>

            {/* Top right — Kitchen */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/Beyond%20the%20burger/brand_kitchen.jpg"
                alt="Salsa Burgers Kitchen"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.7) contrast(1.1) saturate(0.85)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="text-white font-black text-lg uppercase tracking-tight">
                  {t.brandExperience.label2}
                </p>
              </div>
            </motion.div>

            {/* Bottom right — Burger closeup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/Beyond%20the%20burger/hero_burger.jpg"
                alt="Salsa Burger closeup"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.75) contrast(1.1)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="text-white font-black text-lg uppercase tracking-tight">
                  {t.brandExperience.label3}
                </p>
                <p className="text-white/50 text-sm mt-0.5">{t.brandExperience.label3sub}</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Row 2 — 3-col strip */}
        {/* Separator */}
        <div className="flex items-center gap-4 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em]">The full picture</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              src: "/images/Beyond%20the%20burger/brand_store.jpg",
              alt: "Salsa Burgers Store",
              label: t.brandExperience.photo1,
            },
            {
              src: "/images/brand_street.jpg",
              alt: "Bangkok Street",
              label: t.brandExperience.photo3,
            },
            {
              src: "/images/Beyond%20the%20burger/IMG_1689.JPG",
              alt: "Salsa Burgers Team",
              label: t.brandExperience.photo4,
            },
          ].map((photo, i) => (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl group"
              style={{ aspectRatio: "16/9" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                style={{ filter: "brightness(0.7) contrast(1.1)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-black text-sm uppercase tracking-widest drop-shadow-lg">
                  {photo.label}
                </p>
              </div>
              <div className="absolute inset-0 border border-white/0 group-hover:border-white/20 rounded-2xl transition-colors duration-300" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
