import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { GuiasPage } from "@/app/guias/page";

export const metadata: Metadata = buildMetadata({
  title: "Discoolver — Travel guides curated from creators",
  description:
    "The best of the year in every city, edited into a guide you'll want to keep: human curation of creators, digital and print, with AI to walk the city.",
  path: "/en/guias",
  locale: "en",
});

export default function Page() {
  return <GuiasPage locale="en" />;
}
