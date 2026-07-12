"use client";

import { motion } from "motion/react";

const menuCategories = [
  { label: "Salsa Classics", count: "7 burgers", color: "#ff0000" },
  { label: "Bangkok Specials", count: "3 burgers", color: "#ffd23f" },
  { label: "Global Fusion", count: "5 burgers", color: "#ff6b35" },
  { label: "Salsa Deluxe", count: "3 burgers", color: "#c8a951" },
  { label: "Starters", count: "6 items", color: "#4caf50" },
  { label: "Salsa Fries", count: "8 sides", color: "#ffd23f" },
  { label: "Sauces", count: "6 sauces", color: "#ff0000" },
  { label: "Shakes", count: "6 shakes", color: "#e83a5a" },
  { label: "Desserts", count: "8 desserts", color: "#c8873a" },
];

export function MenuSection() {
  return (
    <section id="menu-overview" className="relative py-20 sm:py-28 bg-black overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — kitchen photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="rounded-2xl overflow-hidden relative"
            style={{ aspectRatio: "3/4" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/Beyond%20the%20burger/brand_kitchen.jpg"
              alt="Salsa Burgers Kitchen"
              className="w-full h-full object-cover"
              style={{ filter: "brightness(0.65) contrast(1.15) saturate(0.85)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-white font-black text-2xl uppercase">Made Fresh</p>
              <p className="text-white/60 text-sm mt-1">Every order, every time.</p>
            </div>
          </motion.div>

          {/* Right — menu overview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <span className="text-[#ff0000] text-xs font-black uppercase tracking-[0.3em] mb-5 block">
              Full Menu
            </span>
            <h2
              className="font-black text-white uppercase tracking-tighter leading-[0.88] mb-10"
              style={{ fontSize: "clamp(3rem, 6vw, 7rem)" }}
            >
              THE
              <br />
              <span style={{ color: "#ff0000" }}>MENU</span>
            </h2>

            <div className="space-y-3">
              {menuCategories.map((cat, i) => (
                <motion.div
                  key={cat.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  viewport={{ once: true }}
                  className="flex justify-between items-center py-3 border-b border-white/10 group hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: cat.color }} />
                    <span className="text-white font-black text-lg uppercase tracking-tight group-hover:text-white transition-colors">
                      {cat.label}
                    </span>
                  </div>
                  <span className="text-white/40 text-sm font-bold uppercase tracking-wider">
                    {cat.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
