"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";

const fries = [
  {
    name: "Salsa Dusted Fries",
    description: "Pastrami, Cheddar, Pickled Jalapeños, Pico de Gallo",
    image: "/images/dusted_fries_640x640.jpg",
    accentColor: "#ffd23f",
  },
  {
    name: "Truffle Parmesan",
    description: "Crispy Fries, Truffle Oil, Parmesan, Truffle Mayo, Bacon Bits",
    image: "/images/truffle_parmesan_640x640.jpg",
    accentColor: "#888",
  },
  {
    name: "Cheese Bomb",
    description: "Crispy Fries, Melted Cheddar, Crispy Bacon Bits",
    image: "/images/cheese_bomb_640x640.jpg",
    accentColor: "#ff9900",
  },
  {
    name: "Triple Spice Fries",
    description: "Fries, Sea Salt, Paprika, Cracked Black Pepper",
    image: "/images/triple_fries_640x640.jpg",
    accentColor: "#ff6b00",
  },
  {
    name: "Normal Fries (M Size)",
    description: "Crunchy Fries with salt and ready to dip",
    image: "/images/fries_m_size_640x640.jpg",
    accentColor: "#ffd23f",
  },
];

export function SalsaFries() {
  return (
    <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff0000]/5 via-transparent to-transparent" />
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">Loaded Perfection</span>
          </div>
          <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
            SALSA <span style={{ color: "#ff0000" }}>FRIES</span>
          </h2>
          <p className="text-xl sm:text-2xl text-white/60 font-medium max-w-2xl mx-auto">Golden fries loaded with epic toppings</p>
        </motion.div>
        <BurgerCarousel items={fries} />
      </div>
    </section>
  );
}
