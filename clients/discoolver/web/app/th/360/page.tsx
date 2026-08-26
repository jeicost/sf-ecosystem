import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Home360 } from "@/app/360/page";

export const metadata: Metadata = buildMetadata({
  // NOINDEX hasta que Nirada revise el tailandés en el CMS: no se indexa
  // una página a medio traducir. Quitar esta línea al aprobarla.
  noindex: true,
  title: "discoolver 360 — the platform for tourist destinations",
  description:
    "Marketplace, point of sale, routes, events, voice assistant, signage and Business Intelligence for destinations, accommodation and agencies. Modules from €100/month.",
  path: "/th/360",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
  locale: "th",
});

export default function Page() {
  return <Home360 locale="th" />;
}
