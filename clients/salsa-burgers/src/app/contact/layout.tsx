import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Salsa Burgers Bangkok | +66 82 536 6653 | Grab & LINE MAN",
  description:
    "Contact Salsa Burgers Bangkok. Order via Grab or LINE MAN, call +66 82 536 6653, or send us a message. 507 Sathu Pradit Rd, Yan Nawa, Bangkok. Open daily 11:00–23:30.",
  keywords: "contact Salsa Burgers Bangkok, Salsa Burgers phone number, burger delivery Bangkok contact, Salsa Burgers address, Yan Nawa burger restaurant",
  alternates: { canonical: "/contact" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Contact Salsa Burgers Bangkok",
    description:
      "Order Wagyu burgers delivered to your door via Grab or LINE MAN. Call us or send a message — we're open daily 11:00–23:30.",
    url: "https://www.salsaburgers.com/contact",
    images: [{ url: "/images/OG_burger_640x640.jpg", width: 2048, height: 2048, alt: "Contact Salsa Burgers Bangkok" }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
