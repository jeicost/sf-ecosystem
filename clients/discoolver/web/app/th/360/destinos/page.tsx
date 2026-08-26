import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Destinos360 } from "@/app/360/destinos/page";

export const metadata: Metadata = buildMetadata({
  // NOINDEX hasta que Nirada revise el tailandés en el CMS: no se indexa
  // una página a medio traducir. Quitar esta línea al aprobarla.
  noindex: true,
  title: "Solutions for tourist destinations",
  description:
    "SaaS platform for city councils, tourism boards and DMOs: redistribute visitor flow, own your destination's data and monetize local commerce.",
  path: "/th/360/destinos",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
  locale: "th",
});

export default function Page() {
  return <Destinos360 locale="th" />;
}
