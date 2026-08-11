import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { InfluencersPage } from "@/app/influencers/page";

export const metadata: Metadata = buildMetadata({
  title: "Publish your guide — Discoolver for creators",
  description:
    "We edit your city guide with you: it ships with your name and you earn from every sale. Just starting? Send us your best recommendation on video.",
  path: "/en/influencers",
  locale: "en",
  noindex: true,
});

export default function Page() {
  return <InfluencersPage locale="en" />;
}
