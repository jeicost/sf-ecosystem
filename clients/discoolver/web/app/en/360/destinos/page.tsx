import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Destinos360 } from "@/app/360/destinos/page";

export const metadata: Metadata = buildMetadata({
  title: "Solutions for tourist destinations",
  description:
    "SaaS platform for city councils, tourism boards and DMOs: redistribute visitor flow, own your destination's data and monetize local commerce.",
  path: "/en/360/destinos",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
  locale: "en",
});

export default function Page() {
  return <Destinos360 locale="en" />;
}
