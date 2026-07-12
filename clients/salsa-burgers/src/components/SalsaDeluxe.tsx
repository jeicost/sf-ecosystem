"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";

const burgers = [
  {
    name: "Lobster Burger",
    description: "Dry-aged premium beef with grilled lobster, truffle mayo, chives, lime butter",
    image: "/images/lobster_640x640.jpg",
    accentColor: "#ff4400",
  },
  {
    name: "Dry-Aged Ribeye Steak Burger",
    description: "Dry-aged premium beef with sliced ribeye, caramelized onions, cheddar, arugula, tomato, garlic aioli",
    image: "/images/dry-aged_ribeye_640x640.jpg",
    accentColor: "#8b1a1a",
  },
  {
    name: "Premium Foie Burger",
    description: "Dry-aged premium beef with seared foie gras, onion jam, balsamic glaze, arugula",
    image: "/images/foie_640x640.jpg",
    accentColor: "#c8a951",
  },
  {
    name: "Salsa Gift Box",
    description: "Premium holographic burger box — give the full Salsa Deluxe experience, beautifully packaged",
    image: "/images/freepik_create-a-premium-singlesided-packaging-artwork-for-a-burger-box-dieline.-packaging-specs-product-burger-box-unfolded-size-45.2-x-68-cm-material-mpet-film-12u-silver-paper-300-gsm-print-1-_0001.jpg",
    accentColor: "#c0a0ff",
  },
];

export function SalsaDeluxe() {
  return (
    <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ffd23f]/5 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">Ultimate Indulgence</span>
          </div>
          <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
            SALSA <span style={{ color: "#ffd23f" }}>DELUXE</span>
          </h2>
          <p className="text-xl sm:text-2xl text-white/60 font-medium max-w-2xl mx-auto">Premium ingredients for the ultimate burger experience</p>
        </motion.div>
        <BurgerCarousel items={burgers} />
      </div>
    </section>
  );
}
