import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Demo360 } from "@/app/360/demo/page";

export const metadata: Metadata = buildMetadata({
  // NOINDEX hasta que Nirada revise el tailandés en el CMS: no se indexa
  // una página a medio traducir. Quitar esta línea al aprobarla.
  noindex: true,
  title: "Book a demo",
  description:
    "Half an hour with the platform running and the Ronda deployment open. You leave with a proposal: which module to start with and what it costs.",
  path: "/th/360/demo",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
  locale: "th",
});

export default function Page(props: { searchParams: Promise<{ v?: string }> }) {
  return <Demo360 {...props} locale="th" />;
}
