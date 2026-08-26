import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Alojamientos360 } from "@/app/360/alojamientos/page";

export const metadata: Metadata = buildMetadata({
  title: "Digital concierge for accommodation",
  description:
    "The digital concierge that joins your check-in, answers guests 24/7 and turns your recommendations into a revenue line for your property.",
  path: "/th/360/alojamientos",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
  locale: "th",
});

export default function Page() {
  return <Alojamientos360 locale="th" />;
}
