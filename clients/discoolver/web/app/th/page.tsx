import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getPlatformFacts, formatoMil } from "@/lib/platform-stats";
import { AppHomePage } from "@/app/page";

/**
 * Same live source as the hero and the closing block — see the Spanish home for
 * why: hand-written copy claimed a city with zero published places.
 */
export async function generateMetadata(): Promise<Metadata> {
  const hechos = await getPlatformFacts();
  const ciudades = hechos.ciudadesLista;
  const lista =
    ciudades.length > 1 ? `${ciudades.slice(0, -1).join(", ")} and ${ciudades[ciudades.length - 1]}` : ciudades[0] ?? "";
  const descripcion = hechos.ok
    ? `Places picked by editors from what social media recommends. ${formatoMil(hechos.totalRedondeado, "en")} published in ${lista}, on a map, a route and a calendar.`
    : "Places picked by editors from what social media recommends every day, on a map, a route and a calendar to walk the city.";
  return buildMetadata({
    title: "Discoolver — The best of social media, picked by editors",
    description: descripcion,
    path: "/th",
    locale: "th",
  });
}

export default function Page() {
  return <AppHomePage locale="th" />;
}
