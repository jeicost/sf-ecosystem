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
  // Abierta a Google el 17-ago-2026, a la vez que la española: las dos
  // versiones van siempre juntas o el x-default apunta a una página bloqueada.
});

export default function Page() {
  return <Agencias360 locale="en" />;
}
