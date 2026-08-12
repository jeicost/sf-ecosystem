import { LegalDoc } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/content/legal";
import { buildMetadata } from "@/lib/seo";

const doc = LEGAL.privacidad.en;

export const metadata = buildMetadata({
  title: doc.title,
  description: doc.description,
  path: "/en/privacidad",
  locale: "en",
});

export default function Page() {
  return <LegalDoc doc={doc} locale="en" />;
}
