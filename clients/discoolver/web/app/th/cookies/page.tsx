import { LegalDoc } from "@/components/legal/LegalDoc";
import { LEGAL } from "@/lib/content/legal";
import { buildMetadata } from "@/lib/seo";

const doc = LEGAL.cookies.en;

export const metadata = buildMetadata({
  title: doc.title,
  description: doc.description,
  path: "/th/cookies",
  locale: "th",
});

export default function Page() {
  return <LegalDoc doc={doc} locale="th" />;
}
