"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BurgerCarousel } from "@/components/BurgerCarousel";

/* ─── Menu data ─────────────────────────────────────────────── */

const menuData = [
  {
    slug: "appetizers",
    label: "APPETIZERS",
    count: "6 ITEMS",
    items: [
      { name: "Tiger Wings", description: "Salsa Sauce, Sesame Seeds, Hot Sriracha, BBQ Sauce", image: "/images/tiger_wings_640x640.jpg", accentColor: "#ff4400" },
      { name: "Onion Rings", description: "Crispy Onion Rings, Lightly Breaded and Golden Fried, Served with Garlic Dip", image: "/images/onion_rings_640x640.jpg", accentColor: "#ffd23f" },
      { name: "Pickle Sticks", description: "Crispy Fried Sliced Pickles, Tossed in Smoky Rub, Garlic Mayo", image: "/images/pickle_sticks_640x640.jpg", accentColor: "#4caf50" },
      { name: "Corn Ribs", description: "Deep-Fried Corn Ribs, Smoky Rub, Cheese Dip, Lime Wedges", image: "/images/corn_ribs_640x640.jpg", accentColor: "#ffd23f" },
      { name: "Avocado Fries", description: "Breaded Avocado Wedges, Honey Mustard Mayo", image: "/images/avocado_640x640.jpg", accentColor: "#4caf50" },
      { name: "Salsa Nachos", description: "Corn Chips, Melted Cheese, Pico de Gallo, Fresh Guacamole & Jalapeños", image: "/images/nachos_640x640.jpg", accentColor: "#ff9900" },
    ],
  },
  {
    slug: "salsa-fries",
    label: "SALSA FRIES",
    count: "4 SIDES",
    items: [
      { name: "Salsa Dusted Fries", description: "Pastrami, Cheddar, Pickled Jalapeños, Pico de Gallo", image: "/images/dusted_fries_640x640.jpg", accentColor: "#ffd23f" },
      { name: "Truffle Parmesan", description: "Crispy Fries, Bacon Bits, Truffle Oil, Parmesan, Truffle Mayo", image: "/images/cheese_bomb_640x640.jpg", accentColor: "#888" },
      { name: "Cheese Bomb", description: "Melted Cheddar, Crispy Bacon Bits", image: "/images/truffle_parmesan_640x640.jpg", accentColor: "#ff9900" },
      { name: "Triple Spice Fries", description: "Classic Fries, Salt, Paprika, Cracked Black Pepper", image: "/images/triple_fries_640x640.jpg", accentColor: "#ff6b00" },
    ],
  },
  {
    slug: "salsa-classics",
    label: "SALSA CLASSICS",
    count: "5 BURGERS",
    items: [
      { name: "OG Cheeseburger", description: "Wagyu Beef Patty, Cheddar Cheese, Crispy Shallots, House Pickles, House Mayo", image: "/images/OG_burger_640x640.jpg", accentColor: "#ff0000" },
      { name: "BBQ Beats", description: "Wagyu Beef Patty, Garlic Mayo, Cheddar, Pickles & Smoky BBQ", image: "/images/BBQ_beats_640x640.jpg", accentColor: "#ff6b00" },
      { name: "Crunchy Chicken", description: "Fried Chicken Breast, Cheddar Cheese, Blue Cheese Sauce, Lettuce & Garlic Mayo", image: "/images/Crunchy_chicken_640x640.jpg", accentColor: "#ff8c00" },
      { name: "Yellow Jacket", description: "Wagyu Beef Patty, Cheddar, Arugula, Caramelized Onions & Honey Mustard", image: "/images/Yellow_jacket_640x640.jpg", accentColor: "#ffd23f" },
      { name: "Truffle Flow", description: "Wagyu Beef, Melted Mozzarella, Black Truffle Paste & Arugula", image: "/images/truffle_flow_640x640.jpg", accentColor: "#888888" },
    ],
  },
  {
    slug: "local-flavors",
    label: "LOCAL FLAVORS",
    count: "3 BURGERS",
    items: [
      { name: "Khao Soi", description: "Khao Soi Glaze, Coriander, Crispy Egg Noodles, Pickled Shallots", image: "/images/khaosoi_burger_640x640.jpg", accentColor: "#ffd23f" },
      { name: "Tom Yum", description: "Tom Yum Cream, Tomato, Crispy Shrimps, Mushroom & Pickled Shallots", image: "/images/Tomyam_640x640.jpg", accentColor: "#ff4400" },
      { name: "The Holy Basil", description: "Fried Holy Basil, Crispy Fried Egg, Garlic-Chili Rub", image: "/images/holy_basil_640x640.jpg", accentColor: "#00aa44" },
    ],
  },
  {
    slug: "fusion-burgers",
    label: "FUSION BURGERS",
    count: "3 BURGERS",
    items: [
      { name: "K-Spice Burger", description: "Gochujang Sauce, 2 Crispy Bacon, Kimchi, Pickled Shallots, Fresh Lettuce", image: "/images/K-spice_640x640.jpg", accentColor: "#cc0000" },
      { name: "Miso Onsen", description: "Miso Onion Jam, Onsen Egg, House Pickles, Nori Powder", image: "/images/miso_onsen_640x640.jpg", accentColor: "#f5c842" },
      { name: "Mala Burger", description: "Szechuan Mala Glaze, Crispy Lotus Root, Shredded Iceberg", image: "/images/mala_640x640.jpg", accentColor: "#ff2200" },
    ],
  },
  {
    slug: "salsa-deluxe",
    label: "SALSA DELUXE",
    count: "3 ITEMS",
    items: [
      { name: "Lobster Burger", description: "Grilled Lobster, Premium Beef Patty, Truffle Mayo, Chives, Lime Butter", image: "/images/lobster_640x640.jpg", accentColor: "#ff4400" },
      { name: "Dry-Aged Ribeye Steak Burger", description: "Sliced Ribeye, Premium Beef Patty, Caramelized Onion, Cheddar, Arugula, Tomato, Garlic Aioli", image: "/images/dry-aged_ribeye_640x640.jpg", accentColor: "#8b1a1a" },
      { name: "Premium Foie Burger", description: "Seared Foie Gras over Premium Beef Patty, Onion Jam, Balsamic Glaze, Arugula", image: "/images/foie_640x640.jpg", accentColor: "#c8a951" },
    ],
  },
  {
    slug: "milkshakes",
    label: "MILKSHAKES",
    count: "9 SHAKES",
    items: [
      { name: "Vanilla Bomb", description: "Creamy vanilla milkshake made with premium ice cream, whipped cream, caramel syrup", image: "/images/Vanilla_milkshake_640x640.jpg", accentColor: "#f5e6c8" },
      { name: "Choco Overdose", description: "Chocolate shake packed with cocoa and Oreo chunks, whipped cream, chocolate syrup", image: "/images/choco_overdose_640x640.jpg", accentColor: "#3a1a0a" },
      { name: "Strawberry Jam", description: "Strawberry yogurt shake with a natural sweet and fresh finish, whipped cream, strawberry syrup", image: "/images/strawberry_jam_640x640.jpg", accentColor: "#e83a5a" },
      { name: "Awar Galb", description: "Dates, pistachio, yogurt, and milk with a touch of honey, strawberry syrup", image: "/images/awar_640x640.jpg", accentColor: "#c8873a" },
      { name: "Banana Caramel", description: "Banana shake with milk and a touch of honey, whipped cream, caramel syrup", image: "/images/banana_caramel_640x640.jpg", accentColor: "#ffd23f" },
      { name: "PB King", description: "Peanut butter shake with a touch of honey and salt, whipped cream, caramel syrup", image: "/images/PB_King_640x640.jpg", accentColor: "#c8873a" },
      { name: "Cookie Monster", description: "Oreo and chocolate chip shake, whipped cream, oreo powder", image: "/images/cookie_monster_640x640.jpg", accentColor: "#3a7bd5" },
      { name: "Green Detox", description: "Spinach, green apple, and pineapple with a touch of lime", image: "/images/green_detox_640x640.jpg", accentColor: "#4caf50" },
      { name: "Berry Boost", description: "Berries mixed with yogurt for a refreshing boost", image: "/images/berry_640x640.jpg", accentColor: "#e83a5a" },
    ],
  },
  {
    slug: "smoothies",
    label: "SMOOTHIES",
    count: "3 ITEMS",
    items: [
      { name: "Watermelon", description: "Fresh watermelon, sweet, juicy, refreshing", image: "/images/watermelon_1200x1200.jpg", accentColor: "#ff4466" },
      { name: "Mango", description: "Fresh mango, aromatic, sweet, firm texture", image: "/images/mango.jpg", accentColor: "#ff9900" },
      { name: "Pineapple", description: "Fresh pineapple, sweet and tangy, juicy and refreshing", image: "/images/pineapple.jpg", accentColor: "#ffd23f" },
    ],
  },
  {
    slug: "desserts",
    label: "DESSERTS",
    count: "4 ITEMS",
    items: [
      { name: "American Brownie", description: "Classic Chocolate Brownie, Rich and Moist, Perfectly Baked", image: "/images/brownie_1200x1200.jpg", accentColor: "#3a1a0a" },
      { name: "Gold Butter Cookie", description: "Real Brown Butter, French Wheat Flour 45g", image: "/images/gold_butter_cookie_640x640.jpg", accentColor: "#c8a951" },
      { name: "Dark Chocolate Cookie", description: "Real Brown Butter, French Wheat Flour, Real Dark Chocolate 70%", image: "/images/dark_choco_cookie_640x640.jpg", accentColor: "#2a1000" },
      { name: "Lotus Biscof", description: "Biscoff biscuits x Biscoff spread", image: "/images/lotus_biscof_cookie_640x640.jpg", accentColor: "#c8873a" },
    ],
  },
];

/* ─── Accordion item ─────────────────────────────────────────── */

function AccordionItem({
  category,
  isOpen,
  onToggle,
}: {
  category: (typeof menuData)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll into view when opened via hash or click
  useEffect(() => {
    if (isOpen && ref.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [isOpen]);

  return (
    <div ref={ref} id={category.slug} className="border-b border-white/10">
      {/* Row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 px-1 group transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          {/* Active indicator */}
          <span
            className="w-2.5 h-2.5 rounded-full flex-none transition-all duration-300"
            style={{ backgroundColor: isOpen ? "#ff0000" : "rgba(255,255,255,0.2)" }}
          />
          <span
            className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight transition-colors duration-200"
            style={{ color: isOpen ? "#ff0000" : "rgba(255,255,255,0.85)" }}
          >
            {category.label}
          </span>
          <span
            className="hidden sm:inline text-xs font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border transition-colors duration-200"
            style={
              isOpen
                ? { borderColor: "#ff0000", color: "#ff0000", backgroundColor: "rgba(255,0,0,0.08)" }
                : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)", backgroundColor: "transparent" }
            }
          >
            {category.count}
          </span>
        </div>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-white/40 group-hover:text-white/80 transition-colors text-2xl font-thin leading-none select-none"
        >
          +
        </motion.span>
      </button>

      {/* Expandable carousel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }, opacity: { duration: 0.25 } }}
            style={{ overflow: "hidden" }}
          >
            <div className="pb-8 pt-2">
              <BurgerCarousel items={category.items} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function MenuPage() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // On mount: open accordion only if URL has a matching hash — otherwise start collapsed
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && menuData.some((c) => c.slug === hash)) {
      setOpenSlug(hash);
    }
  }, []);

  const toggle = (slug: string) => {
    setOpenSlug((prev) => (prev === slug ? null : slug));
    // Update URL hash without scrolling
    history.replaceState(null, "", `#${slug}`);
  };

  return (
    <main className="bg-[#0a0a0a]">
      <Nav />

      {/* Hero header */}
      <section className="relative pt-32 pb-12 sm:pb-16 overflow-hidden bg-black">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff0000]/8 via-black to-black pointer-events-none" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#ff0000] rounded-full blur-[180px] pointer-events-none"
        />

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-block mb-5">
              <span className="text-[#ffd23f] text-xs font-black uppercase tracking-[0.3em] px-5 py-2 border border-[#ffd23f]/30 rounded-full">
                Full Menu
              </span>
            </div>
            <h1
              className="font-black text-white uppercase tracking-tighter leading-[0.88] mb-5"
              style={{ fontSize: "clamp(4rem, 10vw, 11rem)" }}
            >
              THE <span style={{ color: "#ff0000" }}>MENU</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/50 font-medium max-w-xl mx-auto">
              Every craving, covered.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Accordion */}
      <section className="relative bg-[#0a0a0a] pb-20">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="border-t border-white/10">
            {menuData.map((category) => (
              <AccordionItem
                key={category.slug}
                category={category}
                isOpen={openSlug === category.slug}
                onToggle={() => toggle(category.slug)}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
