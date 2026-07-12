"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";

const burgers = [
  {
    name: "Khao Soi",
    description: "Premium Wagyu Beef glazed with khao soi sauce, topped with crispy egg noodles, coriander, pickled shallots",
    image: "/images/khaosoi_burger_640x640.jpg",
    accentColor: "#ffd23f",
  },
  {
    name: "Tom Yum Classic",
    description: "Premium Wagyu Beef with tom yum sauce, tomato, crispy shrimp, mushrooms, pickled shallots",
    image: "/images/Tomyam_640x640.jpg",
    accentColor: "#ff4400",
  },
  {
    name: "Tom Yum Signature",
    description: "Signature take on Bangkok's favourite soup — bold lemongrass, kaffir lime, galangal, chili heat",
    image: "/images/Tomyam_640x640.jpg",
    accentColor: "#ff6622",
  },
  {
    name: "The Holy Basil",
    description: "Premium Wagyu Beef with holy basil sauce, crispy holy basil, fried egg, garlic chili seasoning",
    image: "/images/holy_basil_640x640.jpg",
    accentColor: "#00aa44",
  },
];

export function BangkokSpecials() {
  return (
    <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <div className="inline-block mb-5">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">Street Food Legends</span>
          </div>
          <h2 className="font-black text-white mb-5 uppercase tracking-tighter leading-none" style={{ fontSize: "clamp(3.5rem, 7vw, 7rem)" }}>
            LOCAL <span style={{ color: "#ffd23f" }}>FLAVORS</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/55 font-medium max-w-xl mx-auto">Bold flavors straight from Bangkok streets</p>
        </motion.div>
        <BurgerCarousel items={burgers} />
      </div>
    </section>
  );
}
