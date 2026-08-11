import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { HomePage } from "@/app/page";

export const metadata: Metadata = buildMetadata({
  title: "Discoolver — Travel guides curated from creators",
  description:
    "The best of the year in every city, edited into a guide you'll want to keep: human curation of creators, digital and print, with AI to walk the city.",
  path: "/en",
  locale: "en",
  // El inglés sale con noindex hasta que Carlos revise la traducción.
  noindex: true,
});

export default function Page() {
  return <HomePage locale="en" />;
}
