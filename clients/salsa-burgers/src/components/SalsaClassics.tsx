"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";

const burgers = [
  {
    name: "OG Cheeseburger",
    description: "Premium Wagyu Beef with melted cheddar, crispy shallots, house pickles, signature house sauce",
    image: "/images/OG_burger_640x640.jpg",
    accentColor: "#ff0000",
  },
  {
    name: "OG Double",
    description: "Double Premium Wagyu Beef smash patties, double cheddar, house pickles, shallots, house sauce",
    image: "/images/OG_burger_640x640.jpg",
    accentColor: "#cc0000",
  },
  {
    name: "BBQ Beats",
    description: "Premium Wagyu Beef with cheddar, pickles, and smoky BBQ sauce with a touch of garlic mayo sauce",
    image: "/images/BBQ_beats_640x640.jpg",
    accentColor: "#ff6b00",
  },
  {
    name: "Mustard Lovers",
    description: "Premium Wagyu Beef with aged mustard, caramelized onions, cheddar, pickles, garlic aioli",
    image: "/images/mustard_lovers.jpg",
    accentColor: "#e8c830",
  },
  {
    name: "Crunchy Chicken",
    description: "Crispy fried chicken with cheddar cheese, lettuce, garlic mayo sauce, blue cheese sauce, shallot pickle",
    image: "/images/Crunchy_chicken_640x640.jpg",
    accentColor: "#ff8c00",
  },
  {
    name: "Yellow Jacket",
    description: "Premium Wagyu Beef with cheddar, arugula, caramelized onions, honey mustard mayo sauce",
    image: "/images/Yellow_jacket_640x640.jpg",
    accentColor: "#ffd23f",
  },
  {
    name: "Truffle Flow",
    description: "Premium Wagyu Beef with melted mozzarella, black truffle paste, arugula, truffle mayo sauce",
    image: "/images/truffle_flow_640x640.jpg",
    accentColor: "#888888",
  },
];

export function SalsaClassics() {
  return (
    <section id="menu" className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff0000]/5 via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true, margin: "-80px" }} className="text-center mb-12">
          <div className="inline-block mb-5">
            <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">Timeless Favorites</span>
          </div>
          <h2 className="font-black text-white mb-5 uppercase tracking-tighter leading-none" style={{ fontSize: "clamp(3.5rem, 7vw, 7rem)" }}>
            SALSA <span style={{ color: "#ff0000" }}>CLASSICS</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/55 font-medium max-w-xl mx-auto">Familiar flavors, perfected to the extreme</p>
        </motion.div>
        <BurgerCarousel items={burgers} />
      </div>
    </section>
  );
}
