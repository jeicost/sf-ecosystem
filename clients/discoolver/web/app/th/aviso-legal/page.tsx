import { LegalDoc } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/content/legal";
import { buildMetadata } from "@/lib/seo";

const doc = LEGAL.aviso.en;

export const metadata = buildMetadata({
  title: doc.title,
  description: doc.description,
  path: "/th/aviso-legal",
  locale: "th",
});

export default function Page() {
  return <LegalDoc doc={doc} locale="th" />;
}
