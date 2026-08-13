import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Agencias360 } from "@/app/360/agencias/page";

export const metadata: Metadata = buildMetadata({
  title: "Agencies, DMCs and inbound operators",
  description:
    "We digitize the destination's local catalog and give you a marketplace and point of sale to sell it. Net rates for the trade channel.",
  path: "/en/360/agencias",
  image: "/assets/360/og-360.png",
  siteName: "discoolver 360",
  locale: "en",
  // Espejo de /360/agencias, que sigue noindex hasta el piloto con una DMC.
  // Faltaba aquí: quedarse fuera del sitemap no impide que Google la encuentre
  // por un enlace, así que la versión inglesa era indexable y la española no.
  noindex: true,
});

export default function Page() {
  return <Agencias360 locale="en" />;
}
