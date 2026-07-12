"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";

const starters = [
  {
    name: "Tiger Wings",
    description: "Salsa House Sauce, Sesame Seeds, Hot Sriracha, BBQ Sauce",
    image: "/images/tiger_wings_640x640.jpg",
    accentColor: "#ff4400",
  },
  {
    name: "Onion Rings",
    description: "Crispy Onion Rings, Lightly Breaded and Golden Fried, Served with Garlic Dip",
    image: "/images/onion_rings_640x640.jpg",
    accentColor: "#ffd23f",
  },
  {
    name: "Pickle Sticks",
    description: "Fried Thinly Sliced Pickles, Smoky Rub, Garlic Mayo",
    image: "/images/pickle_sticks_640x640.jpg",
    accentColor: "#4caf50",
  },
  {
    name: "Corn Ribs",
    description: "Deep-Fried Corn Ribs, Smoky Rub, Cheese Dip, Lime Wedges",
    image: "/images/corn_ribs_640x640.jpg",
    accentColor: "#ffd23f",
  },
  {
    name: "Avocado Fries",
    description: "Breaded Avocado Wedges, Honey Mustard Mayo",
    image: "/images/avocado_640x640.jpg",
    accentColor: "#4caf50",
  },
  {
    name: "Salsa Nachos",
    description: "Corn Tortilla Chips, Melted Cheese, Pico de Gallo, Jalapeños",
    image: "/images/nachos_640x640.jpg",
    accentColor: "#ff9900",
  },
];

export function Starters() {
  return (
    <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">Start The Ritual</span>
          </div>
          <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
            <span style={{ color: "#ff0000" }}>STARTERS</span>
          </h2>
          <p className="text-xl sm:text-2xl text-white/60 font-medium max-w-2xl mx-auto">Kick things off with bold flavors</p>
        </motion.div>
        <BurgerCarousel items={starters} />
      </div>
    </section>
  );
}
