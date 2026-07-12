import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Salsa Burgers Bangkok | The Story Behind Bangkok's Best Wagyu Burger",
  description:
    "Born in Bangkok, Salsa Burgers crafts premium Wagyu burgers with 16 house-made artisan sauces daily. Ghost kitchen in Yan Nawa, Sathorn — delivery via Grab & LINE MAN.",
  keywords: "about Salsa Burgers, Bangkok burger brand, Wagyu burger story, ghost kitchen Bangkok, artisan sauces Bangkok, Salsa Burgers Yan Nawa",
  alternates: { canonical: "/about" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "About Salsa Burgers — Bangkok's Boldest Burger Brand",
    description:
      "The story behind Bangkok's boldest burgers. Wagyu beef, 16 house-made artisan sauces, and Thai-fusion specials delivered across the city.",
    url: "https://www.salsaburgers.com/about",
    images: [{ url: "/images/OG_burger_640x640.jpg", width: 2048, height: 2048, alt: "About Salsa Burgers Bangkok" }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
