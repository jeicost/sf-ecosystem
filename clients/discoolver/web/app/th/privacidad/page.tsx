import { LegalDoc } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/content/legal";
import { buildMetadata } from "@/lib/seo";

const doc = LEGAL.privacidad.en;

export const metadata = buildMetadata({
  // NOINDEX hasta que Nirada revise el tailandés en el CMS: no se indexa
  // una página a medio traducir. Quitar esta línea al aprobarla.
  noindex: true,
  title: doc.title,
  description: doc.description,
  path: "/th/privacidad",
  locale: "th",
});

export default function Page() {
  return <LegalDoc doc={doc} locale="th" />;
}
