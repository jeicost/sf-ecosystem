import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Home360 } from "@/app/360/page";

export const metadata: Metadata = buildMetadata({
  title: "discoolver 360 — the platform for tourist destinations",
  description:
    "Marketplace, point of sale, routes, events, voice assistant, signage and Business Intelligence for destinations, accommodation and agencies. Modules from €100/month.",
  path: "/en/360",
  image: "/assets/360/og-360.png",
  siteName: "discoolver 360",
  locale: "en",
  noindex: true,
});

export default function Page() {
  return <Home360 locale="en" />;
}
