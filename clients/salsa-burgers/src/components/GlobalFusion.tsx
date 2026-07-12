"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";

const burgers = [
  {
    name: "K-Spice Burger",
    description: "Premium Wagyu Beef with gochujang sauce, bacon, kimchi, pickled shallots, and fresh lettuce",
    image: "/images/K-spice_640x640.jpg",
    accentColor: "#cc0000",
  },
  {
    name: "Miso Onsen",
    description: "Premium Wagyu Beef with miso sauce, onion jam, onsen egg, seaweed",
    image: "/images/miso_onsen_640x640.jpg",
    accentColor: "#f5c842",
  },
  {
    name: "Mala Burger",
    description: "Premium Wagyu Beef with sichuan mala sauce, crispy lotus root, shredded iceberg",
    image: "/images/mala_640x640.jpg",
    accentColor: "#ff2200",
  },
  {
    name: "BBQ Smokehouse",
    description: "Premium Wagyu Beef with slow-smoked BBQ glaze, pulled onions, pickles, smoked cheddar",
    image: "/images/bbq.jpg",
    accentColor: "#8b4500",
  },
  {
    name: "Crispy Chicken Fusion",
    description: "Korean-style crispy chicken, gochujang glaze, coleslaw, pickled daikon, sesame aioli",
    image: "/images/crispy_chiken.jpg",
    accentColor: "#ff8800",
  },
];

export function GlobalFusion() {
  return (
    <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffd23f]/3 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <div className="inline-block mb-6">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">World Flavors</span>
          </div>
          <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
            FUSION <span style={{ color: "#ffd23f" }}>BURGERS</span>
          </h2>
          <p className="text-xl sm:text-2xl text-white/60 font-medium max-w-2xl mx-auto">Global inspirations. Bangkok execution.</p>
        </motion.div>
        <BurgerCarousel items={burgers} />
      </div>
    </section>
  );
}
