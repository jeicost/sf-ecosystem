import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { GuiasPage } from "@/app/guias/page";

export const metadata: Metadata = buildMetadata({
  // NOINDEX hasta que Nirada revise el tailandés en el CMS: no se indexa
  // una página a medio traducir. Quitar esta línea al aprobarla.
  noindex: true,
  title: "Discoolver — Travel guides written by people who live there",
  description:
    "The best of the year in every city, picked by editors from what local creators recommend. Digital and print, with AI to walk the city.",
  path: "/th/guias",
  locale: "th",
});

export default function Page() {
  return <GuiasPage locale="th" />;
}
