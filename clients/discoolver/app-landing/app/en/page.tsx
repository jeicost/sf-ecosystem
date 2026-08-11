import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { HomePage } from "@/app/page";

export const metadata: Metadata = buildMetadata({
  title: "Discoolver — Discover your city before everyone else",
  description:
    "Places recommended by real local creators, reviewed by editors and powered by AI. Madrid, Barcelona and Málaga now open — enter today on the web.",
  path: "/en",
  // El inglés sale con noindex hasta que Carlos revise la traducción.
  noindex: true,
});

export default function Page() {
  return <HomePage locale="en" />;
}
