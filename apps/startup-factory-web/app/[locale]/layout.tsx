import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans, Sarabun } from "next/font/google";
import Script from "next/script";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const DOMAIN = "https://startupsfactory.es";

export const revalidate = 3600;

// ── Read CMS data at build time ──────────────────────────────
function getCmsData() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pages    = require("../../content/pages.json");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const settings = require("../../content/settings.json");
    return { pages, settings };
  } catch { return { pages: {}, settings: {} }; }
}

const { pages: cmsPages, settings: cmsSettings } = getCmsData();
const homePage = cmsPages?.home ?? {};

// ── Schema.org — CMS-driven, falls back to defaults ─────────
const schemaType = homePage.schema?.type || "Organization";
const orgSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": schemaType,
  name:        homePage.schema?.name        || "Startup Factory",
  description: homePage.schema?.description || "AI agency and venture studio building products, teams and systems for ambitious founders.",
  url:         DOMAIN,
  ...(homePage.schema?.telephone && { telephone: homePage.schema.telephone }),
  ...(homePage.schema?.address && {
    address: {
      "@type":         "PostalAddress",
      streetAddress:   homePage.schema.address,
      addressLocality: homePage.schema.city    || "Bangkok",
      addressCountry:  homePage.schema.country || "TH",
    },
  }),
  sameAs: homePage.schema?.sameAs
    ? homePage.schema.sameAs.split(",").map((s: string) => s.trim()).filter(Boolean)
    : ["https://www.instagram.com/startups.factory"],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Startup Factory",
  url: "https://startupsfactory.es",
  logo: "https://startupsfactory.es/logo-white.svg",
  description:
    "El venture builder hispanohablante que evalúa proyectos de forma individual, trabaja con el <10% con potencial real y ofrece equipo, estrategia e IA a medida.",
  foundingLocation: {
    "@type": "Place",
    name: "Bangkok, Thailand",
  },
  founder: {
    "@type": "Person",
    name: "Carlos Jacoste",
    url: "https://www.linkedin.com/in/carlosjacoste/",
    jobTitle: "Co-founder & CEO",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    url: "https://startupsfactory.es/es/aplica",
  },
  sameAs: [
    "https://www.instagram.com/_startupsfactory",
    "https://www.linkedin.com/in/carlosjacoste/",
  ],
};

// ── Fonts ─────────────────────────────────────────────────────
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ── Metadata ──────────────────────────────────────────────────
// Merged from the former app/layout.tsx (root) + this layout.
// openGraph/twitter keep this layout's values because, as the deeper
// segment, they were the ones actually resolved in production.
const seoTitle       = homePage.seoTitle       || "Startups Factory | AI Agency & Venture Studio";
const seoDescription = homePage.seoDescription || "Fábrica de equipos para proyectos. Montamos el squad exacto que necesitas — por horas, por sprint o como partner — y lo ponemos a ejecutar contigo.";

export const metadata: Metadata = {
  title:       seoTitle,
  description: seoDescription,
  keywords:    homePage.keywords || "startup factory, AI agency, venture studio, team as a service, Bangkok",
  metadataBase: new URL(DOMAIN),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    google: "k3xy5rJr7oDFqyn7NXEcImw97CLFhZi_Uh03v_GQAIw",
  },
  alternates: {
    canonical: "/",
    languages: {
      "es": `${DOMAIN}/es`,
      "en": `${DOMAIN}/en`,
      "th": `${DOMAIN}/th`,
      "x-default": DOMAIN,
    },
  },
  openGraph: {
    siteName: "Startup Factory",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
  },
};

// ── Analytics from CMS settings ──────────────────────────────
const gaMeasurementId: string | null = cmsSettings?.ga_measurement_id ?? null;
const gtmContainerId:  string | null = cmsSettings?.gtm_container_id  ?? null;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isThai = locale === "th";

  return (
    <html
      lang={locale}
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${sarabun.variable} h-full antialiased`}
    >
      <head>
        {/* Schema.org JSON-LD — CMS-driven */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* GTM — head snippet */}
        {gtmContainerId && (
          <Script id="gtm-head" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`}
          </Script>
        )}
      </head>
      <body
        className={`min-h-full flex flex-col bg-[#0F0F0F] text-[#F5F0E8] ${
          isThai ? "font-[family-name:var(--font-sarabun)]" : ""
        }`}
      >
        {/* GTM — noscript */}
        {gtmContainerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0" width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar locale={locale as Locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale as Locale} />

        {/* GA4 — only when no GTM (avoid double tracking) */}
        {gaMeasurementId && !gtmContainerId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
