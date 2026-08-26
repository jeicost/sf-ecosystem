import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { InfluencersPage } from "@/app/influencers/page";

export const metadata: Metadata = buildMetadata({
  // NOINDEX hasta que Nirada revise el tailandés en el CMS: no se indexa
  // una página a medio traducir. Quitar esta línea al aprobarla.
  noindex: true,
  title: "Publish your guide — Discoolver for creators",
  description:
    "We edit your city guide with you: it ships with your name and you earn from every sale. Just starting? Send us your best recommendation on video.",
  path: "/th/influencers",
  locale: "th",
});

export default function Page() {
  return <InfluencersPage locale="th" />;
}
