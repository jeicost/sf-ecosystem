import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { loadCmsSections, section, mergeContent } from "@/lib/cms-pages";
import { defaultInfluencersContent } from "@/lib/content/influencers";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { InfluencerHero } from "@/components/sections/influencers/InfluencerHero";
import { InfluencerValueProps } from "@/components/sections/influencers/InfluencerValueProps";
import { InfluencerTools } from "@/components/sections/influencers/InfluencerTools";
import { InfluencerCriteria } from "@/components/sections/influencers/InfluencerCriteria";
import { InfluencerTerritory } from "@/components/sections/influencers/InfluencerTerritory";
import { InfluencerTestimonials } from "@/components/sections/influencers/InfluencerTestimonials";
import { InfluencerForm } from "@/components/sections/influencers/InfluencerForm";
import { InfluencerDownloadables } from "@/components/sections/influencers/InfluencerDownloadables";

export const metadata: Metadata = buildMetadata({
  title: "Discoolver para Creators — Not a Tourist. Not a Follower.",
  description:
    "Únete al programa de creators de Discoolver: monetiza tus rutas, diseña tu territorio y llega a viajeros de todo el mundo. Acceso por invitación.",
  path: "/influencers",
});

export default function InfluencersPage() {
  const cms = loadCmsSections("influencers");
  const content = mergeContent(defaultInfluencersContent, section(cms, "content"));

  return (
    <>
      <Nav />
      <main>
        <InfluencerHero content={content} />
        <InfluencerValueProps content={content} />
        <InfluencerTools content={content} />
        <InfluencerCriteria content={content} />
        <InfluencerTerritory content={content} />
        <InfluencerTestimonials content={content} />
        <InfluencerForm content={content} />
        <InfluencerDownloadables content={content} />
      </main>
      <Footer />
    </>
  );
}
