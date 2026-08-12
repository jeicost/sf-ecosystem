import { LegalDoc } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/content/legal";
import { buildMetadata } from "@/lib/seo";

const doc = LEGAL.cookies.es;

export const metadata = buildMetadata({
  title: doc.title,
  description: doc.description,
  path: "/cookies",
  locale: "es",
});

export default function Page() {
  return <LegalDoc doc={doc} locale="es" />;
}
