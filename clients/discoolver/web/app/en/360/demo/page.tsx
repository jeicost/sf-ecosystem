import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Demo360 } from "@/app/360/demo/page";

export const metadata: Metadata = buildMetadata({
  title: "Book a demo",
  description:
    "Half an hour with the platform running and the Ronda deployment open. You leave with a proposal: which module to start with and what it costs.",
  path: "/en/360/demo",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
  locale: "en",
});

export default function Page(props: { searchParams: Promise<{ v?: string }> }) {
  return <Demo360 {...props} locale="en" />;
}
