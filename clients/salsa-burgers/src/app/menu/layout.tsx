import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Salsa Burgers Bangkok | Wagyu Burgers, Local Flavors & Fusion",
  description:
    "Full Salsa Burgers menu: Wagyu smash burgers, Local Flavors (Khao Soi, Tom Yum, Holy Basil), Fusion Burgers (K-Spice, Miso Onsen, Mala), 16 artisan sauces, fries, shakes and desserts. Order via Grab or LINE MAN.",
  keywords: "Salsa Burgers menu, Wagyu burger menu Bangkok, Khao Soi burger, Tom Yum burger, Mala burger Bangkok, artisan sauces menu, burger delivery Bangkok",
  alternates: { canonical: "/menu" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Salsa Burgers Bangkok — Full Menu",
    description:
      "Wagyu burgers, Local Flavors & Fusion, 16 artisan sauces, fries, shakes. Delivery via Grab & LINE MAN across Bangkok.",
    url: "https://www.salsaburgers.com/menu",
    images: [{ url: "/images/OG_burger_640x640.jpg", width: 2048, height: 2048, alt: "Salsa Burgers Bangkok Menu" }],
  },
};

const menuSchema = {
  "@context": "https://schema.org",
  "@type": "Menu",
  name: "Salsa Burgers — Full Menu",
  url: "https://www.salsaburgers.com/menu",
  hasMenuSection: [
    {
      "@type": "MenuSection",
      name: "Salsa Classics",
      description: "Wagyu smash burgers with 16 house-made artisan sauces",
      hasMenuItem: [
        { "@type": "MenuItem", name: "OG Cheeseburger", description: "Wagyu Beef Patty, Cheddar Cheese, Crispy Shallots, House Pickles, House Mayo", offers: { "@type": "Offer", price: "420", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "BBQ Beats", description: "Wagyu Beef Patty, Garlic Mayo, Cheddar, Pickles & Smoky BBQ", offers: { "@type": "Offer", price: "480", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "Truffle Flow", description: "Wagyu Beef, Melted Mozzarella, Black Truffle Paste & Arugula", offers: { "@type": "Offer", price: "500", priceCurrency: "THB" } },
      ],
    },
    {
      "@type": "MenuSection",
      name: "Local Flavors",
      description: "Thai-fusion burgers inspired by classic Thai flavors",
      hasMenuItem: [
        { "@type": "MenuItem", name: "Khao Soi", description: "Khao Soi Glaze, Coriander, Crispy Egg Noodles, Pickled Shallots", offers: { "@type": "Offer", price: "500", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "Tom Yum", description: "Tom Yum Cream, Tomato, Crispy Shrimps, Mushroom & Pickled Shallots", offers: { "@type": "Offer", price: "500", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "The Holy Basil", description: "Fried Holy Basil, Crispy Fried Egg, Garlic-Chili Rub", offers: { "@type": "Offer", price: "500", priceCurrency: "THB" } },
      ],
    },
    {
      "@type": "MenuSection",
      name: "Fusion Burgers",
      hasMenuItem: [
        { "@type": "MenuItem", name: "K-Spice Burger", description: "Gochujang Sauce, Crispy Bacon, Kimchi, Pickled Shallots", offers: { "@type": "Offer", price: "520", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "Miso Onsen", description: "Miso Onion Jam, Onsen Egg, House Pickles, Nori Powder", offers: { "@type": "Offer", price: "520", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "Mala Burger", description: "Szechuan Mala Glaze, Crispy Lotus Root, Shredded Iceberg", offers: { "@type": "Offer", price: "520", priceCurrency: "THB" } },
      ],
    },
    {
      "@type": "MenuSection",
      name: "Salsa Deluxe",
      hasMenuItem: [
        { "@type": "MenuItem", name: "Lobster Burger", description: "Grilled Lobster, Premium Beef Patty, Truffle Mayo, Chives, Lime Butter", offers: { "@type": "Offer", price: "2800", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "Dry-Aged Ribeye Steak Burger", offers: { "@type": "Offer", price: "1400", priceCurrency: "THB" } },
        { "@type": "MenuItem", name: "Premium Foie Burger", description: "Seared Foie Gras, Onion Jam, Balsamic Glaze, Arugula", offers: { "@type": "Offer", price: "950", priceCurrency: "THB" } },
      ],
    },
  ],
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuSchema) }}
      />
      {children}
    </>
  );
}
