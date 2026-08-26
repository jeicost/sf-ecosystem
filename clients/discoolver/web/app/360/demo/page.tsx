import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { buildMetadata } from "@/lib/seo";
import { defaultDemo360Content } from "@/lib/content/b360/demo";
import { defaultDemo360Content as defaultDemo360ContentEn } from "@/lib/content/b360/en/demo";
import { withLocale, type Locale } from "@/lib/i18n";
import { pageContent, slugFor } from "@/lib/cms-pages";
import { DemoForm } from "@/components/b360/DemoForm";
import { Section } from "@/components/b360/Bits";

export const metadata: Metadata = buildMetadata({
  title: "Pedir una demo",
  description:
    "Media hora con la plataforma funcionando y el despliegue de Ronda abierto. Salimos con una propuesta de por qué módulo empezar y qué cuesta.",
  path: "/360/demo",
  image: "/assets/360/og-360.jpg",
  siteName: "discoolver 360",
});

const VERTICAL_LABELS: Record<string, string> = {
  destino: "Destino · ayuntamiento, patronato o DMO",
  alojamiento: "Alojamiento · hotel, hostal o apartamentos",
  agencia: "Agencia · DMC, touroperador o receptivo",
};

export async function Demo360({
  searchParams,
  locale = "es",
}: {
  searchParams: Promise<{ v?: string }>;
  locale?: Locale;
}) {
  const { isEnabled: isDraft } = await draftMode();
  const { v } = await searchParams;
  const defaultVertical = VERTICAL_LABELS[v ?? ""] ?? "";
  const slug = slugFor("360-demo", locale);
  const fallback = locale === "es" ? defaultDemo360Content : defaultDemo360ContentEn;
  const c = await pageContent(slug, fallback, isDraft);
  const K = (k: string) => c[k as keyof typeof c] as string;

  return (
    <Section>
      <div className="split" style={{ paddingTop: 40 }}>
        <div>
          <span className="label">{c.eyebrow}</span>
          <h1 className="h-hero" style={{ fontSize: "clamp(32px,4.6vw,58px)" }}>
            {c.title}
          </h1>
          <p className="lead">{c.lead}</p>
          <ul className="ticks" style={{ marginTop: 26 }}>
            {[1, 2, 3, 4].map((n) => (
              <li key={n}>
                <strong>{K(`tick_${n}_label`)}</strong> {K(`tick_${n}_texto`)}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 30,
              paddingTop: 24,
              borderTop: "1px solid var(--b-line-soft)",
              display: "grid",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "var(--b-mono)", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--b-slate)" }}>
              {c.contacto_label}
            </span>
            <a href={`mailto:${c.contacto_email}`} style={{ fontFamily: "var(--b-mono)", fontSize: 13.5, color: "var(--b-primary)" }}>
              {c.contacto_email}
            </a>
            <span style={{ fontFamily: "var(--b-mono)", fontSize: 13, color: "var(--b-slate)" }}>
              {c.contacto_direccion}
            </span>
          </div>
        </div>

        <div className="card" style={{ borderColor: "var(--b-line)", padding: 30 }}>
          <DemoForm locale={locale} defaultVertical={defaultVertical} />
        </div>
      </div>
    </Section>
  );
}

export default function Page(props: { searchParams: Promise<{ v?: string }> }) {
  return <Demo360 {...props} locale="es" />;
}
