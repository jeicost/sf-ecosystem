"use client";

import { motion } from "motion/react";
import { BurgerCarousel } from "./BurgerCarousel";
import { useLanguage } from "@/context/LanguageContext";

const milkshakes = [
  { name: "Vanilla Bomb", description: "Creamy vanilla milkshake made with premium ice cream, whipped cream, caramel syrup", image: "/images/Vanilla_milkshake_640x640.jpg", accentColor: "#f5e6c8" },
  { name: "Choco Overdose", description: "Chocolate shake packed with cocoa and Oreo chunks, whipped cream, chocolate syrup", image: "/images/choco_overdose_640x640.jpg", accentColor: "#3a1a0a" },
  { name: "Strawberry Jam", description: "Strawberry yogurt shake with a natural sweet and fresh finish, whipped cream, strawberry syrup", image: "/images/strawberry_jam_640x640.jpg", accentColor: "#e83a5a" },
  { name: "Awargalp", description: "Dates, pistachio, yogurt, and milk with a touch of honey, strawberry syrup", image: "/images/awar_640x640.jpg", accentColor: "#c8873a" },
  { name: "Banana Caramel", description: "Banana shake with milk and a touch of honey, whipped cream, caramel syrup", image: "/images/banana_caramel_640x640.jpg", accentColor: "#ffd23f" },
  { name: "PB King", description: "Peanut butter shake with a touch of honey and salt, whipped cream, caramel syrup", image: "/images/PB_King_640x640.jpg", accentColor: "#c8873a" },
  { name: "Cookie Monster", description: "Oreo and chocolate chip shake, whipped cream, oreo powder", image: "/images/cookie_monster_640x640.jpg", accentColor: "#3a7bd5" },
  { name: "Green Detox", description: "Spinach, green apple, and pineapple with a touch of lime", image: "/images/green_detox_640x640.jpg", accentColor: "#4caf50" },
  { name: "Berry Boost", description: "Berries mixed with yogurt for a refreshing boost", image: "/images/berry_640x640.jpg", accentColor: "#e83a5a" },
];

const smoothies = [
  { name: "Watermelon", description: "Fresh watermelon, sweet, juicy, refreshing", image: "/images/watermelon_1200x1200.jpg", accentColor: "#ff4466" },
  { name: "Mango", description: "Fresh mango, aromatic, sweet, firm texture", image: "/images/mango.jpg", accentColor: "#ff9900" },
  { name: "Pineapple", description: "Fresh pineapple, sweet and tangy, juicy and refreshing", image: "/images/pineapple.jpg", accentColor: "#ffd23f" },
];

const desserts = [
  { name: "American Brownie", description: "Rich, dense, fudgy chocolate", image: "/images/brownie_1200x1200.jpg", accentColor: "#3a1a0a" },
  { name: "Gold Butter Cookie", description: "Real Brown Butter, French Wheat Flour 45g", image: "/images/gold_butter_cookie_640x640.jpg", accentColor: "#c8a951" },
  { name: "Dark Chocolate Cookie", description: "Real Brown Butter, French Wheat Flour, Real Dark Chocolate 70%, weighs about 55–60g", image: "/images/dark_choco_cookie_640x640.jpg", accentColor: "#2a1000" },
  { name: "Lotus Biscof", description: "Biscoff biscuits x Biscoff spread, weight 60g", image: "/images/lotus_biscof_cookie_640x640.jpg", accentColor: "#c8873a" },
];

function SectionHeader({ eyebrow, title, highlight, subtitle, highlightColor = "#ffd23f" }: {
  eyebrow: string; title: string; highlight?: string; subtitle: string; highlightColor?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="text-center mb-12">
      <div className="inline-block mb-6">
        <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">{eyebrow}</span>
      </div>
      <h2 className="text-6xl sm:text-7xl md:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
        {title}{highlight && <span style={{ color: highlightColor }}> {highlight}</span>}
      </h2>
      <p className="text-xl sm:text-2xl text-white/60 font-medium max-w-2xl mx-auto">{subtitle}</p>
    </motion.div>
  );
}

export function ShakesAndDesserts() {
  const { t } = useLanguage();
  const sd = t.shakesAndDesserts;

  return (
    <>
      {/* Milkshakes */}
      <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ff0000]/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
          <SectionHeader eyebrow={sd.milkshakes.eyebrow} title={sd.milkshakes.title} highlight={sd.milkshakes.highlight} subtitle={sd.milkshakes.sub} />
          <BurgerCarousel items={milkshakes} />
        </div>
      </section>

      {/* Smoothies */}
      <section className="relative py-10 sm:py-12 bg-[#0d0d0d] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
          <SectionHeader eyebrow={sd.smoothies.eyebrow} title={sd.smoothies.title} highlight={sd.smoothies.highlight} subtitle={sd.smoothies.sub} highlightColor="#4caf50" />
          <BurgerCarousel items={smoothies} />
        </div>
      </section>

      {/* Desserts */}
      <section className="relative py-10 sm:py-12 bg-[#0a0a0a] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
          <SectionHeader eyebrow={sd.desserts.eyebrow} title={sd.desserts.title} highlight={sd.desserts.highlight} subtitle={sd.desserts.sub} highlightColor="#ff0000" />
          <BurgerCarousel items={desserts} />
        </div>
      </section>
    </>
  );
}
